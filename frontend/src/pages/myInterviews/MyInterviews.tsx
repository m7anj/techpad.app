import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navbar } from "../../components/Navbar";
import "./MyInterviews.css";

interface Interview {
  _id: string;
  userId: string;
  interviewType: string;
  completedAt: Date;
  duration: number;
  score?: number;
  feedback?: string;
}

const MyInterviews = () => {
  const { getToken } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:4000/myInterviews", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }

        const data = await response.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [getToken]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="my-interviews">
      <Navbar />
      <div className="container">
        <div className="interviews-header">
          <h1>My Interviews</h1>
          <p className="subtitle">Review your completed interview sessions</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading interviews...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="empty-state">
            <h2>No interviews yet</h2>
            <p>Complete your first interview to see it here</p>
          </div>
        ) : (
          <div className="interviews-table-container">
            <table className="interviews-table">
              <thead>
                <tr>
                  <th>Interview Type</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Score</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview._id}>
                    <td>
                      <span className="interview-type">
                        {interview.interviewType}
                      </span>
                    </td>
                    <td>{formatDate(interview.completedAt)}</td>
                    <td>{formatDuration(interview.duration)}</td>
                    <td>
                      {interview.score ? (
                        <span className="score-badge">{interview.score}%</span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="feedback-cell">
                      {interview.feedback || (
                        <span className="text-muted">No feedback</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInterviews;
