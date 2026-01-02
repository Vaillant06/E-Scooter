import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../../components/Header/Header";
import "./RideSummary.css";

function RideSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scooter, startTime, endTime } = location.state || {};

  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    if (!scooter) {
      navigate("/dashboard");
    }
  }, [scooter, navigate]);

  if (!scooter) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMin = Math.max(Math.round((end - start) / 60000), 1);

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
            <b>
              ₹{scooter.ratePerMin} × {diffMin} = ₹{usageCost}
            </b>
          </div>

          <div className="summary-total">
            <span>Total Cost:</span>
            <b>₹{totalCost}</b>
          </div>
        </div>

        <button
          className="btn btn-primary summary-btn"
          onClick={() => {
            const paymentData = {
              scooter,
              totalMinutes: diffMin,
              totalCost,
              startTime,
              endTime,
              username
            };

            localStorage.setItem("paymentData", JSON.stringify(paymentData));

            navigate("/payment", { state: paymentData });
          }}
        >
          Proceed to Payment
        </button>
      </div>
    </>
  );
}

export default RideSummary;
