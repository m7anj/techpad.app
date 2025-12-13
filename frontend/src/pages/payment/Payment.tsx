import { SignInButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import { Navbar } from "../../components/Navbar";
import "./Payment.css";

const Payment = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const handleSelectPlan = (planType: string) => {
    if (!isSignedIn) {
      return;
    }
    // Stripe integration will go here
    console.log("Selected plan:", planType);
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
                    <a
                      href="https://buy.stripe.com/test_8x25kDe3b8SQaWZ15e8EM00"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="btn btn-primary">
                        Upgrade to Pro
                      </button>
                    </a>
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
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSelectPlan("pro-yearly")}
                    >
                      Upgrade to Pro Yearly
                    </button>
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
