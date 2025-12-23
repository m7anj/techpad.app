import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import { useCache } from "../../contexts/CacheContext";
import "../../styles/shared-layout.css";
import "./Leaderboard.css";

interface LeaderboardEntry {
  username: string;
  elo: number;
  imageUrl: string | null;
  totalInterviews: number;
  averageScore: number;
  memberSince: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getCache, setCache } = useCache();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!user || hasFetched) return;

    const fetchLeaderboard = async () => {
      // Check cache first
      const cachedLeaderboard = getCache<LeaderboardEntry[]>("leaderboard");
      if (cachedLeaderboard) {
        setLeaderboard(cachedLeaderboard);
        setLoading(false);
        setHasFetched(true);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch("http://localhost:4000/leaderboard");

        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard");
        }

        const data = await res.json();
        setLeaderboard(data);
        // Cache leaderboard data
        setCache("leaderboard", data);
        setHasFetched(true);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-page page-wrapper">
      <Navbar />

      <main className="main">
        <div className="container">
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

          <div className="leaderboard-header">
            <h1 className="leaderboard-title">
              <span className="gradient-text">Global Leaderboard</span>
            </h1>
            <p className="leaderboard-subtitle">
              Top 25 performers ranked by ELO rating
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : (
            <div className="leaderboard-container">
              {leaderboard.length > 0 ? (
                <div className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.username}
                      className={`leaderboard-row rank-${index + 1}`}
                      onClick={() => navigate(`/u/${entry.username}`)}
                    >
                      <div className="rank-badge">
                        {getRankBadge(index + 1)}
                      </div>

                      <div className="user-info">
                        <div className="user-avatar">
                          {entry.imageUrl ? (
                            <img src={entry.imageUrl} alt={entry.username} />
                          ) : (
                            <div className="avatar-placeholder">
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <span className="username">{entry.username}</span>
                          <span className="user-stats">
                            {entry.totalInterviews} interviews
                          </span>
                        </div>
                      </div>

                      <div className="performance-stats">
                        <div className="stat-item">
                          <span className="stat-label">ELO</span>
                          <span className="stat-value elo">{entry.elo}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avg Score</span>
                          <span className="stat-value score">
                            {entry.averageScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No leaderboard data available yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
