import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "../../styles/shared-layout.css";
import "./Dashboard.css";
import { Navbar } from "../../components/Navbar";
import HERO_QUOTES from "./quotes";

const Dashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroQuote] = useState(
    () => HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)],
  );

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

  const openInterviewModal = (preset: any) => {
    setSelectedInterview(preset);
  };

  const closeModal = () => {
    setSelectedInterview(null);
  };

  const startInterview = async () => {
    if (selectedInterview && !selectedInterview.premium) {
      try {
        // Create a secure interview session
        const token = await getToken();
        const response = await fetch(
          "http://localhost:4000/interview-session/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ interviewId: selectedInterview.id }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to create interview session");
        }

        const { sessionToken } = await response.json();

        // Navigate to interview with session token
        navigate(`/interview/${sessionToken}`, {
          state: { preset: selectedInterview },
        });
      } catch (error) {
        console.error("Error starting interview:", error);
        alert("Failed to start interview. Please try again.");
      }
    }
  };

  const getTagColor = (tag: string): string => {
    const tagLower = tag.toLowerCase();

    // Programming Languages
    if (tagLower.includes("c++") || tagLower.includes("cpp")) return "tag-cpp";
    if (tagLower.includes("java")) return "tag-java";
    if (tagLower.includes("rust")) return "tag-rust";
    if (tagLower.includes("python")) return "tag-python";
    if (tagLower.includes("javascript") || tagLower.includes("js"))
      return "tag-javascript";

    // Categories
    if (tagLower.includes("network")) return "tag-networking";
    if (tagLower.includes("system design") || tagLower.includes("cloud"))
      return "tag-system-design";
    if (tagLower.includes("os") || tagLower.includes("operating"))
      return "tag-os";
    if (tagLower.includes("devops") || tagLower.includes("admin"))
      return "tag-devops";
    if (tagLower.includes("web")) return "tag-web";
    if (
      tagLower.includes("data structure") ||
      tagLower.includes("algorithm") ||
      tagLower.includes("dsa")
    )
      return "tag-dsa";

    // Default
    return "tag-default";
  };

  // Filter presets based on search query
  const filteredPresets = presets.filter((preset) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      preset.type?.toLowerCase().includes(query) ||
      preset.topic?.toLowerCase().includes(query) ||
      preset.description?.toLowerCase().includes(query) ||
      preset.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="dashboard page-wrapper">
      <Navbar />

      <main className="main">
        <div className="container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="gradient-text">{heroQuote}</span>
              </h1>
              <p className="hero-subtitle">
                Practice coding problems, system design, and behavioral
                questions with AI-powered feedback
              </p>
            </div>
          </div>

          {/* Interview Problems */}
          <section className="problems-section">
            <div className="section-header">
              <h2>Interview Problems</h2>
              <div className="search-container">
                <svg
                  className="search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search interviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchQuery("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading problems...</p>
              </div>
            ) : (
              <div className="problems-table">
                {filteredPresets && filteredPresets.length > 0 ? (
                  filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`problem-row ${preset.premium ? "premium-locked" : ""}`}
                      onClick={() => openInterviewModal(preset)}
                    >
                      <div className="row-left">
                        <div className="td-status">
                          <div className="status-dot"></div>
                        </div>
                        <div className="td-number">{preset.id}.</div>
                        <div className="td-title-group">
                          <span className="problem-title">{preset.type}</span>
                          {preset.topic && (
                            <span className="problem-topic">
                              {preset.topic}
                            </span>
                          )}
                        </div>
                        <div className="td-tags">
                          {preset.tags && preset.tags.length > 0 && (
                            <>
                              {preset.tags
                                .slice(0, 3)
                                .map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`tag-badge ${getTagColor(tag)}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="row-right">
                        <div className="td-difficulty">
                          <span
                            className={`difficulty-pill ${preset.difficulty?.toLowerCase() || "medium"}`}
                          >
                            {preset.difficulty || "Medium"}
                          </span>
                        </div>
                        <div className="td-lock">
                          {preset.premium ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 9.9 0M7 11v4" />
                            </svg>
                          )}
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
                    <h3>No problems available</h3>
                    <p>Check back later for new challenges</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Interview Modal */}
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
              <h2>{selectedInterview.type}</h2>
              <div className="modal-badges">
                <span
                  className={`difficulty-pill ${selectedInterview.difficulty?.toLowerCase() || "medium"}`}
                >
                  {selectedInterview.difficulty || "Medium"}
                </span>
                {selectedInterview.premium && (
                  <span className="premium-modal-badge">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Premium
                  </span>
                )}
              </div>
            </div>

            {selectedInterview.topic && (
              <div className="modal-topic">{selectedInterview.topic}</div>
            )}

            <div className="modal-description">
              {selectedInterview.description}
            </div>

            {selectedInterview.tags && selectedInterview.tags.length > 0 && (
              <div className="modal-tags">
                {selectedInterview.tags.map((tag: string, idx: number) => (
                  <span key={idx} className={`tag-badge ${getTagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="modal-actions">
              {selectedInterview.premium ? (
                <button className="btn-start locked" disabled>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Upgrade to Premium
                </button>
              ) : (
                <button className="btn-start" onClick={startInterview}>
                  Start Interview
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
