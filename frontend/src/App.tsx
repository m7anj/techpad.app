import React from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import LandingPage from "./pages/landing/LandingPage";
import Interview from "./pages/interview/Interview";
import Payment from "./pages/payment/Payment";
import MyInterviews from "./pages/myInterviews/MyInterviews";
import "./styles/globals.css";
import "./styles/components/clerk.css";
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview/:id" element={<Interview />} />
          <Route path="/my-interviews" element={<MyInterviews />} />
          <Route path="/pricing" element={<Payment />} />
        </Routes>
      </SignedIn>
    </div>
  );
}

export default App;
