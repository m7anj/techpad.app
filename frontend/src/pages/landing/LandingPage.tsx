import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import Logo from "../../components/Logo";
import "./LandingPage.css";
import "./animated.css";
import icon from "../../icons/logo-text.png";

const LandingPage = () => {
  return (
    <div className="landing">
      <header className="header">
        <div className="container">
          <Logo
            size="medium"
            variant="default"
            showText={true}
            className="animate-fade-in"
          />
        </div>
      </header>
      <main className="main">
        <div className="container">
          <header className="hero">
            <h1 className="hero-title animate-fade-in-up">
              Practice technical interviews
              <br />
              <span className="title-accent">with AI precision</span>
            </h1>

            <p className="hero-description animate-fade-in-up animate-delay-200">
              Companies are stepping away from{" "}
              <span className="leet-text">Leet</span>
              <span className="code-text">Code</span>. Your ability to
              communicate, write, and draw your thinking matters more than ever.
            </p>

            <div className="hero-action animate-fade-in-up animate-delay-400">
              <div className="auth-buttons">
                <SignUpButton mode="modal">
                  <button className="btn btn-primary hover-lift">
                    Sign up
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="btn btn-secondary hover-lift">
                    Log in
                  </button>
                </SignInButton>
              </div>
              <span className="trial-note">3 free interviews</span>
            </div>
          </header>

          <section className="features">
            <div className="features-grid">
              <div className="feature animate-fade-in-up animate-delay-300 hover-lift">
                <div className="feature-icon animate-float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M19 10v2a7 7 0 0 1-14 0v-2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="12"
                      y1="19"
                      x2="12"
                      y2="23"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="8"
                      y1="23"
                      x2="16"
                      y2="23"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3>Voice Practice</h3>
                <p>Natural conversation flow with interview-style responses</p>
              </div>

              <div className="feature animate-fade-in-up animate-delay-400 hover-lift">
                <div className="feature-icon animate-float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="8"
                      y1="21"
                      x2="16"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="12"
                      y1="17"
                      x2="12"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3>Code & Draw</h3>
                <p>
                  Explain technical concepts with a code editor and a drawing
                  pad
                </p>
              </div>

              <div className="feature animate-fade-in-up animate-delay-500 hover-lift">
                <div className="feature-icon animate-float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM19 4h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3>Analyse your performance</h3>
                <p>Detailed scoring and improvement insights</p>
              </div>

              <div className="feature animate-fade-in-up animate-delay-400 hover-lift">
                <div className="feature-icon animate-float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3>Adaptive Questions</h3>
                <p>Dynamic follow-ups based on your responses</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
