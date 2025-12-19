import { useNavigate } from "react-router-dom";
import "./UpgradeModal.css";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "premium" | "limit";
}

export const UpgradeModal = ({ isOpen, onClose, reason }: UpgradeModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  const content = reason === "premium"
    ? {
        title: "Premium Interview",
        message: "This interview is available exclusively for Pro members.",
        icon: "⭐"
      }
    : {
        title: "Interview Limit Reached",
        message: "You've used all your free interviews. Upgrade to Pro for unlimited access.",
        icon: "🔒"
      };

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal-icon">{content.icon}</div>
        <h2 className="upgrade-modal-title">{content.title}</h2>
        <p className="upgrade-modal-message">{content.message}</p>

        <div className="upgrade-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Maybe Later
          </button>
          <button className="btn btn-primary" onClick={handleUpgrade}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
};
