import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import { useCache } from "../../contexts/CacheContext";
import { apiUrl } from "../../lib/api";
import "../../styles/shared-layout.css";
import "./UserProfile.css";

interface CompletedInterview {
  id: string;
  score: number | null;
  timeTaken: number;
  completedAt: string;
  feedback: {
    overallScore?: number;
    breakdown?: {
      technical: number;
      problemSolving: number;
      communication: number;
    };
    strengths?: string[];
    gaps?: string[];
    improvement?: string[];
  } | null;
  interview: {
    type: string;
    topic: string | null;
    difficulty: string;
  };
}

interface UserStats {
  totalInterviews: number;
  averageScore: string;
  interviewsCompleted: CompletedInterview[];
}

interface UserProfile {
  username: string;
  email: string;
  imageUrl: string | null;
  elo: number;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  memberSince: string;
  stats: UserStats;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { getCache, setCache, clearCache } = useCache();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Subscription management state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);

  // Result modal state
  const [selectedInterview, setSelectedInterview] = useState<CompletedInterview | null>(null);

  const isOwnProfile = user?.username === username;

  const getRankInfo = (elo: number) => {
    if (elo >= 2000)
      return {
        name: "Grandmaster",
        color: "#fbbf24",
        background: "rgba(251, 191, 36, 0.16)",
        glow: "rgba(251, 191, 36, 0.35)",
      };
    if (elo >= 1700)
      return {
        name: "Master",
        color: "#a78bfa",
        background: "rgba(167, 139, 250, 0.18)",
        glow: "rgba(167, 139, 250, 0.35)",
      };
    if (elo >= 1400)
      return {
        name: "Expert",
        color: "#60a5fa",
        background: "rgba(96, 165, 250, 0.18)",
        glow: "rgba(96, 165, 250, 0.35)",
      };
    if (elo >= 1100)
      return {
        name: "Advanced",
        color: "#34d399",
        background: "rgba(52, 211, 153, 0.18)",
        glow: "rgba(52, 211, 153, 0.35)",
      };
    if (elo >= 850)
      return {
        name: "Intermediate",
        color: "#f59e0b",
        background: "rgba(245, 158, 11, 0.18)",
        glow: "rgba(245, 158, 11, 0.35)",
      };
    if (elo >= 550)
      return {
        name: "Beginner",
        color: "#a3a3a3",
        background: "rgba(163, 163, 163, 0.2)",
        glow: "rgba(163, 163, 163, 0.25)",
      };
    return null;
  };

  useEffect(() => {
    if (!username || !user || hasFetched) return;

    const fetchUserProfile = async () => {
      // Check cache first
      const cacheKey = `profile_${username}`;
      const cachedProfile = getCache<UserProfile>(cacheKey);
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
        setHasFetched(true);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          apiUrl(`/user/profile/${username}`),
        );

        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user profile");
          }
          return;
        }

        const data = await res.json();
        setProfile(data);
        // Cache profile data
        setCache(cacheKey, data);
        setHasFetched(true);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("An error occurred while loading the profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, user]);

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setSubscriptionMessage(null);

    try {
      const token = await getToken();
      const res = await fetch(apiUrl("/pro/cancel-subscription"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          subscriptionStatus: "cancelling",
          subscriptionEndsAt: data.cancelAt,
        });
        // Clear cache so it refetches
        clearCache(`profile_${username}`);
        clearCache("userData");
      }

      setSubscriptionMessage(`Your subscription will end on ${new Date(data.cancelAt).toLocaleDateString()}`);
      setShowCancelModal(false);
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setSubscriptionMessage(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle reactivate subscription
  const handleReactivateSubscription = async () => {
    setCancelLoading(true);
    setSubscriptionMessage(null);

    try {
      const token = await getToken();
      const res = await fetch(apiUrl("/pro/reactivate-subscription"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reactivate subscription");
      }

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          subscriptionStatus: "active",
        });
        // Clear cache so it refetches
        clearCache(`profile_${username}`);
        clearCache("userData");
      }

      setSubscriptionMessage("Your subscription has been reactivated!");
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      setSubscriptionMessage(err instanceof Error ? err.message : "Failed to reactivate subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  // Generate GitHub-style heatmap data for last 52 weeks
  const generateHeatmapData = () => {
    if (!profile) return [];

    const weeks = 52;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - weeks * 7);

    // Create array of all dates in the range
    const allDates: { date: string; count: number; day: number }[] = [];
    const activityMap: { [key: string]: number } = {};

    // Build activity map from completed interviews
    profile.stats.interviewsCompleted.forEach((interview) => {
      const date = new Date(interview.completedAt).toISOString().split("T")[0];
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    // Fill all dates
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      allDates.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        day: currentDate.getDay(),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDates;
  };

  const getDifficultyBreakdown = () => {
    if (!profile) return { easy: 0, medium: 0, hard: 0, total: 0 };
    const counts = { easy: 0, medium: 0, hard: 0 };
    profile.stats.interviewsCompleted.forEach((interview) => {
      const diff = interview.interview.difficulty.toLowerCase();
      if (diff === "easy") counts.easy++;
      else if (diff === "medium") counts.medium++;
      else if (diff === "hard") counts.hard++;
    });
    return { ...counts, total: counts.easy + counts.medium + counts.hard };
  };

  const heatmapData = generateHeatmapData();
  const diffBreakdown = getDifficultyBreakdown();

  const getHeatmapMonthLabels = () => {
    if (heatmapData.length === 0) return [];
    const labels: { month: string; colIndex: number }[] = [];
    let currentMonth = -1;
    let colIndex = 0;

    for (let i = 0; i < heatmapData.length; i++) {
      const d = new Date(heatmapData[i].date);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 && i > 0) colIndex++;
      if (d.getMonth() !== currentMonth) {
        currentMonth = d.getMonth();
        labels.push({
          month: d.toLocaleDateString("en-US", { month: "short" }),
          colIndex,
        });
      }
    }
    return labels;
  };

  const monthLabels = getHeatmapMonthLabels();
  const totalSubmissions = heatmapData.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div className="profile-page page-wrapper">
        <Navbar />
        <main className="main">
          <div className="container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page page-wrapper">
        <Navbar />
        <main className="main">
          <div className="container">
            <div className="error-state">
              <h2>{error || "User not found"}</h2>
              <p>The user you're looking for doesn't exist.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isPro = profile?.subscriptionStatus === "active" || profile?.subscriptionStatus === "cancelling";
  const isCancelling = profile?.subscriptionStatus === "cancelling";
  const rankInfo = getRankInfo(profile?.elo || 200);
  const eloBadgeStyle = rankInfo
    ? {
        color: rankInfo.color,
        borderColor: rankInfo.color,
        background: rankInfo.background,
        boxShadow: `0 0 15px ${rankInfo.glow}`,
      }
    : {
        color: "#cbd5e1",
        borderColor: "#94a3b8",
        background: "rgba(148, 163, 184, 0.18)",
        boxShadow: "0 0 12px rgba(148, 163, 184, 0.25)",
      };

  const openClerkProfile = () => {
    if (isOwnProfile && user) {
      // Open Clerk user profile for image management
      window.open(`https://accounts.clerk.dev/user`, "_blank");
    }
  };

  return (
    <div className={`profile-page page-wrapper ${isPro ? "pro-user" : ""}`}>
      <Navbar />
      <main className="main">
        <div className="container">
          {/* Back Button */}
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Profile Header */}
          <div className="profile-header">
            <div
              className={`profile-avatar ${isOwnProfile ? "editable" : ""}`}
              onClick={isOwnProfile ? openClerkProfile : undefined}
              role={isOwnProfile ? "button" : undefined}
              tabIndex={isOwnProfile ? 0 : undefined}
              onKeyDown={
                isOwnProfile
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openClerkProfile();
                      }
                    }
                  : undefined
              }
              title={isOwnProfile ? "Click to change profile picture" : ""}
            >
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.username} />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <div className="avatar-edit-overlay">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1 className="profile-username">{profile.username}</h1>
              <p className="profile-email">{profile.email}</p>
              <div className="profile-badges">
                <span
                  className={`subscription-badge ${profile.subscriptionStatus}`}
                >
                  {profile.subscriptionStatus === "active" ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      PRO
                    </>
                  ) : profile.subscriptionStatus === "cancelling" ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      PRO (Cancelling)
                    </>
                  ) : (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      FREE
                    </>
                  )}
                </span>

                <span className="elo-badge" style={eloBadgeStyle}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {profile.elo}
                </span>
              </div>
              <p className="member-since">
                Member since{" "}
                {new Date(profile.memberSince).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Subscription Management - Only show for own profile with active subscription */}
          {isOwnProfile && isPro && (
            <div className="subscription-section">
              <h2>Subscription</h2>
              <div className="subscription-card">
                <div className="subscription-info">
                  <div className="subscription-status">
                    <span className={`status-indicator ${isCancelling ? "cancelling" : "active"}`}></span>
                    {isCancelling ? "Cancelling" : "Active"}
                  </div>
                  {profile.subscriptionEndsAt && (
                    <p className="subscription-end-date">
                      {isCancelling ? "Ends on: " : "Renews on: "}
                      {new Date(profile.subscriptionEndsAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="subscription-actions">
                  {isCancelling ? (
                    <button
                      className="btn-reactivate"
                      onClick={handleReactivateSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Processing..." : "Reactivate Subscription"}
                    </button>
                  ) : (
                    <button
                      className="btn-cancel-subscription"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancelLoading}
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
                {subscriptionMessage && (
                  <p className="subscription-message">{subscriptionMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelModal && (
            <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
              <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Cancel Subscription?</h2>
                <p>
                  Are you sure you want to cancel your Pro subscription? You'll continue to have access until the end of your current billing period.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-keep"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelLoading}
                  >
                    Keep Subscription
                  </button>
                  <button
                    className="btn-confirm-cancel"
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Section — Donut Chart + Green Heatmap */}
          <div className="stats-activity-row">
            {/* Donut Chart */}
            <div className="donut-card">
              <div className="donut-left">
                <div className="donut-chart-wrapper">
                  <svg className="donut-svg" viewBox="0 0 200 200">
                    <circle
                      cx="100" cy="100" r="80"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="12"
                    />
                    {(() => {
                      const total = diffBreakdown.total || 1;
                      const circumference = 2 * Math.PI * 80;
                      const segments = [
                        { count: diffBreakdown.easy, color: "#4ade80" },
                        { count: diffBreakdown.medium, color: "#fbbf24" },
                        { count: diffBreakdown.hard, color: "#f87171" },
                      ];
                      let offset = circumference * 0.25;
                      return segments.map((seg, i) => {
                        const dash = (seg.count / total) * circumference;
                        const el = (
                          <circle
                            key={i}
                            cx="100" cy="100" r="80"
                            fill="none"
                            stroke={seg.count > 0 ? seg.color : "transparent"}
                            strokeWidth="12"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={offset}
                            style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
                          />
                        );
                        offset -= dash;
                        return el;
                      });
                    })()}
                    <text x="100" y="95" textAnchor="middle" className="donut-count">
                      {diffBreakdown.total}
                    </text>
                    <text x="100" y="118" textAnchor="middle" className="donut-label">
                      Solved
                    </text>
                  </svg>
                </div>
              </div>
              <div className="difficulty-breakdown">
                {[
                  { label: "Easy", count: diffBreakdown.easy, color: "#4ade80" },
                  { label: "Medium", count: diffBreakdown.medium, color: "#fbbf24" },
                  { label: "Hard", count: diffBreakdown.hard, color: "#f87171" },
                ].map((d) => (
                  <div className="diff-row" key={d.label}>
                    <span className="diff-label" style={{ color: d.color }}>{d.label}</span>
                    <div className="diff-row-bar-wrapper">
                      <div
                        className="diff-row-bar"
                        style={{
                          width: diffBreakdown.total > 0 ? `${(d.count / diffBreakdown.total) * 100}%` : "0%",
                          background: d.color,
                        }}
                      />
                    </div>
                    <span className="diff-count">{d.count}/{diffBreakdown.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Green Activity Heatmap */}
            <div className="heatmap-section">
              <h2>{totalSubmissions} submission{totalSubmissions !== 1 ? "s" : ""} in the last year</h2>
              <div className="heatmap-container">
                {heatmapData.length > 0 ? (
                  <div className="github-heatmap">
                    <div className="heatmap-grid-wrapper">
                      <div className="heatmap-grid">
                        {heatmapData.map((day, index) => {
                          const getColor = (count: number) => {
                            if (count === 0) return "rgba(255, 255, 255, 0.05)";
                            if (count === 1) return "rgba(34, 197, 94, 0.3)";
                            if (count === 2) return "rgba(34, 197, 94, 0.5)";
                            return "rgba(34, 197, 94, 0.8)";
                          };

                          return (
                            <div
                              key={index}
                              className="heatmap-cell"
                              data-count={day.count}
                              title={`${day.date}: ${day.count} interview${day.count !== 1 ? "s" : ""}`}
                              style={{
                                backgroundColor: getColor(day.count),
                                gridRow: day.day + 1,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="heatmap-months-bottom">
                        {monthLabels.map((m, i) => (
                          <span
                            key={i}
                            className="month-label"
                            style={{ gridColumn: m.colIndex + 1 }}
                          >
                            {m.month}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="heatmap-legend">
                      <span>Less</span>
                      <div className="legend-cell" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }} />
                      <div className="legend-cell" style={{ backgroundColor: "rgba(34, 197, 94, 0.3)" }} />
                      <div className="legend-cell" style={{ backgroundColor: "rgba(34, 197, 94, 0.5)" }} />
                      <div className="legend-cell" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }} />
                      <span>More</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-activity">No activity yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Interviews */}
          <div className="recent-interviews-section">
            <h2>Recent Interviews</h2>
            {profile.stats.interviewsCompleted.length > 0 ? (
              <div className="recent-table">
                {profile.stats.interviewsCompleted
                  .slice(0, 10)
                  .map((interview) => {
                    const mins = Math.floor(interview.timeTaken / 60);
                    const secs = interview.timeTaken % 60;
                    const daysAgo = Math.floor(
                      (Date.now() - new Date(interview.completedAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const timeAgo =
                      daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;

                    return (
                      <div
                        key={interview.id}
                        className="recent-row"
                        onClick={() => setSelectedInterview(interview)}
                      >
                        <div className="recent-row-left">
                          <div className="recent-title-group">
                            <span className="recent-title">{interview.interview.type}</span>
                            {interview.interview.topic && (
                              <span className="recent-topic">{interview.interview.topic}</span>
                            )}
                          </div>
                        </div>
                        <div className="recent-row-right">
                          {interview.score !== null && (
                            <span className="recent-score">{Math.round(interview.score)}%</span>
                          )}
                          <span className="recent-time">{mins}m {secs}s</span>
                          <span className={`difficulty-pill ${interview.interview.difficulty.toLowerCase()}`}>
                            {interview.interview.difficulty}
                          </span>
                          <span className="recent-ago">{timeAgo}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="no-interviews">No interviews completed yet</p>
            )}
          </div>

          {/* Result Detail Modal */}
          {selectedInterview && (() => {
            const fb = selectedInterview.feedback;
            const score = selectedInterview.score;
            const mins = Math.floor(selectedInterview.timeTaken / 60);
            const secs = selectedInterview.timeTaken % 60;
            const scoreColor = score !== null
              ? score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171"
              : "#64748b";

            return (
              <div className="modal-overlay" onClick={() => setSelectedInterview(null)}>
                <div className="result-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="result-modal-close" onClick={() => setSelectedInterview(null)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Header */}
                  <div className="result-modal-header">
                    <div className="result-modal-title-row">
                      <div>
                        <h2>{selectedInterview.interview.type}</h2>
                        {selectedInterview.interview.topic && (
                          <p className="result-modal-topic">{selectedInterview.interview.topic}</p>
                        )}
                      </div>
                      <div className="result-modal-meta">
                        <span className={`difficulty-pill ${selectedInterview.interview.difficulty.toLowerCase()}`}>
                          {selectedInterview.interview.difficulty}
                        </span>
                        <span className="result-modal-time">{mins}m {secs}s</span>
                      </div>
                    </div>

                    {/* Score */}
                    {score !== null && (
                      <div className="result-modal-score" style={{ color: scoreColor }}>
                        {Math.round(score)}
                      </div>
                    )}
                  </div>

                  {/* Breakdown bars */}
                  {fb?.breakdown && (
                    <div className="result-breakdown">
                      {([
                        ["Technical", fb.breakdown.technical],
                        ["Problem Solving", fb.breakdown.problemSolving],
                        ["Communication", fb.breakdown.communication],
                      ] as const).map(([label, val]) => (
                        <div className="result-breakdown-row" key={label}>
                          <span className="result-breakdown-label">{label}</span>
                          <div className="result-breakdown-track">
                            <div
                              className="result-breakdown-fill"
                              style={{
                                width: `${val}%`,
                                background: val >= 80 ? "#4ade80" : val >= 60 ? "#fbbf24" : "#f87171",
                              }}
                            />
                          </div>
                          <span className="result-breakdown-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feedback sections */}
                  {fb?.strengths && fb.strengths.length > 0 && (
                    <div className="result-feedback-group">
                      <h3>Strengths</h3>
                      <ul>
                        {fb.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {fb?.gaps && fb.gaps.length > 0 && (
                    <div className="result-feedback-group">
                      <h3>Gaps</h3>
                      <ul>
                        {fb.gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}

                  {fb?.improvement && fb.improvement.length > 0 && (
                    <div className="result-feedback-group">
                      <h3>What to work on</h3>
                      <ul>
                        {fb.improvement.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {!fb && (
                    <p className="result-no-feedback">No feedback available for this interview.</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
