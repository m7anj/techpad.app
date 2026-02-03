import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Editor from "@monaco-editor/react";
import { wsUrl } from "../../lib/api";
import "./Interview.css";
import { Whiteboard, WhiteboardRef } from "../../components/Whiteboard";
import { Navbar } from "../../components/Navbar";

const Interview = () => {
  const { id: sessionToken } = useParams();
  const navigate = useNavigate();

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // WebSocket connection
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [_timer, setTimer] = useState(0);
  const [isFollowup, setIsFollowup] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // interim transcript for grey text display
  const [interimTranscript, setInterimTranscript] = useState("");

  // play audio from base64 encoded mp3
  const playAudio = (base64Audio: string) => {
    try {
      // stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsAudioPlaying(true);
      setIsWaitingForResponse(false);

      // convert base64 to audio blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(blob);

      // create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch((err) => console.error("error playing audio:", err));

      // cleanup url when done and start voice recognition
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsAudioPlaying(false);
        // automatically start voice recognition after audio finishes
        setTimeout(() => startListening(), 100);
      };
    } catch (error) {
      console.error("error decoding audio:", error);
      setIsAudioPlaying(false);
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
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

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

    const socket = new WebSocket(
      wsUrl(`/interview/${sessionToken}`),
    );

    socket.onopen = () => {
      setIsConnected(true);
      setIsWaitingForResponse(true);
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

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
        setIsWaitingForResponse(false);

        // Stop recording if active
        if (recognitionRef.current && isRecording) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.log("Recognition already stopped");
          }
          setIsRecording(false);
          setAnswer("");
          setInterimTranscript("");
        }

        // Reset code and whiteboard for new main question
        if (data.resetEditor) {
          setCode("");
          if (whiteboardRef.current) {
            whiteboardRef.current.clear();
          }
        }

        // play audio if available
        if (data.audio) {
          playAudio(data.audio);
        }
      } else if (data.type === "followup") {
        setCurrentQuestion(data.followup.question);
        setIsFollowup(true);
        setIsWaitingForResponse(false);
        // play audio if available
        if (data.audio) {
          playAudio(data.audio);
        }
      } else if (data.type === "interviewComplete") {
        setIsCompleting(true);
        setCurrentQuestion("Interview complete! Saving your results...");
        setIsFollowup(false);
        setIsWaitingForResponse(false);

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

      // stop audio when disconnecting
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // stop recognition
      stopListening();

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
      // stop audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopListening();
      socket.close();
    };
  }, [sessionToken, navigate, isCompleting]);

  // Timer - starts automatically when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        // update interim transcript for grey text display
        setInterimTranscript(interim);

        // append final transcript to answer
        if (final) {
          setAnswer((prev) => prev + final + " ");
        }
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        setIsRecording(false);
        setInterimTranscript("");
      };

      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        if (event.error === "aborted" || event.error === "no-speech") {
          // These are recoverable errors, just mark as not recording
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.log("NO SPEECH RECOGNITION");
    }
  }, []);

  // Start listening automatically
  const startListening = () => {
    if (!recognitionRef.current || isAudioPlaying) return;

    // If already recording, don't start again
    if (isRecording) {
      console.log("Already recording, skipping start");
      return;
    }

    try {
      console.log("Starting recognition...");
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error: any) {
      // If already started, ignore the error
      if (error.message && error.message.includes("already started")) {
        console.log("Recognition already started");
        setIsRecording(true);
      } else {
        console.error("Error starting recognition:", error);
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      console.log("Stopping recognition...");
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript("");
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
  };

  // Camera toggle
  const toggleCamera = () => {
    setCameraOn(!cameraOn);
  };

  // Submit answer
  const submitAnswer = () => {
    if (!ws || !answer.trim() || interimTranscript) return;

    // stop listening when submitting
    stopListening();

    // set waiting state immediately
    setIsWaitingForResponse(true);

    // get whiteboard canvas and convert to base64
    let whiteboardBase64 = null;
    const canvas = whiteboardRef.current?.getCanvas();
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png");
      whiteboardBase64 = dataURL.split(",")[1];
    }

    // Send message with answer, code, and whiteboard
    const messageType = isFollowup ? "followupAnswer" : "questionAnswer";

    ws.send(
      JSON.stringify({
        type: messageType,
        content: answer,
        code: code || null,
        whiteboard: whiteboardBase64,
      }),
    );

    console.log("📤 Sent " + messageType + " with:", {
      answer: answer.substring(0, 50) + "...",
      hasCode: !!code,
      hasWhiteboard: !!whiteboardBase64,
    });

    // clear answer and interim immediately
    setAnswer("");
    setInterimTranscript("");
    // Note: Not clearing code/whiteboard in case user wants to keep working on them
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

              {/* Recording Indicator */}
              {isRecording && (
                <div className="recording-indicator">
                  <span className="rec-dot">●</span>
                </div>
              )}

              {/* Send Button Overlay */}
              {answer.trim() && !interimTranscript && (
                <button
                  onClick={submitAnswer}
                  className="send-btn-overlay"
                  disabled={isWaitingForResponse || !!interimTranscript}
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
