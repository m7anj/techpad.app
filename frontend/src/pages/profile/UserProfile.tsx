import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:4000/user/profile/${username}`
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
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("An error occurred while loading the profile");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  // Generate heatmap data from completed interviews
  const generateHeatmapData = () => {
    if (!profile) return [];

    const heatmapData: { [key: string]: number } = {};
    profile.stats.interviewsCompleted.forEach((interview) => {
      const date = new Date(interview.completedAt)
        .toISOString()
        .split("T")[0];
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    return heatmapData;
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

  return (
    <div className="profile-page page-wrapper">
      <Navbar />
      <main className="main">
        <div className="container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.username} />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
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
                  {profile.subscriptionStatus === "active" ? "PRO" : "FREE"}
                </span>
                <span className="elo-badge">ELO: {profile.elo}</span>
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
                <div className="stat-value">{profile.stats.averageScore}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{profile.elo}</div>
                <div className="stat-label">Current ELO</div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="heatmap-section">
            <h2>Activity</h2>
            <div className="heatmap-container">
              {Object.keys(heatmapData).length > 0 ? (
                <div className="heatmap-grid">
                  {Object.entries(heatmapData).map(([date, count]) => (
                    <div
                      key={date}
                      className="heatmap-cell"
                      data-count={count}
                      title={`${date}: ${count} interview${count > 1 ? "s" : ""}`}
                      style={{
                        backgroundColor: `rgba(139, 92, 246, ${Math.min(count / 5, 1)})`,
                      }}
                    ></div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No activity yet</p>
              )}
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
