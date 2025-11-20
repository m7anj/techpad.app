import { SignInButton } from '@clerk/clerk-react'
import React from 'react'
import './LandingPage.css'

const LandingPage = () => {
    return (
        <div className="landing">
            <nav className="nav">
                <div className="container nav-content">
                    <div className="logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="logo-icon">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="logo-text mono">TechPrep</span>
                    </div>
                </div>
            </nav>

            <main className="main">
                <div className="container">
                    <section className="hero">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                Practice technical interviews
                                <br />
                                <span className="title-accent">with AI precision</span>
                            </h1>
                            <p className="hero-description">
                                Real-time voice conversations. Intelligent follow-ups.
                                Detailed feedback. Everything you need to ace your next interview.
                            </p>

                            <div className="hero-actions">
                                <SignInButton mode="modal">
                                    <button className="btn btn-primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12l5 5l10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Start practicing
                                    </button>
                                </SignInButton>
                                <span className="hero-note">3 free interviews</span>
                            </div>
                        </div>

                        <div className="hero-visual">
                            <div className="visual-grid">
                                <div className="visual-card">
                                    <div className="card-header">
                                        <div className="status-indicator"></div>
                                        <span className="card-title mono">Live Session</span>
                                    </div>
                                    <div className="card-content">
                                        <div className="waveform">
                                            <div className="wave-bar" style={{ height: '12px' }}></div>
                                            <div className="wave-bar" style={{ height: '24px' }}></div>
                                            <div className="wave-bar" style={{ height: '8px' }}></div>
                                            <div className="wave-bar" style={{ height: '16px' }}></div>
                                            <div className="wave-bar" style={{ height: '20px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="features">
                        <div className="features-grid">
                            <div className="feature">
                                <div className="feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h3>Voice Practice</h3>
                                <p>Natural conversation flow with contextual AI responses</p>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h3>Eye Tracking Analysis</h3>
                                <p>Advanced gaze patterns and attention monitoring during interviews</p>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM19 4h-4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h3>Performance Analytics</h3>
                                <p>Detailed scoring across technical depth and communication clarity</p>
                            </div>

                            <div className="feature">
                                <div className="feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h3>Adaptive Questions</h3>
                                <p>Dynamic follow-ups that probe deeper based on your responses</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default LandingPage
