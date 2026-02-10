import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Editor from "@monaco-editor/react";
import { wsUrl } from "../../lib/api";
import "./Interview.css";
import { Whiteboard, WhiteboardRef } from "../../components/Whiteboard";
import { Navbar } from "../../components/Navbar";
import { useCache } from "../../contexts/CacheContext";
import { AudioRecorder } from "../../lib/speechmatics";

const Interview = () => {
  const { id: sessionToken } = useParams();
  const navigate = useNavigate();
  const { clearCache } = useCache();

  const recorderRef = useRef<AudioRecorder | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingTextRef = useRef<string | null>(null);

  // WebSocket connection
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isFollowup, setIsFollowup] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Browser TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Play Speechmatics WAV audio via Audio element
  const speakText = async (audioBase64: string) => {
    console.log("🔊 TTS: Playing Speechmatics audio");

    // Stop any ongoing speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);
    setIsWaitingForResponse(false);

    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        console.log("✅ TTS: Finished playing");
        setIsSpeaking(false);
        currentAudioRef.current = null;
        setTimeout(() => startRecording(), 100);
      };

      audio.onerror = () => {
        console.error("❌ TTS playback error");
        setIsSpeaking(false);
        currentAudioRef.current = null;
        setTimeout(() => startRecording(), 100);
      };

      await audio.play();
    } catch (error) {
      console.error("❌ Error playing audio:", error);
      setIsSpeaking(false);
      setTimeout(() => startRecording(), 100);
    }
  };

  // Handle incoming text: play audio if provided, otherwise wait for separate audio message
  const handleIncomingText = (audioBase64?: string) => {
    pendingTextRef.current = null;

    if (audioBase64) {
      // Audio included inline — play immediately
      speakText(audioBase64);
    } else {
      // Audio will arrive as separate 'audio' message — wait for Speechmatics
      pendingTextRef.current = "waiting";
      setIsSpeaking(true);
      setIsWaitingForResponse(false);
    }
  };

  // Tools state
  const [activeTab, setActiveTab] = useState<"code" | "whiteboard">("code");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  // Camera
  const webcamRef = useRef<Webcam>(null);
  const [cameraOn, setCameraOn] = useState(true);

  // Whiteboard
  const whiteboardRef = useRef<WhiteboardRef>(null);

  // Navigation warning
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Initialize AudioRecorder when component mounts
  useEffect(() => {
    recorderRef.current = new AudioRecorder();

    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
    };
  }, []);

  // Warn before navigating away or closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConnected && !isCompleting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isConnected, isCompleting]);

  // Handle navigation confirmation
  const handleNavigationAttempt = (path: string) => {
    if (isConnected && !isCompleting) {
      setPendingNavigation(path);
      setShowNavigationWarning(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const cancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  // WEB SOCKET CONNECTION
  useEffect(() => {
    if (!sessionToken) {
      console.error("No session token provided");
      navigate("/dashboard");
      return;
    }

    let isCleanedUp = false;
    const socket = new WebSocket(wsUrl(`/interview/${sessionToken}`));

    // Ping interval to keep WebSocket alive through Render's proxy
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    socket.onopen = () => {
      if (isCleanedUp) return;
      setIsConnected(true);
      setIsWaitingForResponse(true);
      console.log("WebSocket connection opened");

      // Send ping every 30s to prevent idle timeout on Render's load balancer
      pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "pong") console.log("Received:", data.type, data.type === "audio" ? "(audio data)" : data);

      if (data.type === "error") {
        console.error("Interview error:", data.message);
        alert(`Error: ${data.message}`);
        navigate("/dashboard");
        return;
      }

      if (data.type === "question") {
        setIsConnected(true);
        setCurrentQuestion(data.question);
        setIsFollowup(false);

        // Reset code and whiteboard for new main question
        if (data.resetEditor) {
          setCode("");
          if (whiteboardRef.current) {
            whiteboardRef.current.clear();
          }
        }

        handleIncomingText(data.audio);
      } else if (data.type === "followup") {
        setCurrentQuestion(data.followup.question);
        setIsFollowup(true);

        handleIncomingText(data.audio);
      } else if (data.type === "audio") {
        // Separate audio message — arrives after text when TTS wasn't cached
        if (pendingTextRef.current) {
          console.log("▶️ TTS audio arrived, playing Speechmatics voice");
          pendingTextRef.current = null;
          speakText(data.audio);
        }
      } else if (data.type === "audioFailed") {
        // TTS generation failed on backend — skip audio, start recording
        if (pendingTextRef.current) {
          console.log("⚠️ TTS failed on server, skipping audio");
          pendingTextRef.current = null;
          setIsSpeaking(false);
          setTimeout(() => startRecording(), 100);
        }
      } else if (data.type === "interviewComplete") {
        setIsCompleting(true);
        setCurrentQuestion("Interview complete! Saving  your results...");
        setIsFollowup(false);
        setIsWaitingForResponse(false);

        // Clear cached user data so Navbar refetches (updated interview count)
        clearCache("userData");

        // Navigate to results page with the result ID
        setTimeout(() => {
          if (data.resultId) {
            navigate(`/results/${data.resultId}`);
          } else {
            navigate("/dashboard");
          }
        }, 2000);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from interview");
      setIsConnected(false);

      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      pendingTextRef.current = null;

      // Stop TTS when disconnecting
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Cancel recording
      if (recorderRef.current) {
        recorderRef.current.cancel();
        setIsRecording(false);
      }

      // If interview was completing, wait a bit then redirect
      if (isCompleting) {
        setIsSaving(true);
        setTimeout(() => {
          navigate("/my-interviews");
        }, 2000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWs(socket);

    return () => {
      isCleanedUp = true;
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      pendingTextRef.current = null;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      socket.close();
    };
  }, [sessionToken, navigate, isCompleting]);

  // Start recording
  const startRecording = async () => {
    if (!recorderRef.current || isSpeaking) return;

    if (isRecording) {
      console.log("Already recording, skipping start");
      return;
    }

    try {
      console.log("🎤 Starting recording...");
      await recorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop recording
  const stopRecording = async (): Promise<Blob | null> => {
    if (!recorderRef.current || !isRecording) return null;

    try {
      console.log("🛑 Stopping recording...");
      const audioBlob = await recorderRef.current.stop();
      setIsRecording(false);
      return audioBlob;
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      return null;
    }
  };

  // Camera toggle
  const toggleCamera = () => {
    setCameraOn(!cameraOn);
  };

  // Submit answer
  const submitAnswer = async () => {
    console.log("🔘 Submit clicked");

    if (!ws) {
      console.error("❌ No WebSocket connection");
      alert("No connection to interview server. Please refresh the page.");
      return;
    }

    // Stop recording and get audio
    const audioBlob = await stopRecording();

    if (!audioBlob || audioBlob.size === 0) {
      console.error("❌ No audio recorded");
      alert("No audio recorded. Please try again.");
      return;
    }

    // Convert audio to base64
    const audioBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(audioBlob);
    });

    console.log("📤 Audio recorded, size:", audioBlob.size, "bytes");

    // Set waiting state
    setIsWaitingForResponse(true);

    // Get whiteboard canvas and convert to base64 (only if user has drawn something)
    let whiteboardBase64 = null;
    if (whiteboardRef.current?.hasContent()) {
      const canvas = whiteboardRef.current.getCanvas();
      if (canvas) {
        const dataURL = canvas.toDataURL("image/png");
        whiteboardBase64 = dataURL.split(",")[1];
      }
    }

    // Send message with audio, code, and whiteboard
    const messageType = isFollowup ? "followupAnswer" : "questionAnswer";

    ws.send(
      JSON.stringify({
        type: messageType,
        audio: audioBase64,
        audioMimeType: audioBlob.type,
        code: code || null,
        whiteboard: whiteboardBase64,
      }),
    );

    console.log("📤 Sent " + messageType + " with audio");
  };

  return (
    <div className="interview-page">
      <Navbar onNavigate={handleNavigationAttempt} />

      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="modal-overlay" onClick={cancelNavigation}>
          <div
            className="modal-content navigation-warning"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="warning-icon">⚠️</div>
            <h2 className="warning-title">Leave Interview?</h2>
            <p className="warning-message">
              Your interview is still in progress. If you leave now, your
              current session will be lost and you won't be able to resume.
            </p>
            <div className="warning-actions">
              <button className="btn-cancel" onClick={cancelNavigation}>
                Stay in Interview
              </button>
              <button className="btn-confirm-leave" onClick={confirmNavigation}>
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Overlay */}
      {(isCompleting || isSaving) && (
        <div className="completion-overlay">
          <div className="completion-content">
            <div className="completion-icon">{isSaving ? "💾" : "🎉"}</div>
            <h2 className="completion-title">
              {isSaving ? "Saving Results..." : "Interview Complete!"}
            </h2>
            <p className="completion-message">
              {isSaving
                ? "We're saving your interview results to your profile."
                : "Great job! Your responses are being processed."}
            </p>
            <div className="completion-spinner"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="interview-container">
        <div className="interview-grid">
          {/* Left Column */}
          <div className="interview-left">
            {/* Camera with Overlays */}
            <div className="camera-section">
              <button onClick={toggleCamera} className="camera-toggle">
                {cameraOn ? "Camera Off" : "Camera On"}
              </button>
              <div className="camera-view">
                {cameraOn ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: "user",
                      width: 1280,
                      height: 720,
                    }}
                    className="camera-video"
                  />
                ) : (
                  <div className="camera-placeholder">Camera is off</div>
                )}
              </div>

              {/* Question Overlay */}
              <div className="question-overlay">
                {isWaitingForResponse ? (
                  <div className="overlay-loading">
                    <div className="loading-spinner-small"></div>
                  </div>
                ) : (
                  <p className="overlay-question">{currentQuestion}</p>
                )}
              </div>

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="recording-indicator speaking">
                  <span className="rec-dot">🔊</span>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && !isSpeaking && (
                <div className="recording-indicator">
                  <span className="rec-dot">●</span>
                </div>
              )}

              {/* Send Button Overlay - show when recording */}
              {isRecording && !isSpeaking && (
                <button
                  onClick={submitAnswer}
                  className="send-btn-overlay"
                  disabled={isWaitingForResponse}
                >
                  <svg
                    className="send-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Tools */}
          <div className="interview-right">
            <div className="tools-header">
              <span className="workspace-label">Workspace</span>
              <div className="tools-tabs">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`tool-tab ${activeTab === "code" ? "active" : ""}`}
                >
                  <span className="tab-icon">{"</>"}</span>
                  <span>Code</span>
                </button>
                <button
                  onClick={() => setActiveTab("whiteboard")}
                  className={`tool-tab ${activeTab === "whiteboard" ? "active" : ""}`}
                >
                  <span className="tab-icon">✏️</span>
                  <span>Whiteboard</span>
                </button>
              </div>
            </div>

            <div className="tools-content">
              <div
                className="code-workspace"
                style={{ display: activeTab === "code" ? "block" : "none" }}
              >
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-selector"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    acceptSuggestionOnCommitCharacter: false,
                    acceptSuggestionOnEnter: "off",
                    wordBasedSuggestions: "off",
                  }}
                />
              </div>
              <div
                style={{
                  display: activeTab === "whiteboard" ? "block" : "none",
                  height: "100%",
                }}
              >
                <Whiteboard
                  ref={whiteboardRef}
                  isActive={activeTab === "whiteboard"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;