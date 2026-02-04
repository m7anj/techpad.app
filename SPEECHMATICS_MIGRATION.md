# Speechmatics Integration - Migration Summary

## Overview
Successfully migrated from browser-based Web Speech API to Speechmatics for both Speech-to-Text (STT) and Text-to-Speech (TTS).

## What Changed

### Backend Changes

#### New Files Created
1. **`backend/src/lib/speechmatics.js`**
   - `textToSpeech()` - Converts text to speech using Speechmatics TTS API
   - `createSpeechmaticsSTTConnection()` - Creates WebSocket proxy to Speechmatics real-time STT

2. **`backend/src/routes/speechmaticsRoutes.js`**
   - `POST /api/speechmatics/tts` - REST endpoint for text-to-speech conversion
   - `WS /api/speechmatics/stt` - WebSocket endpoint for real-time speech-to-text

#### Modified Files
1. **`backend/src/server.js`**
   - Added import for `speechmaticsRoutes` and `setupSpeechmaticsWebSocket`
   - Registered routes: `app.use("/api/speechmatics", speechmaticsRoutes)`
   - Setup WebSocket: `setupSpeechmaticsWebSocket(app)`

2. **`backend/.env`**
   - Added: `SPEECHMATICS_API_KEY=38Wv9nbz4aGJjWPniaY9fHJicCxQCp27`

3. **`backend/.env.example`**
   - Added: `SPEECHMATICS_API_KEY="..."`
   - Removed: `ELEVENLABS_API_KEY` reference

4. **`backend/package.json`**
   - Removed dependencies:
     - `@elevenlabs/elevenlabs-js`
     - `elevenlabs`

### Frontend Changes

#### New Files Created
1. **`frontend/src/lib/speechmatics.ts`**
   - `textToSpeech()` - Fetches audio from backend TTS endpoint
   - `SpeechmaticsSTT` class - Manages real-time STT WebSocket connection with audio capture

#### Modified Files
1. **`frontend/src/pages/interview/Interview.tsx`**
   - Replaced browser `SpeechSynthesis` with Speechmatics TTS API
   - Replaced browser `SpeechRecognition` with Speechmatics WebSocket STT
   - Updated refs: `recognitionRef` → `sttRef`, added `currentAudioRef`
   - Updated cleanup logic to use Speechmatics instead of browser APIs

2. **`frontend/package.json`**
   - Removed devDependency: `@types/dom-speech-recognition`

3. **`README.md`**
   - Updated architecture section to reflect Speechmatics usage
   - Updated tech stack to show Speechmatics instead of ElevenLabs/Web Speech API

## API Endpoints

### Text-to-Speech (TTS)
**Endpoint:** `POST /api/speechmatics/tts`

**Request:**
```json
{
  "text": "Hello, how are you?",
  "voice": "en-US_AmandaNeural" // optional
}
```

**Response:** Audio file (MP3 format)

### Speech-to-Text (STT)
**Endpoint:** `WS /api/speechmatics/stt`

**Start Recognition:**
```json
{
  "type": "start",
  "language": "en"
}
```

**Stop Recognition:**
```json
{
  "type": "stop"
}
```

**Send Audio:** Binary audio data (PCM 16kHz, 16-bit)

**Receive Transcripts:**
```json
{
  "type": "transcript_interim",
  "text": "hello wor..."
}
```
```json
{
  "type": "transcript_final",
  "text": "hello world"
}
```

## Architecture Flow

### TTS Flow
1. Frontend receives question/followup from interview WebSocket
2. Frontend calls `textToSpeech(text)` from `speechmatics.ts`
3. Request sent to backend `POST /api/speechmatics/tts`
4. Backend calls Speechmatics TTS API
5. Backend returns MP3 audio to frontend
6. Frontend plays audio using `HTMLAudioElement`
7. On audio end, automatically starts STT

### STT Flow
1. Frontend creates `SpeechmaticsSTT` instance
2. On `start()`, connects to backend `WS /api/speechmatics/stt`
3. Backend creates WebSocket proxy to Speechmatics real-time API
4. Frontend captures microphone audio using `MediaRecorder` and `AudioContext`
5. Audio chunks sent to backend WebSocket as PCM data
6. Backend forwards to Speechmatics
7. Speechmatics returns interim and final transcripts
8. Backend forwards transcripts to frontend
9. Frontend updates UI with interim (gray) and final (black) text

## Benefits of Speechmatics

1. **Unified API** - Single provider for both STT and TTS
2. **Better Quality** - Professional-grade speech synthesis and recognition
3. **Real-time Streaming** - Low-latency transcription during interviews
4. **Reliability** - Cloud-based service vs browser inconsistencies
5. **Cross-browser** - Works everywhere (no reliance on browser APIs)
6. **No Rate Limits** - Unlike browser APIs that can be flaky

## Environment Variables

Make sure to set the following in your deployment:

### Backend (.env)
```bash
SPEECHMATICS_API_KEY=38Wv9nbz4aGJjWPniaY9fHJicCxQCp27
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-backend-url.render.com
```

## Testing

### Local Development
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Create an interview session
4. Verify TTS plays audio for questions
5. Verify STT captures your voice responses
6. Check browser console for any errors

### Production Deployment
1. Ensure `SPEECHMATICS_API_KEY` is set in Render environment variables
2. Ensure `VITE_API_BASE_URL` points to your Render backend URL
3. Rebuild and deploy both frontend and backend
4. Test end-to-end interview flow

## Cleanup Recommendations

Run the following to remove old dependencies:

```bash
# Backend
cd backend
npm uninstall @elevenlabs/elevenlabs-js elevenlabs
npm install

# Frontend
cd frontend
npm uninstall @types/dom-speech-recognition
npm install
```

## Migration Complete ✅

Your app now uses Speechmatics for both STT and TTS! The integration is:
- ✅ Fully implemented
- ✅ Backend routes configured
- ✅ Frontend components updated
- ✅ README documentation updated
- ✅ Environment variables configured
- ✅ Old dependencies removed
