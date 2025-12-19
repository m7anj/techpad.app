import React from "react";
import logoImg from "../../icons/logo.png";
import logoTextImg from "../../icons/logo-text.png";
import "./Logo.css";

interface LogoProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "white" | "minimal";
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "large",
  variant = "default",
  className = "",
  showText = false,
}) => {
  const logoSrc = showText ? logoTextImg : logoImg;

  return (
    <div className={`logo logo--${size} logo--${variant} ${className}`}>
      <img src={logoSrc} alt="techpad" className="logo__image" />
    </div>
  );
};

export default Logo;
