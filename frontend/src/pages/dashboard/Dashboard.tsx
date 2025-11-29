import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Navbar } from "../../components/Navbar";

const Dashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats] = useState({
    solved: 0,
    totalProblems: 12,
    easyCompleted: 0,
    mediumCompleted: 0,
    hardCompleted: 0,
    streak: 0,
    rank: "Beginner",
  });

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const res = await fetch("http://localhost:4000/explore", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const res_json = await res.json();
        setPresets(res_json);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, [getToken]);

  const startInterview = (preset: any) => {
    navigate(`/interview/${preset.id}`, { state: { preset } });
  };

  const progressPercent = (stats.solved / stats.totalProblems) * 100;

  return (
    <div className="dashboard">
      <Navbar />

      <main className="main">
        <div className="container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                Master Your{" "}
                <span className="gradient-text">Technical Interviews</span>
              </h1>
              <p className="hero-subtitle">
                Practice coding problems, system design, and behavioral
                questions with AI-powered feedback
              </p>
            </div>

            {/* Progress Card */}
            <div className="progress-card-hero">
              <div className="progress-header">
                <div>
                  <div className="rank-badge">{stats.rank}</div>
                  <h3>
                    {stats.solved} / {stats.totalProblems} Solved
                  </h3>
                </div>
                <div className="streak-badge">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {stats.streak} day streak
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="progress-percent">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="difficulty-stats">
                <div className="difficulty-item">
                  <span className="difficulty-label easy">Easy</span>
                  <span className="difficulty-count">
                    {stats.easyCompleted}/4
                  </span>
                </div>
                <div className="difficulty-item">
                  <span className="difficulty-label medium">Medium</span>
                  <span className="difficulty-count">
                    {stats.mediumCompleted}/5
                  </span>
                </div>
                <div className="difficulty-item">
                  <span className="difficulty-label hard">Hard</span>
                  <span className="difficulty-count">
                    {stats.hardCompleted}/3
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Problems */}
          <section className="problems-section">
            <div className="section-header">
              <h2>Interview Problems</h2>
              <div className="filter-tabs">
                <button className="filter-tab active">All</button>
                <button className="filter-tab">Algorithms</button>
                <button className="filter-tab">System Design</button>
                <button className="filter-tab">Behavioral</button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading problems...</p>
              </div>
            ) : (
              <div className="problems-list">
                {presets && presets.length > 0 ? (
                  presets.map((preset) => (
                    <div key={preset.id} className="problem-row">
                      <div className="problem-status">
                        <div className="status-circle"></div>
                      </div>
                      <div className="problem-main">
                        <div className="problem-header">
                          <h3 className="problem-title">
                            {preset.type}
                            {preset.premium && (
                              <span className="premium-badge">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                PRO
                              </span>
                            )}
                          </h3>
                          <div className="problem-badges">
                            <span
                              className={`difficulty-badge ${preset.difficulty?.toLowerCase() || "medium"}`}
                            >
                              {preset.difficulty || "Medium"}
                            </span>
                          </div>
                        </div>
                        <div className="problem-meta">
                          <span className="problem-topic">{preset.topic}</span>
                          <span className="meta-separator">•</span>
                          <span className="problem-time">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <polyline
                                points="12 6 12 12 16 14"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {preset.expectedDuration} min
                          </span>
                        </div>
                        <p className="problem-description">
                          {preset.description}
                        </p>
                        {preset.tags && preset.tags.length > 0 && (
                          <div className="problem-tags">
                            {preset.tags.map((tag: string, index: number) => (
                              <span key={index} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="problem-action">
                        <button
                          className="solve-btn"
                          onClick={() => startInterview(preset)}
                          disabled={preset.premium}
                        >
                          {preset.premium ? (
                            <>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  ry="2"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M7 11V7a5 5 0 0 1 10 0v4"
                                  strokeWidth="2"
                                />
                              </svg>
                              Locked
                            </>
                          ) : (
                            <>
                              Start
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <line
                                  x1="5"
                                  y1="12"
                                  x2="19"
                                  y2="12"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <polyline
                                  points="12 5 19 12 12 19"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </>
                          )}
                        </button>
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
                    <h3>No problems available</h3>
                    <p>Check back later for new challenges</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
