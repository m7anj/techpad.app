import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import "../../styles/shared-layout.css";
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
  const [sortBy, setSortBy] = useState<"recent" | "score">("recent");

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

  const getBarColor = (score: number): string => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) {
      return {
        background: "rgba(34, 197, 94, 0.08)",
      };
    }
    if (score >= 60) {
      return {
        background: "rgba(245, 158, 11, 0.08)",
      };
    }
    return {
      background: "rgba(239, 68, 68, 0.08)",
    };
  };

  const sortedInterviews = [...interviews].sort((a, b) => {
    if (sortBy === "score") {
      return (b.score || 0) - (a.score || 0);
    }
    return (
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  });

  const openInterviewModal = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const closeModal = () => {
    setSelectedInterview(null);
  };

  return (
    <div className="my-interviews page-wrapper">
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
              <div className="sort-controls">
                <button
                  className={`sort-btn ${sortBy === "recent" ? "active" : ""}`}
                  onClick={() => setSortBy("recent")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Most Recent
                </button>
                <button
                  className={`sort-btn ${sortBy === "score" ? "active" : ""}`}
                  onClick={() => setSortBy("score")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Highest Score
                </button>
              </div>
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
                {sortedInterviews && sortedInterviews.length > 0 ? (
                  sortedInterviews.map((interview, index) => {
                    const scoreStyle = interview.score
                      ? getScoreBackground(interview.score)
                      : {};

                    return (
                      <div
                        key={interview._id}
                        className="problem-row"
                        style={scoreStyle}
                        onClick={() => openInterviewModal(interview)}
                      >
                        <div className="row-left">
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
                    );
                  })
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
            {/* Header */}
            <div className="modal-header">
              <div className="modal-header-top">
                <h2>{selectedInterview.interviewType}</h2>
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
              </div>
              <div className="modal-meta">
                <div className="meta-item">
                  <svg
                    className="meta-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDate(selectedInterview.completedAt)}
                </div>
                <div className="meta-item">
                  <svg
                    className="meta-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatDuration(selectedInterview.duration)}
                </div>
                {selectedInterview.score && (
                  <div className="meta-item">
                    <svg
                      className="meta-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Score: {selectedInterview.score}%
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">
              {selectedInterview.feedback &&
              typeof selectedInterview.feedback === "object" &&
              selectedInterview.feedback.breakdown ? (
                <>
                  {/* Score Overview */}
                  <div className="score-overview">
                    <div className="overall-score">
                      <div
                        className={`score-circle ${getBarColor(selectedInterview.score || 0)}`}
                      >
                        {selectedInterview.score}%
                      </div>
                      <span className="score-label">Overall Score</span>
                    </div>

                    <div className="breakdown-bars">
                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <span>Technical Knowledge</span>
                          <span className="breakdown-value">
                            {selectedInterview.feedback.breakdown.technical}%
                          </span>
                        </div>
                        <div className="breakdown-bar-bg">
                          <div
                            className={`breakdown-bar-fill ${getBarColor(selectedInterview.feedback.breakdown.technical)}`}
                            style={{
                              width: `${selectedInterview.feedback.breakdown.technical}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <span>Problem Solving</span>
                          <span className="breakdown-value">
                            {
                              selectedInterview.feedback.breakdown
                                .problemSolving
                            }
                            %
                          </span>
                        </div>
                        <div className="breakdown-bar-bg">
                          <div
                            className={`breakdown-bar-fill ${getBarColor(selectedInterview.feedback.breakdown.problemSolving)}`}
                            style={{
                              width: `${selectedInterview.feedback.breakdown.problemSolving}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <span>Communication</span>
                          <span className="breakdown-value">
                            {selectedInterview.feedback.breakdown.communication}
                            %
                          </span>
                        </div>
                        <div className="breakdown-bar-bg">
                          <div
                            className={`breakdown-bar-fill ${getBarColor(selectedInterview.feedback.breakdown.communication)}`}
                            style={{
                              width: `${selectedInterview.feedback.breakdown.communication}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Grid */}
                  <div className="feedback-grid">
                    {selectedInterview.feedback.strengths && (
                      <div className="feedback-card strengths">
                        <div className="feedback-card-header">
                          <div className="feedback-icon strengths">✓</div>
                          <h4>Strengths</h4>
                        </div>
                        <ul className="feedback-list">
                          {selectedInterview.feedback.strengths.map(
                            (strength: string, idx: number) => (
                              <li key={idx}>{strength}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedInterview.feedback.gaps && (
                      <div className="feedback-card gaps">
                        <div className="feedback-card-header">
                          <div className="feedback-icon gaps">!</div>
                          <h4>Areas for Improvement</h4>
                        </div>
                        <ul className="feedback-list">
                          {selectedInterview.feedback.gaps.map(
                            (gap: string, idx: number) => (
                              <li key={idx}>{gap}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {selectedInterview.feedback.improvement && (
                      <div className="feedback-card improvement full-width">
                        <div className="feedback-card-header">
                          <div className="feedback-icon improvement">→</div>
                          <h4>Next Steps</h4>
                        </div>
                        <ul className="feedback-list">
                          {selectedInterview.feedback.improvement.map(
                            (tip: string, idx: number) => (
                              <li key={idx}>{tip}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>No detailed feedback available for this interview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInterviews;
