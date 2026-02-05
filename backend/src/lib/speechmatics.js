import WebSocket from 'ws';

const SPEECHMATICS_API_KEY = process.env.SPEECHMATICS_API_KEY;
const SPEECHMATICS_TTS_BASE_URL = 'https://preview.tts.speechmatics.com/generate';
const SPEECHMATICS_STT_URL = 'wss://eu2.rt.speechmatics.com/v2';
const SPEECHMATICS_BATCH_URL = 'https://asr.api.speechmatics.com/v2/jobs';

/**
 * Convert text to speech using Speechmatics TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice name (default: 'sarah')
 * @returns {Promise<Buffer>} - Audio buffer in MP3 format
 */
export async function textToSpeech(text, voice = 'sarah') {
  try {
    const ttsUrl = `${SPEECHMATICS_TTS_BASE_URL}/${voice}`;

    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Speechmatics TTS API error:', response.status, error);
      throw new Error(`Speechmatics TTS API error: ${response.status} - ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return audioBuffer;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Create a WebSocket proxy to Speechmatics real-time STT
 * This function creates a connection to Speechmatics and returns handlers
 * @param {WebSocket} clientWs - Client WebSocket connection
 * @param {Object} config - Configuration options
 * @returns {Object} - Connection handlers
 */
export function createSpeechmaticsSTTConnection(clientWs, config = {}) {
  console.log('🔌 Creating Speechmatics connection...');
  console.log('   URL:', SPEECHMATICS_STT_URL);
  console.log('   API Key set:', !!SPEECHMATICS_API_KEY, SPEECHMATICS_API_KEY ? `(${SPEECHMATICS_API_KEY.substring(0, 8)}...)` : '(missing)');

  if (!SPEECHMATICS_API_KEY) {
    console.error('❌ SPEECHMATICS_API_KEY is not set!');
    clientWs.send(JSON.stringify({ type: 'stt_error', error: 'API key not configured' }));
    return { sendAudio: () => {}, close: () => {}, isConnected: () => false };
  }

  const speechmaticsWs = new WebSocket(SPEECHMATICS_STT_URL, {
    headers: {
      'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
    },
  });

  let isConnected = false;

  speechmaticsWs.on('open', () => {
    console.log('✅ Connected to Speechmatics STT');
    isConnected = true;

    // Send start recognition message with raw PCM audio format
    const sampleRate = config.sampleRate || 48000;
    console.log('🎙️ Using sample rate for Speechmatics:', sampleRate);

    const startMessage = {
      message: 'StartRecognition',
      audio_format: {
        type: 'raw',
        encoding: 'pcm_s16le',
        sample_rate: sampleRate,
      },
      transcription_config: {
        language: config.language || 'en',
        enable_partials: true,
        max_delay: 3.0, // Longer delay = fewer, more complete transcripts
      },
    };

    speechmaticsWs.send(JSON.stringify(startMessage));
    console.log('📤 Sent StartRecognition to Speechmatics (PCM 44.1kHz)');

    // Notify client that STT is ready
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'stt_ready',
        message: 'Speech-to-text is ready',
      }));
    }
  });

  speechmaticsWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Speechmatics message:', message.message, message);

      // Handle different message types
      if (message.message === 'AddPartialTranscript') {
        // Interim results
        const text = message.metadata?.transcript || '';
        console.log('📝 Interim transcript:', text);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'transcript_interim',
            text: text,
          }));
        }
      } else if (message.message === 'AddTranscript') {
        // Final results
        const text = message.metadata?.transcript || '';
        console.log('✅ Final transcript:', text);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'transcript_final',
            text: text,
          }));
        }
      } else if (message.message === 'EndOfTranscript') {
        console.log('🏁 End of transcript');
      } else if (message.message === 'RecognitionStarted') {
        console.log('🎙️ Speechmatics recognition started');
      } else if (message.message === 'Error') {
        console.error('❌ Speechmatics STT error:', message);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'stt_error',
            error: message.reason || 'Unknown error',
          }));
        }
      }
    } catch (error) {
      console.error('Error parsing Speechmatics message:', error);
    }
  });

  speechmaticsWs.on('error', (error) => {
    console.error('❌ Speechmatics WebSocket error:', error.message || error);
    console.error('   Full error:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'stt_error',
        error: error.message || 'Connection failed',
      }));
    }
  });

  speechmaticsWs.on('close', () => {
    console.log('Speechmatics STT connection closed');
    isConnected = false;
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'stt_closed',
        message: 'Speech-to-text connection closed',
      }));
    }
  });

  // Track audio chunks for debugging
  let audioChunkCount = 0;

  // Return handlers for the connection
  return {
    sendAudio: (audioData) => {
      if (isConnected && speechmaticsWs.readyState === WebSocket.OPEN) {
        audioChunkCount++;
        if (audioChunkCount % 50 === 1) {
          console.log(`🔊 Audio chunk #${audioChunkCount}, size: ${audioData.length} bytes`);
        }
        // Send audio data as binary
        speechmaticsWs.send(audioData);
      }
    },
    close: () => {
      if (speechmaticsWs.readyState === WebSocket.OPEN) {
        // Send end of stream message
        speechmaticsWs.send(JSON.stringify({
          message: 'EndOfStream',
        }));
        speechmaticsWs.close();
      }
    },
    isConnected: () => isConnected,
  };
}
