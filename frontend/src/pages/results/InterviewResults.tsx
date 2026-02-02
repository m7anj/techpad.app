import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import { apiUrl } from "../../lib/api";
import "../../styles/shared-layout.css";
import "./InterviewResults.css";

interface InterviewResult {
  id: string;
  interviewId: string;
  timeTaken: number;
  score: number | null;
  completedAt: string;
  feedback: any;
  interview: {
    type: string;
    topic: string | null;
    difficulty: string;
  };
}

const InterviewResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await fetch(apiUrl(`/myInterviews/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch interview result");
        }

        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Error fetching interview result:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id, getToken]);

  if (loading) {
    return (
      <div className="results-page page-wrapper">
        <Navbar />
        <main className="main">
          <div className="container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your results...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-page page-wrapper">
        <Navbar />
        <main className="main">
          <div className="container">
            <div className="error-state">
              <h2>Interview not found</h2>
              <button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  return (
    <div className="results-page page-wrapper">
      <Navbar />
      <main className="main">
        <div className="container">
          <div className="results-header">
            <h1 className="results-title">Interview Complete!</h1>
            <p className="results-subtitle">Here's how you performed</p>
          </div>

          <div className="score-display">
            <div className="score-circle" style={{ borderColor: getScoreColor(result.score || 0) }}>
              <div className="score-value" style={{ color: getScoreColor(result.score || 0) }}>
                {result.score !== null ? Math.round(result.score) : "N/A"}
              </div>
              <div className="score-label">Score</div>
            </div>
            <div className="grade-badge" style={{ borderColor: getScoreColor(result.score || 0) }}>
              {result.score !== null ? getScoreGrade(result.score) : "N/A"}
            </div>
          </div>

          <div className="interview-details">
            <h2>{result.interview.type}</h2>
            {result.interview.topic && <p className="topic">{result.interview.topic}</p>}
            <div className="detail-tags">
              <span className={`difficulty-pill ${result.interview.difficulty.toLowerCase()}`}>
                {result.interview.difficulty}
              </span>
              <span className="time-taken">
                ⏱ {Math.round(result.timeTaken / 60)} min
              </span>
            </div>
          </div>

          {result.feedback && (
            <div className="feedback-section">
              <h3>Feedback</h3>
              <div className="feedback-content">
                {typeof result.feedback === 'string'
                  ? result.feedback
                  : JSON.stringify(result.feedback, null, 2)}
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Take Another Interview
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewResults;
