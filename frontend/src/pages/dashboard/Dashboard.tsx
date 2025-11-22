import React from 'react'
import { useState, useEffect } from 'react'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {

    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [presets, setPresets] = useState<any[]>([]);

    useEffect(() => {
    
    const fetchPresets = async () => {
        try {
            
            const token = await getToken();
            console.log(token);

            const res = await fetch("http://localhost:4000/explore", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch data");
            }

            const res_json = await res.json();
            console.log(res_json);
            setPresets(res_json);

        }   catch(err) {
            console.log(err);
        }
    };

    fetchPresets();

    }, [getToken]);


    const startInterview = (preset: any) => {
        console.log("Starting interview with preset:", preset);
        navigate(`/interview/${preset.id}`, { state: { preset } });
    }
    
    
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
                        {presets ? (
                            presets.map((preset) => (
                                <div key={preset.id} className="preset-card">
                                    <h3>{preset.type}</h3>
                                    <p>{preset.topic}</p>
                                    <p>{preset.description}</p>
                                    <p>{preset.expectedDuration}</p>
                                    <button className="btn btn-primary" onClick={() => startInterview(preset)}>Start</button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-activity">
                                <p>No presets found</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

export default Dashboard