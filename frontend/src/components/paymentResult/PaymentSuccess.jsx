import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PaymentResult.css";

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- data passed from PaymentPage ----
  const {
    paymentMode,
    totalCost,
    scooter,
    totalMinutes,
    startTime,
    endTime,
    transactionId
  } = location.state || {};

  const [ready, setReady] = useState(false);

  // ---- guard against refresh / direct access ----
  useEffect(() => {
    if (!scooter || totalCost == null) {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setReady(true);
    }
  }, [navigate, scooter, totalCost]);

  // ---- auto redirect after success ----
  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [ready, navigate]);

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
        <p>
          <span className="text-muted">Amount Paid</span> : ₹{totalCost}
        </p>

        <p>
          <span className="text-muted">Payment Mode</span> : {paymentMode}
        </p>

        <p>
          <span className="text-muted">Transaction ID</span> : {transactionId}
        </p>

        <p>
          <span className="text-muted">Ride Duration</span> : {totalMinutes} min
        </p>

        <p className="mt-3 text-muted">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
