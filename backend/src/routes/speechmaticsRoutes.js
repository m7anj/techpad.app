import express from 'express';
import { textToSpeech, createSpeechmaticsSTTConnection } from '../lib/speechmatics.js';

const router = express.Router();

/**
 * POST /api/speechmatics/tts
 * Convert text to speech using Speechmatics
 * Body: { text: string, voice?: string }
 * Returns: Audio file (MP3)
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;

    console.log('📢 TTS Request:', { textLength: text?.length, voice });

    if (!text) {
      console.error('❌ TTS Error: No text provided');
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate speech
    console.log('🔊 Calling Speechmatics TTS API...');
    const audioBuffer = await textToSpeech(text, voice);
    console.log('✅ TTS Success, audio size:', audioBuffer.length);

    // Return audio as MP3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('❌ TTS Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate speech', details: error.message });
  }
});

/**
 * WebSocket endpoint for real-time speech-to-text
 * ws://localhost:4000/api/speechmatics/stt
 */
export function setupSpeechmaticsWebSocket(app) {
  app.ws('/api/speechmatics/stt', (ws, req) => {
    console.log('🎤 New STT connection');

    let sttConnection = null;

    let clientSampleRate = 48000; // Default sample rate

    ws.on('message', (data) => {
      // Check if it's binary (audio) or text (JSON)
      const isBinary = Buffer.isBuffer(data) || data instanceof ArrayBuffer;

      if (!isBinary) {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 STT received message:', message.type);

          if (message.type === 'start') {
            if (!sttConnection) {
              console.log('🚀 Starting Speechmatics STT connection...');
              sttConnection = createSpeechmaticsSTTConnection(ws, {
                language: message.language || 'en',
                sampleRate: clientSampleRate,
              });
            }
          } else if (message.type === 'sampleRate') {
            clientSampleRate = message.sampleRate || 48000;
            console.log('🎙️ Client sample rate:', clientSampleRate);
          } else if (message.type === 'stop') {
            if (sttConnection) {
              console.log('🛑 Stopping Speechmatics STT connection');
              sttConnection.close();
              sttConnection = null;
            }
          }
        } catch (error) {
          console.error('❌ Error parsing STT message:', error.message);
        }
      } else {
        // Binary audio data
        if (sttConnection && sttConnection.isConnected()) {
          sttConnection.sendAudio(data);
        }
      }
    });

    ws.on('close', () => {
      console.log('STT WebSocket closed');
      if (sttConnection) {
        sttConnection.close();
      }
    });

    ws.on('error', (error) => {
      console.error('STT WebSocket error:', error);
      if (sttConnection) {
        sttConnection.close();
      }
    });
  });
}

export default router;
