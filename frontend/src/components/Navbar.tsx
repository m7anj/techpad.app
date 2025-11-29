import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo/Logo";
import "./Navbar.css";

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};
