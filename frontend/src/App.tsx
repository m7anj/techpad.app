// import React from "react";
import { useState } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import LandingPage from "./pages/landing/LandingPage";
import Interview from "./pages/interview/Interview";
import Payment from "./pages/payment/Payment";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import UserProfile from "./pages/profile/UserProfile";
import Leaderboard from "./pages/leaderboard/Leaderboard";
import Contribution from "./pages/contribution/Contribution";
import Feedback from "./pages/feedback/Feedback";
import InterviewResults from "./pages/results/InterviewResults";
import { UsernameSetup } from "./components/UsernameSetup";
import "./styles/globals.css";
import "./styles/components/clerk.css";

function AppContent() {
  const { user } = useUser();
  const [usernameSetupComplete, setUsernameSetupComplete] = useState(false);

  // Check if user needs to set username
  const needsUsername = user && !user.username && !usernameSetupComplete;

  if (needsUsername) {
    return <UsernameSetup onComplete={() => setUsernameSetupComplete(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/interview/:id" element={<Interview />} />
      <Route path="/results/:id" element={<InterviewResults />} />
      <Route path="/pricing" element={<Payment />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/u/:username" element={<UserProfile />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/contribution" element={<Contribution />} />
      <Route path="/feedback" element={<Feedback />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="app">
      <SignedOut>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/pricing" element={<Payment />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        <AppContent />
      </SignedIn>
    </div>
  );
}

export default App;
