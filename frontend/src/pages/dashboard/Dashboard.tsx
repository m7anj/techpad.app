import React from 'react'
import { UserButton } from '@clerk/clerk-react'
import './Dashboard.css'

const Dashboard = () => {
    return (
        <div className="dashboard">
            <nav className="nav">
                <div className="container nav-content">
                    <div className="logo">
                        <span className="logo-text mono">TechPrep</span>
                    </div>
                    <div className="nav-actions">
                        <UserButton />
                    </div>
                </div>
            </nav>

            <main className="main">
                <div className="container">
                    <header className="welcome-section">
                        <h1>Ready to practice?</h1>
                        <p>Choose your interview type and get started</p>
                    </header>

                    <section className="interview-cards">
                        {/* Your interview cards will go here */}
                    </section>
                </div>
            </main>
        </div>
    )
}

export default Dashboard