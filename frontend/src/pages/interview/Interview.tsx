import React from 'react'
import { useParams, useLocation } from 'react-router-dom'
import './Interview.css'

const Interview = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const preset = location.state?.preset;

    return (
        <div className="interview">
            <div className="interview-header">
                <h1>{preset?.type} Interview</h1>
                <p>Topic: {preset?.topic}</p>
                <p>Expected Duration: {preset?.expectedDuration}</p>
                <p>Difficulty: {preset?.difficulty}</p>
            </div>

            <div className="interview-content">
                <div className="question-section">
                    <h2>Question will appear here...</h2>
                </div>

                <div className="controls">
                    <button className="btn btn-primary">Start Recording</button>
                    <button className="btn btn-secondary">End Interview</button>
                </div>
            </div>
        </div>
    )
}

export default Interview