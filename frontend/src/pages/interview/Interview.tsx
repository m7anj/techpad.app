import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import Editor from "@monaco-editor/react";
import "./Interview.css";
import { Whiteboard } from "../../components/Whiteboard";

const Interview = () => {
  const { id } = useParams();
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

  // Tools state
  const [activeTab, setActiveTab] = useState<"code" | "whiteboard">("code");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  // Camera
  const webcamRef = useRef<Webcam>(null);
  const [cameraOn, setCameraOn] = useState(true);

  // WEB SOCKET CONNECTION
  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:4000/interview/${id}`);

    socket.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connection opened");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      if (data.type === "question") {
        setIsConnected(true);
        setCurrentQuestion(data.question);
      } else if (data.type === "followup") {
        setCurrentQuestion(data.followup.question);
      } else if (data.type === "interviewComplete") {
        setCurrentQuestion("Interview complete! Thank you.");
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
  }, [id]);

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

    ws.send(
      JSON.stringify({
        type: "questionAnswer",
        content: answer + "\nCode: " + code,
      }),
    );

    setAnswer("");
    setCode("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="interview-page">
      {/* Header */}
      <div className="interview-header">
        <div className="container">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost back-btn"
          >
            ← Back
          </button>
          <h1 className="interview-title">{preset?.type || "Interview"}</h1>
          <div className="interview-timer">⏱️ {formatTime(timer)}</div>
        </div>
      </div>

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
              {activeTab === "code" ? (
                <div className="code-workspace">
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
              ) : (
                <Whiteboard />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
