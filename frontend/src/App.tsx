import React from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/dashboard/Dashboard'
import LandingPage from './pages/landing/LandingPage'
import './styles/globals.css'
import './styles/components/clerk.css'
function App() {
    return (
      <div className="app">

        <SignedOut>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/welcome" element={<LandingPage />} />
          </Routes>
        </SignedOut>

        <SignedIn>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </SignedIn>
      </div>
    )
  }

export default App