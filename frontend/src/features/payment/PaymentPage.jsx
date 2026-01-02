import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentModes from "../../components/paymentModes/PaymentModes";
import Header from "../../components/Header/Header";
import "./PaymentPage.css";

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- read from navigation state ----
  let {
    scooter,
    totalMinutes,
    totalCost,
    startTime,
    endTime,
    username
  } = location.state || {};

  // ---- fallback to localStorage (refresh-safe) ----
  const stored = JSON.parse(localStorage.getItem("paymentData") || "{}");

  scooter = scooter || stored.scooter;
  totalMinutes = totalMinutes ?? stored.totalMinutes;
  totalCost = totalCost ?? stored.totalCost;
  startTime = startTime || stored.startTime;
  endTime = endTime || stored.endTime;
  username = username || stored.username || "User";

  // ---- redirect if still invalid ----
  useEffect(() => {
    if (!scooter || totalCost == null) {
      const timer = setTimeout(() => navigate("/dashboard"), 800);
      return () => clearTimeout(timer);
    }
  }, [navigate, scooter, totalCost]);

  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const txnId = "TXN" + Date.now()

  // ---- handle payment ----
  const handlePayment = async () => {
    if (!paymentMode || loading) return;

    setLoading(true);

    // simulate payment gateway delay
    setTimeout(async () => {
      const isSuccess = Math.random() < 0.85; 

      if (!isSuccess) {
        setLoading(false);
        navigate("/payment-failed", {
          state: { reason: "Payment failed. Try again." }
        });
        return;
      }

      try {
        const userId = Number(localStorage.getItem("userId"));

        await fetch("https://e-scooter-33r2.onrender.com/api/save-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scooterId: scooter.scooterId,
            userId,
            totalMinutes,
            totalCost,
            paymentMode,
            transactionId: "TXN" + Date.now(),
            startTime,
            endTime
          })
        });

        // cleanup
        localStorage.removeItem("paymentData");

        navigate("/payment-success", {
          state: {
            scooter,
            totalMinutes,
            totalCost,
            paymentMode,
            startTime,
            endTime,
            username,
            transactionId: txnId
          }
        });

      } catch (err) {
        console.error("Payment save failed", err);
        setLoading(false);
        navigate("/payment-failed", {
          state: { reason: "Server error while saving payment." }
        });
      }
    }, 1500);
  };

  if (!scooter || totalCost == null) {
    return (
      <h3 className="text-center mt-5 text-light">
        Loading payment details...
      </h3>
    );
  }

  // ---------------- UI ----------------
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
            <p>
              <span>Usage ({totalMinutes} min)</span>
              <b>₹{totalCost - scooter.baseFee}</b>
            </p>

            <div className="total-box">
              <span>Total Amount</span>
              <h3>₹{totalCost}</h3>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="pay-section">
            <h5 className="sec-title">Select Payment Method</h5>
            <PaymentModes
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
            />
          </div>

          {/* Actions */}
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
