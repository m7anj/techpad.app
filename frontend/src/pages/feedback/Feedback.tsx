import { Navbar } from "../../components/Navbar";
import "../../styles/shared-layout.css";
import "./Feedback.css";

const Feedback = () => {
  return (
    <div className="feedback-page page-wrapper">
      <Navbar />
      <main className="main">
        <div className="container">
          <div className="placeholder-container">
            <h1 className="placeholder-title">
              <span className="gradient-text">Feedback</span>
            </h1>
            <p className="placeholder-subtitle">Coming Soon</p>
            <p className="placeholder-description">
              Your feedback matters! Soon you'll be able to share your thoughts,
              report issues, and help us improve TechPad.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
