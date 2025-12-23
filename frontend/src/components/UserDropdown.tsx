import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "./UserDropdown.css";

export const UserDropdown = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleProfileClick = () => {
    if (user?.username) {
      navigate(`/u/${user.username}`);
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.username || "User"}
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {(user.username || user.emailAddresses[0]?.emailAddress)
              ?.charAt(0)
              .toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.username || "User"} />
              ) : (
                <div className="user-avatar-placeholder-large">
                  {(user.username || user.emailAddresses[0]?.emailAddress)
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-dropdown-info">
              <div className="user-dropdown-name">
                {user.username || "User"}
              </div>
              <div className="user-dropdown-email">
                {user.emailAddresses[0]?.emailAddress}
              </div>
            </div>
          </div>

          <div className="user-dropdown-divider"></div>

          <button className="user-dropdown-item" onClick={handleProfileClick}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Profile
          </button>

          <button
            className="user-dropdown-item"
            onClick={() => {
              navigate("/leaderboard");
              setIsOpen(false);
            }}
          >
            <svg
              width="16"
              height="16"
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
            Leaderboard
          </button>

          <button
            className="user-dropdown-item"
            onClick={() => {
              navigate("/pricing");
              setIsOpen(false);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Pricing
          </button>

          <div className="user-dropdown-divider"></div>

          <button
            className="user-dropdown-item user-dropdown-signout"
            onClick={handleSignOut}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
