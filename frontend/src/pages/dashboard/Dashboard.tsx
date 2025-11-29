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
                  presets.map((preset, index) => (
                    <div key={preset.id} className="problem-row">
                      <div className="problem-status">
                        <div className="status-circle"></div>
                      </div>
                      <div className="problem-number">#{index + 1}</div>
                      <div className="problem-info">
                        <h3 className="problem-title">{preset.type}</h3>
                        <p className="problem-topic">{preset.topic}</p>
                      </div>
                      <div className="problem-difficulty">
                        <span
                          className={`difficulty-badge ${getDifficulty(index)}`}
                        >
                          {getDifficulty(index)}
                        </span>
                      </div>
                      <div className="problem-time">
                        <svg
                          width="16"
                          height="16"
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
                      </div>
                      <div className="problem-action">
                        <button
                          className="solve-btn"
                          onClick={() => startInterview(preset)}
                        >
                          Solve
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

// Helper function to assign difficulty
function getDifficulty(index: number): string {
  const difficulties = [
    "Easy",
    "Easy",
    "Medium",
    "Medium",
    "Easy",
    "Hard",
    "Medium",
    "Hard",
    "Medium",
    "Easy",
    "Hard",
    "Medium",
  ];
  return difficulties[index % difficulties.length];
}

export default Dashboard;
