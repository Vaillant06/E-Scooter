import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentModes from "../../components/paymentModes/PaymentModes";
import Header from "../../components/Header/Header";
import "./PaymentPage.css";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ----- try getting values from navigation state -----
  let {
    scooter,
    totalMinutes,
    totalCost,
    startTime,
    endTime,
    username
  } = location.state || {};

  // ----- fallback to localStorage on refresh -----
  const stored = JSON.parse(localStorage.getItem("paymentData") || "{}");

  scooter = scooter || stored.scooter;
  totalMinutes = totalMinutes || stored.totalMinutes;
  totalCost = totalCost || stored.totalCost;
  startTime = startTime || stored.startTime;
  endTime = endTime || stored.endTime;
  username = username || stored.username;

  // ----- redirect if payment details are still missing -----
  useEffect(() => {
    if (!scooter || !totalCost) {
      const timer = setTimeout(() => navigate("/dashboard"), 800);
      return () => clearTimeout(timer);
    }
  }, [navigate, scooter, totalCost]);

  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");

  // ----- handle payment -----
  const handlePayment = () => {
    if (!paymentMode) return;

    setLoading(true);

    setTimeout(() => {
      const isSuccess = Math.random() < 0.85; // 85% success demo

      if (isSuccess) {
        // pass details to success page
        navigate("/payment-success", {
          state: {
            mode: paymentMode,
            totalMinutes,
            totalCost,
            scooter,
            startTime,
            endTime,
            username
          }
        });
      } else {
        navigate("/payment-failed", {
          state: { reason: "Payment failed. Try again." }
        });
      }
    }, 1500);
  };

  if (!scooter || !totalCost) {
    return <h3 className="text-center mt-5 text-light">Loading payment details...</h3>;
  }

  // --------------------- UI ---------------------
  return (
    <>
      <Header hideNav />

      <div className="payment-wrapper">
        <div className="payment-card">

          <h2 className="pay-title">
            <i className="bi bi-credit-card-fill"></i> Payment Details
          </h2>

          {/* Ride Info */}
          <div className="pay-section">
            <h5 className="sec-title">Ride Info</h5>
            <p><span>Scooter ID</span> <b>{scooter.scooterId}</b></p>
            <p><span>Duration</span> <b>{totalMinutes} min</b></p>
            <p><span>Start</span> <b>{new Date(startTime).toLocaleTimeString()}</b></p>
            <p><span>End</span> <b>{new Date(endTime).toLocaleTimeString()}</b></p>
          </div>

          {/* Fare Breakdown */}
          <div className="pay-section">
            <h5 className="sec-title">Fare Breakdown</h5>
            <p><span>Base Fee</span> <b>₹{scooter.baseFee}</b></p>
            <p><span>Usage ({totalMinutes} min)</span> <b>₹{totalCost - scooter.baseFee}</b></p>

            <div className="total-box">
              <span>Total Amount</span>
              <h3>₹{totalCost}</h3>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="pay-section">
            <h5 className="sec-title">Select Payment Method</h5>
            <PaymentModes paymentMode={paymentMode} setPaymentMode={setPaymentMode} />
          </div>

          {/* Buttons */}
          <button
            className="pay-btn"
            onClick={handlePayment}
            disabled={!paymentMode || loading}
          >
            {loading ? "Processing..." : `Pay ₹${totalCost}`}
          </button>

          {!loading && (
            <button className="cancel-btn" onClick={() => navigate(-1)}>
              Go Back
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default PaymentPage;
