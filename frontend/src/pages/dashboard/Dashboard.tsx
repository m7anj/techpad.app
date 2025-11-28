import React from "react";
import { useState, useEffect } from "react";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "./skeleton.css";

const Dashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        console.log(token);

        const res = await fetch("http://localhost:4000/explore", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const res_json = await res.json();
        console.log(res_json);
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
    console.log("Starting interview with preset:", preset);
    navigate(`/interview/${preset.id}`, { state: { preset } });
  };

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="container nav-content">
          <div className="logo">
            <span className="logo-text">TechPrep</span>
          </div>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">
              <svg
                className="nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </a>
            <a href="/my-interviews" className="nav-link">
              <svg
                className="nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              My Interviews
            </a>
          </div>
          <div className="nav-actions">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="main">
        <div className="container">
          <header className="welcome-section">
            <h1>Ready to practice?</h1>
            <p>Choose your interview type and get started</p>
          </header>

          <section className="interview-cards">
            {presets ? (
              presets.map((preset) => (
                <div key={preset.id} className="preset-card">
                  <div className="preset-header">
                    <h3>{preset.type}</h3>
                    <span className="duration-badge">
                      ⏱️ {preset.expectedDuration} mins
                    </span>
                  </div>
                  <div className="preset-meta">
                    <span className="topic-tag">{preset.topic}</span>
                  </div>
                  <p className="preset-description">{preset.description}</p>
                  <button
                    className="btn btn-primary start-btn"
                    onClick={() => startInterview(preset)}
                  >
                    Start Interview →
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <p>No presets found</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
