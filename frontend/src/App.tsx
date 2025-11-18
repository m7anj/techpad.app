import React from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import './styles/components/App.css'

function App() {
  return (
    <div className="app">
      <SignedOut>
        <div className="landing">
          <h1 className="app-title">TechPrep</h1>
          <p>Practice technical interviews with AI</p>
          <SignInButton mode="modal">
            <button>Get Started</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="authenticated-app">
          <header>
            <h1>TechPrep Dashboard</h1>
            <UserButton />
          </header>
          <main>
            <p>Welcome! Your dashboard will go here.</p>
          </main>
        </div>
      </SignedIn>
    </div>
  )
}

export default App