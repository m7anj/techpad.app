import React from "react";
import rocketIcon from "../../icon/rocket.png";
import "./Logo.css";

interface LogoProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "white" | "minimal";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "medium",
  variant = "default",
  className = "",
}) => {
  return (
    <div className={`logo logo--${size} logo--${variant} ${className}`}>
      <div className="logo__text">
        <span className="logo__name">techpad</span>
        <span className="logo__domain">.app</span>
      </div>
    </div>
  );
};

export default Logo;
