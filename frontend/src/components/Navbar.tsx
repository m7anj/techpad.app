import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo/Logo";
import "./Navbar.css";

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="container nav-content">
        <div className="logo">
          <Logo size="small" variant="default" />
        </div>
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/my-interviews"
            className={`nav-link ${isActive("/my-interviews") ? "active" : ""}`}
          >
            My Interviews
          </Link>
          <Link
            to="/pricing"
            className={`nav-link ${isActive("/pricing") ? "active" : ""}`}
          >
            Pricing
          </Link>
        </div>
        <div className="nav-actions">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
};
