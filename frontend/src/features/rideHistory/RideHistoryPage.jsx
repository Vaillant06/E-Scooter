import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RideHistoryPage.css";

function RideHistory() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/history/student123")
      .then(res => res.json())
      .then(data => setRides(data))
      .catch(err => console.error(err));
  }, []);

  if (!rides.length) {
    return (
      <div className="history-container">
        <div className="empty-box">
          <i className="bi bi-clock-history empty-icon"></i>
          <p>No previous rides found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <h2 className="history-title">Ride History</h2>

      <div className="history-list">
        {rides.map((ride, index) => (
          <div className="history-card" key={index}>
            <div className="history-header">
              <span className="scooter-id">
                🛵 {ride.scooterId}
              </span>
              <span className="ride-cost">
                ₹{ride.totalCost}
              </span>
            </div>

            <div className="history-body">
              <p><i className="bi bi-clock"></i> Duration: <b>{ride.totalMinutes} min</b></p>
              <p><i className="bi bi-credit-card"></i> Payment Mode: <b>{ride.paymentMode}</b></p>
              <p><i className="bi bi-hash"></i> Transaction ID: <b>{ride.transactionId}</b></p>
            </div>

            <div className="history-footer">
              <p><i className="bi bi-flag"></i> Start: {new Date(ride.startTime).toLocaleString()}</p>
              <p><i className="bi bi-flag-fill text-danger"></i> End: {new Date(ride.endTime).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link to="/dashboard" className="btn btn-secondary mx-2">Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default RideHistory;
