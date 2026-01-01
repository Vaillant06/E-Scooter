import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";

import "./RideSummary.css";

function RideSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scooter, startTime, endTime, totalMinutesUsed } = location.state || {};

  if (!scooter) {
    navigate("/dashboard");
    return null;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffMin = Math.max(Math.round(diffMs / 60000), 1); // avoid 0 usage

  // cost
  const usageCost = scooter.ratePerMin * diffMin;
  const totalCost = scooter.baseFee + usageCost;

  return (
    <>
    <Header hideNav />
    <div className="summary-container">
      <h2 className="summary-title text-white">Ride Summary</h2>

      <div className="summary-box">
        <h3 className="summary-scooter">{scooter.scooterId}</h3>

        <div className="summary-row">
          <span>Start Time:</span>
          <b>{start.toLocaleString()}</b>
        </div>

        <div className="summary-row">
          <span>End Time:</span>
          <b>{end.toLocaleString()}</b>
        </div>

        <div className="summary-row">
          <span>Total Duration:</span>
          <b>{diffMin} min</b>
        </div>

        <hr />

        <div className="summary-row">
          <span>Base Fee:</span>
          <b>₹{scooter.baseFee}</b>
        </div>

        <div className="summary-row">
          <span>Usage Fee:</span>
          <b>₹{scooter.ratePerMin} × {diffMin} = ₹{usageCost}</b>
        </div>

        <div className="summary-total">
          <span>Total Cost:</span>
          <b>₹{totalCost}</b>
        </div>
      </div>
      <button
        className="btn btn-primary summary-btn"
        onClick={() => {
          // backup for refresh / accidental reload
          localStorage.setItem(
            "paymentData",
            JSON.stringify({
              scooter,
              totalMinutes: diffMin,
              totalCost,
              startTime,
              endTime,
              username: "Student"
            })
          );

          // navigate with state
          navigate("/payment", {
            state: {
              scooter,
              totalMinutes: diffMin,
              totalCost,
              startTime,
              endTime,
              username: "Student"
            }
          });
        }}
      >
        Proceed to Payment
      </button>

    </div>
    </>
  );
}

export default RideSummary;
