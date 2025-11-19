import { SignIn, SignInButton } from '@clerk/clerk-react'
import React from 'react'

const LandingPage = () => {
    return (
        <div>
            <h1>TechPrep</h1>
            <p>Practice technical interviews with AI</p>
            <p>Sign in to get started</p>
            <SignInButton mode="modal">
                <button>Sign in</button>
            </SignInButton>
        </div>
    )
}

export default LandingPage
