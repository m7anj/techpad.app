import { apiUrl, wsUrl } from './api';

/**
 * Convert text to speech using Speechmatics TTS API
 * Returns an Audio object ready to play
 */
export async function textToSpeech(text: string, voice?: string): Promise<HTMLAudioElement> {
  const response = await fetch(apiUrl('/api/speechmatics/tts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return audio;
}

/**
 * Create a Speechmatics STT WebSocket connection
 */
export class SpeechmaticsSTT {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private onInterimTranscript?: (text: string) => void;
  private onFinalTranscript?: (text: string) => void;
  private onError?: (error: string) => void;
  private isRecording = false;

  constructor(callbacks: {
    onInterimTranscript?: (text: string) => void;
    onFinalTranscript?: (text: string) => void;
    onError?: (error: string) => void;
  }) {
    this.onInterimTranscript = callbacks.onInterimTranscript;
    this.onFinalTranscript = callbacks.onFinalTranscript;
    this.onError = callbacks.onError;
  }

  async start(): Promise<void> {
    if (this.isRecording) {
      console.log('🎤 STT: Already recording, skipping start');
      return;
    }

    // Clean up any existing connection first
    if (this.ws || this.mediaRecorder) {
      console.log('🎤 STT: Cleaning up old connection before starting new one');
      this.cleanup();
    }

    try {
      console.log('🎤 STT: Creating new WebSocket connection');
      // Connect to Speechmatics WebSocket
      this.ws = new WebSocket(wsUrl('/api/speechmatics/stt'));

      this.ws.onopen = async () => {
        console.log('Connected to Speechmatics STT');

        // Send start message
        this.ws?.send(JSON.stringify({ type: 'start', language: 'en' }));

        // Start capturing audio from microphone
        await this.startAudioCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'transcript_interim' && this.onInterimTranscript) {
            this.onInterimTranscript(data.text);
          } else if (data.type === 'transcript_final' && this.onFinalTranscript) {
            this.onFinalTranscript(data.text);
          } else if (data.type === 'stt_error' && this.onError) {
            this.onError(data.error);
          }
        } catch (error) {
          console.error('Error parsing STT message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('STT WebSocket error:', error);
        if (this.onError) {
          this.onError('Connection error');
        }
      };

      this.ws.onclose = () => {
        console.log('STT WebSocket closed');
        this.cleanup();
      };

      this.isRecording = true;
    } catch (error) {
      console.error('Error starting STT:', error);
      if (this.onError) {
        this.onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async startAudioCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Create AudioContext to get raw PCM data
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessor to get raw audio samples
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM S16 LE)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Clamp to [-1, 1] and convert to 16-bit
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send PCM data as binary
          this.ws.send(pcmData.buffer);
        }
      };

      // Store references for cleanup
      this.mediaRecorder = {
        stream,
        audioContext,
        processor,
        state: 'recording'
      } as any;

    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (this.onError) {
        this.onError('Microphone access denied');
      }
    }
  }

  stop(): void {
    if (!this.isRecording) {
      return;
    }

    // Send stop message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'stop' }));
    }

    this.cleanup();
  }

  private cleanup(): void {
    console.log('🎤 STT: Cleaning up connection');
    this.isRecording = false;

    if (this.mediaRecorder) {
      const recorder = this.mediaRecorder as any;

      // Stop audio context and processor
      if (recorder.processor) {
        try {
          recorder.processor.disconnect();
        } catch (e) {
          console.log('Processor already disconnected');
        }
      }
      if (recorder.audioContext) {
        try {
          recorder.audioContext.close();
        } catch (e) {
          console.log('AudioContext already closed');
        }
      }
      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      try {
        this.ws.close();
      } catch (e) {
        console.log('WebSocket already closed');
      }
    }

    this.mediaRecorder = null;
    this.ws = null;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
