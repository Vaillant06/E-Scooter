import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RideHistoryPage.css";

function RideHistory() {
  const [userId, setUserId] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ---- get userId ----
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/login");
      return;
    }
    setUserId(storedUserId);
  }, [navigate]);

  // ---- fetch ride history ----
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    fetch(`https://e-scooter-33r2.onrender.com/api/history/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      })
      .then(data => {
        setRides(data);
        setError("");
      })
      .catch(() => {
        setError("Unable to load ride history");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // ---- loading ----
  if (loading) {
    return (
      <div className="history-container text-center">
        <p className="text-light">Loading ride history...</p>
      </div>
    );
  }

  // ---- error ----
  if (error) {
    return (
      <div className="history-container text-center">
        <p className="text-danger">{error}</p>
        <Link to="/dashboard" className="btn btn-secondary mt-3">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ---- empty ----
  if (!rides.length) {
    return (
      <div className="history-container">
        <div className="empty-box">
          <i className="bi bi-clock-history empty-icon"></i>
          <p>No previous rides found</p>
        </div>

        <div className="mt-3 text-center">
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ---- render list ----
  return (
    <div className="history-container">
      <h2 className="history-title">Ride History</h2>

      <div className="history-list">
        {rides.map(ride => (
          <div className="history-card" key={ride.transactionId}>
            <div className="history-header">
              <span className="scooter-id">🛵 {ride.scooterId}</span>
              <span className="ride-cost">₹{ride.totalCost}</span>
            </div>

            <div className="history-body">
              <p>
                <i className="bi bi-clock"></i>{" "}
                Duration: <b>{ride.totalMinutes} min</b>
              </p>
              <p>
                <i className="bi bi-credit-card"></i>{" "}
                Payment Mode: <b>{ride.paymentMode}</b>
              </p>
              <p>
                <i className="bi bi-hash"></i>{" "}
                Transaction ID: <b>{ride.transactionId}</b>
              </p>
            </div>

            <div className="history-footer">
              <p>
                <i className="bi bi-flag"></i>{" "}
                Start: {new Date(ride.startTime).toLocaleString()}
              </p>
              <p>
                <i className="bi bi-flag-fill text-danger"></i>{" "}
                End: {new Date(ride.endTime).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link to="/dashboard" className="btn btn-secondary mx-2">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default RideHistory;
