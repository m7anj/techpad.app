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

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate speech
    const audioBuffer = await textToSpeech(text, voice);

    // Return audio as MP3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
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

    ws.on('message', (data) => {
      try {
        // Try to parse as JSON first (for control messages)
        const message = JSON.parse(data.toString());

        if (message.type === 'start') {
          // Start STT connection
          if (!sttConnection) {
            console.log('Starting Speechmatics STT connection');
            sttConnection = createSpeechmaticsSTTConnection(ws, {
              language: message.language || 'en',
            });
          }
        } else if (message.type === 'stop') {
          // Stop STT connection
          if (sttConnection) {
            console.log('Stopping Speechmatics STT connection');
            sttConnection.close();
            sttConnection = null;
          }
        }
      } catch (error) {
        // If not JSON, treat as binary audio data
        if (sttConnection && sttConnection.isConnected()) {
          // Forward audio to Speechmatics
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
