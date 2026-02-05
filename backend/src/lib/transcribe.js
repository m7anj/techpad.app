import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Transcribe audio using Groq's Whisper API
 * @param {Buffer} audioBuffer - Audio data as a Buffer
 * @param {string} mimeType - MIME type of the audio (e.g., 'audio/webm')
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  try {
    console.log('🎙️ Transcribing audio, size:', audioBuffer.length, 'bytes, type:', mimeType);

    // Determine file extension from mime type
    const ext = mimeType.includes('webm') ? 'webm'
              : mimeType.includes('ogg') ? 'ogg'
              : mimeType.includes('mp4') ? 'mp4'
              : mimeType.includes('wav') ? 'wav'
              : 'webm';

    // Create a File-like object for Groq
    const audioFile = new File([audioBuffer], `audio.${ext}`, { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'text',
    });

    console.log('✅ Transcription complete:', transcription.substring(0, 100) + '...');
    return transcription;
  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    throw error;
  }
}
