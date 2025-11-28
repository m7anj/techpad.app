/**
 * WebSocket Service for Interview Sessions
 *
 * Handles all WebSocket communication between frontend and backend during interviews.
 * Manages connection lifecycle, message handling, and data transmission.
 */

export type MessageType =
  | "ping"
  | "questionAnswer"
  | "followupAnswer"
  | "question"
  | "followup"
  | "interviewComplete"
  | "error";

export interface QuestionMessage {
  type: "question";
  question: string;
  questionIndex: number;
}

export interface FollowupMessage {
  type: "followup";
  followup: {
    question: string;
    isThisTheEnd: boolean;
    forWhatQuestion: number;
  };
}

export interface CompleteMessage {
  type: "interviewComplete";
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerMessage =
  | QuestionMessage
  | FollowupMessage
  | CompleteMessage
  | ErrorMessage;

export interface InterviewWebSocketCallbacks {
  onConnected?: () => void;
  onQuestion?: (question: string, index: number) => void;
  onFollowup?: (question: string, isEnd: boolean, forQuestion: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onDisconnected?: () => void;
}

export class InterviewWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: InterviewWebSocketCallbacks;
  private interviewId: string;

  constructor(interviewId: string, callbacks: InterviewWebSocketCallbacks) {
    this.interviewId = interviewId;
    this.callbacks = callbacks;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    const wsUrl = `ws://localhost:3000/interview/${this.interviewId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");
      this.callbacks.onConnected?.();
    };

    this.ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      console.log("📥 Received:", message);

      switch (message.type) {
        case "question":
          this.callbacks.onQuestion?.(message.question, message.questionIndex);
          break;
        case "followup":
          this.callbacks.onFollowup?.(
            message.followup.question,
            message.followup.isThisTheEnd,
            message.followup.forWhatQuestion,
          );
          break;
        case "interviewComplete":
          this.callbacks.onComplete?.();
          break;
        case "error":
          this.callbacks.onError?.(message.message);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      this.callbacks.onDisconnected?.();
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      this.callbacks.onError?.("Connection error");
    };
  }

  /**
   * Send answer to question with optional code and whiteboard image
   *
   * @param answer - Text answer from user
   * @param code - Code snippet (optional)
   * @param whiteboardImageBase64 - Base64 encoded whiteboard image (optional)
   */
  sendQuestionAnswer(
    answer: string,
    code?: string,
    whiteboardImageBase64?: string,
  ) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const message = {
      type: "questionAnswer",
      content: answer,
      code: code || null,
      whiteboard: whiteboardImageBase64 || null,
    };

    console.log("📤 Sending question answer");
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send answer to followup question with optional code and whiteboard
   */
  sendFollowupAnswer(
    answer: string,
    code?: string,
    whiteboardImageBase64?: string,
  ) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const message = {
      type: "followupAnswer",
      content: answer,
      code: code || null,
      whiteboard: whiteboardImageBase64 || null,
    };

    console.log("📤 Sending followup answer");
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "ping" }));
  }

  /**
   * Close the WebSocket connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Helper function to convert canvas to base64 image
 * Call this from your whiteboard component to get the image data
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png").split(",")[1]; // Remove "data:image/png;base64," prefix
}
