import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import "./MyInterviews.css";

interface Interview {
  _id: string;
  userId: string;
  interviewType: string;
  completedAt: Date;
  duration: number;
  score?: number;
  feedback?: string;
}

const MyInterviews = () => {
  const { getToken } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:4000/myInterviews", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [getToken]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "score-high";
    if (score >= 60) return "score-medium";
    return "score-low";
  };

  const openInterviewModal = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const closeModal = () => {
    setSelectedInterview(null);
  };

  return (
    <div className="my-interviews">
      <Navbar />

      <main className="main">
        <div className="container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="gradient-text">My Interviews</span>
              </h1>
              <p className="hero-subtitle">
                Review your completed interview sessions and track your progress
              </p>
            </div>
          </div>

          {/* Interview History */}
          <section className="problems-section">
            <div className="section-header">
              <h2>Interview History</h2>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading interviews...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
              </div>
            ) : (
              <div className="problems-table">
                {interviews && interviews.length > 0 ? (
                  interviews.map((interview, index) => (
                    <div
                      key={interview._id}
                      className="problem-row"
                      onClick={() => openInterviewModal(interview)}
                    >
                      <div className="row-left">
                        <div className="td-status">
                          <div className="status-dot completed"></div>
                        </div>
                        <div className="td-number">{index + 1}.</div>
                        <div className="td-title-group">
                          <span className="problem-title">
                            {interview.interviewType}
                          </span>
                          <span className="problem-topic">
                            {formatDate(interview.completedAt)}
                          </span>
                        </div>
                        <div className="td-tags">
                          <span className="tag-badge tag-duration">
                            {formatDuration(interview.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="row-right">
                        <div className="td-difficulty">
                          {interview.score ? (
                            <span
                              className={`difficulty-pill ${getScoreColor(interview.score)}`}
                            >
                              {interview.score}%
                            </span>
                          ) : (
                            <span className="difficulty-pill no-score">
                              N/A
                            </span>
                          )}
                        </div>
                        <div className="td-lock">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <svg
                      className="empty-icon"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <h3>No interviews yet</h3>
                    <p>Complete your first interview to see it here</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header">
              <h2>{selectedInterview.interviewType}</h2>
              <div className="modal-badges">
                {selectedInterview.score && (
                  <span
                    className={`difficulty-pill ${getScoreColor(selectedInterview.score)}`}
                  >
                    {selectedInterview.score}%
                  </span>
                )}
              </div>
            </div>

            <div className="modal-topic">
              Completed on {formatDate(selectedInterview.completedAt)}
            </div>

            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-label">Duration</span>
                <span className="stat-value">
                  {formatDuration(selectedInterview.duration)}
                </span>
              </div>
              {selectedInterview.score && (
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{selectedInterview.score}%</span>
                </div>
              )}
            </div>

            {selectedInterview.feedback && (
              <div className="modal-description">
                <h3>Feedback</h3>
                <p>{selectedInterview.feedback}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInterviews;
