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
  private audioContext: AudioContext | null = null;
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
      console.log('Already recording');
      return;
    }

    try {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create AudioContext for audio processing
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);

      // Create a processor to get raw audio data
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          this.ws.send(pcmData.buffer);
        }
      };

      // Also use MediaRecorder as backup
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Send as binary data
          event.data.arrayBuffer().then((buffer) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(buffer);
            }
          });
        }
      };

      this.mediaRecorder.start(100); // Send data every 100ms
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
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.ws) {
      this.ws.close();
    }

    this.mediaRecorder = null;
    this.audioContext = null;
    this.ws = null;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
