import { UserButton, useAuth } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "./Logo/Logo";
import "./Navbar.css";

interface NavbarProps {
  onNavigate?: (path: string) => void;
}

export const Navbar = ({ onNavigate }: NavbarProps = {}) => {
  const location = useLocation();
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState<string>("free");

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:4000/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role || "free");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [getToken]);

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
          <Logo size="small" variant="default" />
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
              to="/my-interviews"
              className={`nav-link ${isActive("/my-interviews") ? "active" : ""}`}
              onClick={(e) => handleLinkClick(e, "/my-interviews")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>My Interviews</span>
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
          </div>
        </div>
        <div className="nav-actions">
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
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
            {userRole === "premium" && (
              <span className="role-badge premium">
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
                Premium
              </span>
            )}
            {userRole === "free" && (
              <span className="role-badge free">Free</span>
            )}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};
