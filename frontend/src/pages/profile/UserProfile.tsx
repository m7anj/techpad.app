import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import { useCache } from "../../contexts/CacheContext";
import "../../styles/shared-layout.css";
import "./UserProfile.css";

interface UserStats {
  totalInterviews: number;
  averageScore: string;
  interviewsCompleted: Array<{
    id: string;
    score: number | null;
    timeTaken: number;
    completedAt: string;
    interview: {
      type: string;
      topic: string | null;
      difficulty: string;
    };
  }>;
}

interface UserProfile {
  username: string;
  email: string;
  imageUrl: string | null;
  elo: number;
  subscriptionStatus: string;
  memberSince: string;
  stats: UserStats;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const { getCache, setCache } = useCache();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

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
          `http://localhost:4000/user/profile/${username}`,
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

  const heatmapData = generateHeatmapData();

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

  const isPro = profile?.subscriptionStatus === "active";
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
      user
        .update({
          externalId: user.id,
        })
        .catch((err) => console.error("Update failed:", err));
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

          {/* Stats Section */}
          <div className="stats-activity-row">
            <div className="stats-section">
              <h2>Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">
                    {profile.stats.totalInterviews}
                  </div>
                  <div className="stat-label">Total Interviews</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {profile.stats.averageScore}%
                  </div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
            </div>
            {/* Activity Heatmap */}
            <div className="heatmap-section">
              <h2>Activity</h2>
              <div className="heatmap-container">
                {heatmapData.length > 0 ? (
                  <div className="github-heatmap">
                    <div className="heatmap-months">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const monthDate = new Date();
                        monthDate.setMonth(monthDate.getMonth() - (11 - i));
                        return (
                          <div key={i} className="month-label">
                            {monthDate.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </div>
                        );
                      })}
                    </div>
                    <div className="heatmap-wrapper">
                      <div className="heatmap-days">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                      </div>
                      <div className="heatmap-grid">
                        {heatmapData.map((day, index) => {
                          const getColor = (count: number) => {
                            if (count === 0) return "rgba(255, 255, 255, 0.05)";
                            if (count === 1) return "rgba(139, 92, 246, 0.3)";
                            if (count === 2) return "rgba(139, 92, 246, 0.5)";
                            if (count >= 3) return "rgba(139, 92, 246, 0.8)";
                            return "rgba(139, 92, 246, 1)";
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
                    </div>
                    <div className="heatmap-legend">
                      <span>Less</span>
                      <div
                        className="legend-cell"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                      />
                      <div
                        className="legend-cell"
                        style={{ backgroundColor: "rgba(139, 92, 246, 0.3)" }}
                      />
                      <div
                        className="legend-cell"
                        style={{ backgroundColor: "rgba(139, 92, 246, 0.5)" }}
                      />
                      <div
                        className="legend-cell"
                        style={{ backgroundColor: "rgba(139, 92, 246, 0.8)" }}
                      />
                      <div
                        className="legend-cell"
                        style={{ backgroundColor: "rgba(139, 92, 246, 1)" }}
                      />
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
              <div className="interviews-list">
                {profile.stats.interviewsCompleted
                  .slice(0, 10)
                  .map((interview) => (
                    <div key={interview.id} className="interview-item">
                      <div className="interview-details">
                        <h3>{interview.interview.type}</h3>
                        {interview.interview.topic && (
                          <p className="interview-topic">
                            {interview.interview.topic}
                          </p>
                        )}
                      </div>
                      <div className="interview-stats">
                        <span
                          className={`difficulty-pill ${interview.interview.difficulty.toLowerCase()}`}
                        >
                          {interview.interview.difficulty}
                        </span>
                        {interview.score !== null && (
                          <span className="score-badge">
                            Score: {interview.score}%
                          </span>
                        )}
                        <span className="date-badge">
                          {new Date(interview.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="no-interviews">No interviews completed yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
