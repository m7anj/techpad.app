import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import "./UsernameSetup.css";

interface UsernameSetupProps {
  onComplete: () => void;
}

export const UsernameSetup = ({ onComplete }: UsernameSetupProps) => {
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate username
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);

    try {
      // Update username in Clerk
      await user?.update({
        username: username,
      });

      // Wait a bit for Clerk to sync
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onComplete();
    } catch (err: any) {
      console.error("Error setting username:", err);
      if (err.errors?.[0]?.message?.includes("already taken")) {
        setError("This username is already taken. Please choose another.");
      } else {
        setError("Failed to set username. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-setup-overlay">
      <div className="username-setup-modal">
        <div className="username-setup-header">
          <h1>Welcome to TechPad!</h1>
          <p>Before you continue, please choose a username</p>
        </div>

        <form onSubmit={handleSubmit} className="username-setup-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              disabled={loading}
              className={error ? "error" : ""}
            />
            {error && <span className="error-message">{error}</span>}
            <span className="helper-text">
              3-20 characters, letters, numbers, and underscores only
            </span>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !username}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
