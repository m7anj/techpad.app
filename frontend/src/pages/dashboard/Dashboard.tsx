import React from 'react'
import { UserButton } from '@clerk/clerk-react'
import './Dashboard.css'

const Dashboard = () => {
    return (
        <div className="dashboard">
            <nav className="nav">
                <div className="container nav-content">
                    <div className="logo">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="logo-icon">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="logo-text mono">TechPrep</span>
                    </div>

                    <div className="nav-menu">
                        <a href="/dashboard" className="nav-link active">Dashboard</a>
                        <a href="/practice" className="nav-link">Practice</a>
                        <a href="/interviews" className="nav-link">Interviews</a>
                        <a href="/pricing" className="nav-link">Pricing</a>
                    </div>

                    <div className="nav-actions">
                        <UserButton />
                    </div>
                </div>
            </nav>

            <main className="main">
                <div className="container">
                    <header className="page-header">
                        <h1>Dashboard</h1>
                        <p>Track your progress and start new practice sessions</p>
                    </header>

                    <div className="grid">
                        <section className="practice-section">
                            <div className="section-header">
                                <h2>Quick Start</h2>
                                <p>Choose your interview type</p>
                            </div>

                            <div className="practice-grid">
                                <div className="practice-card">
                                    <div className="card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <h3>Tech Trivia</h3>
                                    <p>Algorithms, data structures, and system fundamentals</p>
                                    <button className="btn btn-primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                                        </svg>
                                        Start
                                    </button>
                                </div>

                                <div className="practice-card">
                                    <div className="card-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                                            <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                    <h3>System Design</h3>
                                    <p>Architecture, scalability, and trade-offs</p>
                                    <button className="btn btn-primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                                        </svg>
                                        Start
                                    </button>
                                </div>
                            </div>
                        </section>

                        <aside className="sidebar">
                            <section className="stats-section">
                                <div className="section-header">
                                    <h2>Overview</h2>
                                </div>

                                <div className="stats-grid">
                                    <div className="stat">
                                        <span className="stat-value mono">0</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value mono">3</span>
                                        <span className="stat-label">Remaining</span>
                                    </div>
                                </div>
                            </section>

                            <section className="activity-section">
                                <div className="section-header">
                                    <h3>Recent Activity</h3>
                                </div>

                                <div className="activity-empty">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="empty-icon">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <p>No interviews yet</p>
                                    <p className="text-muted">Start your first practice session</p>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
