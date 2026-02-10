import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import { UserDropdown } from "./UserDropdown";
import { useCache } from "../contexts/CacheContext";
import { apiUrl } from "../lib/api";
import "./Navbar.css";

interface NavbarProps {
  onNavigate?: (path: string) => void;
}

export const Navbar = ({ onNavigate }: NavbarProps = {}) => {
  const location = useLocation();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { getCache, setCache } = useCache();

  // Initialize state from cache immediately
  const initialCache = getCache<any>("userData");
  const [userRole, setUserRole] = useState<string | null>(
    initialCache?.role || null,
  );
  const [interviewsLeft, setInterviewsLeft] = useState<number | null>(
    initialCache?.subscription?.interviewsAllowed ?? null,
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(
    initialCache?.subscription?.plan || null,
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    initialCache?.subscription?.status || null,
  );
  const [hasFetched, setHasFetched] = useState(!!initialCache);

  const isActive = (path: string) => location.pathname === path;

  // Reset hasFetched when cache is cleared (e.g., after interview completion)
  const cachedUserData = getCache<any>("userData");
  useEffect(() => {
    if (!cachedUserData && hasFetched) {
      setHasFetched(false);
    }
  }, [cachedUserData]);

  useEffect(() => {
    if (!user || hasFetched) return;

    const fetchUserData = async () => {
      // Check cache first
      const cachedData = getCache<any>("userData");
      if (cachedData) {
        setUserRole(cachedData.role || "free");
        setInterviewsLeft(cachedData.subscription?.interviewsAllowed ?? null);
        setSubscriptionPlan(cachedData.subscription?.plan || "free");
        setSubscriptionStatus(cachedData.subscription?.status || "inactive");
        setHasFetched(true);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(apiUrl("/user/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();

          // Update all state atomically
          setUserRole(userData.role || "free");
          setInterviewsLeft(userData.subscription?.interviewsAllowed ?? null);
          setSubscriptionPlan(userData.subscription?.plan || "free");
          setSubscriptionStatus(userData.subscription?.status || "inactive");

          // Cache the data
          setCache("userData", userData);
          setHasFetched(true);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]); // Only depend on user, not getToken or other changing values

  // Check subscription status from database instead of Clerk metadata
  const isProMember =
    subscriptionPlan &&
    subscriptionPlan.includes("pro") &&
    subscriptionStatus === "active";
  const isFreeMember = !isProMember;

  const displayInterviewsLeft = interviewsLeft;

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="logo">
          <Logo size="small" showText={true} />
        </div>
        <div className="nav-center">
          <div className="nav-links-container">
            <Link
              to="/dashboard"
              className={`nav-link ${isActive("/dashboard") || isActive("/") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/dashboard")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/leaderboard"
              className={`nav-link ${isActive("/leaderboard") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/leaderboard")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 16v-3a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                <rect x="2" y="8" width="4" height="12" rx="1" />
                <rect x="10" y="4" width="4" height="16" rx="1" />
                <rect x="18" y="12" width="4" height="8" rx="1" />
              </svg>
              <span>Leaderboard</span>
            </Link>
            <Link
              to={user?.username ? `/u/${user.username}` : "#"}
              className={`nav-link ${location.pathname.startsWith("/u/") ? "active" : ""}`}
              onClick={(e) =>
                handleLinkClick(e, user?.username ? `/u/${user.username}` : "#")
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Me</span>
            </Link>
            <Link
              to="/pricing"
              className={`nav-link ${isActive("/pricing") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/pricing")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Pricing</span>
            </Link>
            <Link
              to="/contribution"
              className={`nav-link ${isActive("/contribution") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/contribution")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Contribute</span>
            </Link>
            <Link
              to="/feedback"
              className={`nav-link ${isActive("/feedback") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/feedback")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Feedback</span>
            </Link>
          </div>
        </div>
        <div className="nav-actions">
          {/* Show membership badge */}
          {isProMember && (
            <div className="role-badge-container">
              <span className="role-badge pro">
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
                Pro
              </span>
            </div>
          )}
          {isFreeMember && (
            <div className="role-badge-container">
              <span className="role-badge free">
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
                Free
              </span>
            </div>
          )}
          {/* Show interview count for free users */}
          {isFreeMember && displayInterviewsLeft !== null && (
            <div className="role-badge-container">
              <span className="role-badge interviews">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {displayInterviewsLeft} left
              </span>
            </div>
          )}
          {/* Show admin/owner badges if applicable */}
          {userRole && (userRole === "owner" || userRole === "admin") && (
            <div className="role-badge-container">
              {userRole === "owner" && (
                <span className="role-badge owner">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Owner
                </span>
              )}
              {userRole === "admin" && (
                <span className="role-badge admin">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Admin
                </span>
              )}
            </div>
          )}
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
};
