import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PaymentResult.css";

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // data passed from PaymentPage
  const { mode, totalCost, scooter, totalMinutes, startTime, endTime } =
    location.state || {};

  const [transactionId] = useState(
    "TXN" + Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  const [ready, setReady] = useState(false);

  // ---- handle missing state (page refresh) ----
  useEffect(() => {
    if (!scooter || !totalCost) {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setReady(true);
    }
  }, [navigate, scooter, totalCost]);

  // ---- save payment only once ----
  useEffect(() => {
    if (!ready) return;

    fetch("http://localhost:8000/api/save-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scooterId: scooter.scooterId,
        userId: "student123",
        totalMinutes,
        totalCost,
        paymentMode: mode,
        transactionId,
        startTime,
        endTime,
      }),
    });

    const timer = setTimeout(() => navigate("/dashboard"), 5000);
    return () => clearTimeout(timer);
  }, [ready, navigate, scooter, totalMinutes, totalCost, mode, transactionId, startTime, endTime]);

  if (!ready) {
    return (
      <div className="status-page mt-5 p-5">
        <h3 className="text-light">Processing Payment...</h3>
      </div>
    );
  }

  return (
    <div className="status-page success mt-5 p-5">
      <h2>✅ Payment Successful</h2>

      <div className="mt-3 text-center">
        <p><span className="text-muted">Amount Paid</span> : ₹{totalCost}</p>
        <p><span className="text-muted">Payment Mode</span> : {mode}</p>
        <p><span className="text-muted">Transaction ID</span> : {transactionId}</p>
        <p><span className="text-muted">Redirecting to dashboard...</span></p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
