import { Navbar } from "../../components/Navbar";
import "../../styles/shared-layout.css";
import "./Contribution.css";

const Contribution = () => {
  return (
    <div className="contribution-page page-wrapper">
      <Navbar />
      <main className="main">
        <div className="container">
          <div className="placeholder-container">
            <h1 className="placeholder-title">
              <span className="gradient-text">Contributions</span>
            </h1>
            <p className="placeholder-subtitle">Coming Soon</p>
            <p className="placeholder-description">
              We're building something amazing! This page will allow you to
              contribute interview questions and help grow the TechPad
              community.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contribution;
