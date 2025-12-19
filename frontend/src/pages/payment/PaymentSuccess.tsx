import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import "./Payment.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const sessionId = searchParams.get("session_id");

  return (
    <div className="payment">
      <header className="header">
        <div className="container">
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="success-container">
            <div className="success-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="40" cy="40" r="40" fill="#10B981" />
                <path
                  d="M25 40L35 50L55 30"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="success-title">Payment Successful!</h1>
            <p className="success-message">
              Welcome to TechPad Pro, {user?.firstName || "there"}! 🎉
            </p>
            <p className="success-description">
              You now have unlimited access to all premium features including
              unlimited practice interviews, detailed analytics, and priority
              support.
            </p>
            {sessionId && (
              <p className="session-id">Session ID: {sessionId}</p>
            )}
            <div className="success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
            <p className="redirect-message">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
