import { SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "../../components/Logo";
import { Navbar } from "../../components/Navbar";
import "./Payment.css";

const PRICE_IDS = {
  pro_monthly: "price_1SdrpdE889nMAH6yTqfRE4r2",
  pro_yearly: "price_1SeB7qE889nMAH6yykIydOuI",
};

const Payment = () => {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  // Check if user already has pro membership
  const subscriptionPlan = user?.publicMetadata?.plan as string | undefined;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as string | undefined;
  const isProMember = subscriptionPlan && subscriptionPlan.includes('pro') && subscriptionStatus === 'active';

  const handleSelectPlan = async (planType: "pro_monthly" | "pro_yearly") => {
    if (!isSignedIn) {
      return;
    }

    setLoading(planType);

    try {
      const token = await getToken();

      const response = await fetch("http://localhost:4000/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: PRICE_IDS[planType],
          planType: planType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="payment">
      {isSignedIn ? (
        <Navbar />
      ) : (
        <header className="header">
          <div className="container">
            <Logo size="medium" variant="default" className="animate-fade-in" />
          </div>
        </header>
      )}
      <main className="main">
        <div className="container">
          <header className="hero">
            <h1 className="hero-title">Choose your plan</h1>
            <p className="hero-description">
              Start with 3 free interviews, then pick the plan that works for
              you
            </p>
          </header>

          <section className="pricing-section">
            <div className="pricing-grid">
              {/* Free Plan */}
              <div className="pricing-card hover-lift">
                <div className="plan-header">
                  <h3 className="plan-name">Starter</h3>
                  <div className="plan-price">
                    <span className="price-amount">Free</span>
                  </div>
                  <p className="plan-description">
                    Perfect for trying out our platform
                  </p>
                </div>
                <ul className="plan-features">
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>3 practice interviews</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Voice conversation</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Code editor & drawing pad</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Basic performance feedback</span>
                  </li>
                </ul>
                <div className="plan-action">
                  {isSignedIn ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to dashboard
                    </button>
                  ) : (
                    <SignInButton mode="modal">
                      <button className="btn btn-secondary">Get started</button>
                    </SignInButton>
                  )}
                </div>
              </div>

              {/* Pro Monthly Plan */}
              <div className="pricing-card featured hover-lift">
                <div className="popular-badge">Most Popular</div>
                <div className="plan-header">
                  <h3 className="plan-name">Pro Monthly</h3>
                  <div className="plan-price">
                    <span className="price-amount">$7</span>
                    <span className="price-period">/month</span>
                  </div>
                  <p className="plan-description">
                    For serious interview preparation
                  </p>
                </div>
                <ul className="plan-features">
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      <strong>Unlimited</strong> practice interviews
                    </span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>All Starter features</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Detailed performance analytics</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Interview history & playback</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Custom difficulty levels</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                <div className="plan-action">
                  {isSignedIn ? (
                    isProMember ? (
                      <button className="btn btn-secondary" disabled>
                        Current Plan
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSelectPlan("pro_monthly")}
                        disabled={loading !== null}
                      >
                        {loading === "pro_monthly" ? "Loading..." : "Upgrade to Pro"}
                      </button>
                    )
                  ) : (
                    <SignInButton mode="modal">
                      <button className="btn btn-primary">Get started</button>
                    </SignInButton>
                  )}
                </div>
              </div>

              {/* Pro Yearly Plan */}
              <div className="pricing-card hover-lift">
                <div className="plan-header">
                  <h3 className="plan-name">Pro Yearly</h3>
                  <div className="plan-price">
                    <span className="price-amount">$50</span>
                    <span className="price-period">/year</span>
                  </div>
                  <p className="plan-description">
                    Save 40% with annual billing
                  </p>
                </div>
                <ul className="plan-features">
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      <strong>Unlimited</strong> practice interviews
                    </span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>All Starter features</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Detailed performance analytics</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Interview history & playback</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Custom difficulty levels</span>
                  </li>
                  <li className="feature-item">
                    <svg
                      className="feature-check"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.667 5L7.5 14.167 3.333 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                <div className="plan-action">
                  {isSignedIn ? (
                    isProMember ? (
                      <button className="btn btn-secondary" disabled>
                        Current Plan
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSelectPlan("pro_yearly")}
                        disabled={loading !== null}
                      >
                        {loading === "pro_yearly" ? "Loading..." : "Upgrade to Pro Yearly"}
                      </button>
                    )
                  ) : (
                    <SignInButton mode="modal">
                      <button className="btn btn-primary">Get started</button>
                    </SignInButton>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Payment;
