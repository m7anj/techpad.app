import React from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import Dashboard from './pages/dashboard/Dashboard'
import LandingPage from './pages/landing/LandingPage'
import { Routes } from 'react-router-dom'
import './styles/components/App.css'
import { Route } from 'react-router-dom'

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