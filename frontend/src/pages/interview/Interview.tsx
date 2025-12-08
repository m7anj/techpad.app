import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import Editor from "@monaco-editor/react";
import "./Interview.css";
import { Whiteboard, WhiteboardRef } from "../../components/Whiteboard";
import { Navbar } from "../../components/Navbar";

const Interview = () => {
  const { id: sessionToken } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preset = location.state?.preset;

  // WebSocket connection
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(0);
  const [isFollowup, setIsFollowup] = useState(false);

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

  // Warn before navigating away or closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isConnected) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isConnected]);

  // WEB SOCKET CONNECTION
  useEffect(() => {
    if (!sessionToken) {
      console.error("No session token provided");
      navigate("/dashboard");
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:4000/interview/${sessionToken}`,
    );

    socket.onopen = () => {
      setIsConnected(true);
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
      } else if (data.type === "followup") {
        setCurrentQuestion(data.followup.question);
        setIsFollowup(true);
      } else if (data.type === "interviewComplete") {
        setCurrentQuestion("Interview complete! Thank you.");
        setIsFollowup(false);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from interview");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWs(socket);

    return () => socket.close();
  }, [sessionToken, navigate]);

  // Timer - starts automatically when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Camera toggle
  const toggleCamera = () => {
    setCameraOn(!cameraOn);
  };

  // Submit answer
  const submitAnswer = () => {
    if (!ws || !answer.trim()) return;

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

    setAnswer("");
    // Note: Not clearing code/whiteboard in case user wants to keep working on them
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="interview-page">
      <Navbar />

      {/* Main Content */}
      <div className="interview-container">
        <div className="interview-grid">
          {/* Left Column */}
          <div className="interview-left">
            {/* Camera */}
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
                    }}
                    className="camera-video"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                ) : (
                  <div className="camera-placeholder">Camera is off</div>
                )}
              </div>
            </div>

            {/* Question */}
            <div className="question-section">
              <div className="question-header">
                <span className="question-label">Question</span>
              </div>
              {currentQuestion ? (
                <p className="question-text">{currentQuestion}</p>
              ) : (
                <p className="question-text question-placeholder">
                  Waiting for question...
                </p>
              )}
            </div>

            {/* Answer Section */}
            <div className="answer-section">
              <div className="answer-input-group">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="answer-input-compact"
                />
                <button onClick={submitAnswer} className="submit-btn-compact">
                  Send
                </button>
              </div>
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
                <Whiteboard ref={whiteboardRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
