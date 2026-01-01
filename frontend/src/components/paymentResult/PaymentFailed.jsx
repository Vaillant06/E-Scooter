import { useNavigate, useLocation, Link } from "react-router-dom";
import "./PaymentResult.css";

function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reason, scooter } = location.state || {};

  // block refresh direct access
  if (!reason) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="status-page failed mt-5 p-5">
      <h2>❌ Payment Failed</h2>

      <div className="mt-3 text-center">
        <p><span className="text-muted">Reason:</span> {reason}</p>
        {scooter && <p><span className="text-muted">Scooter ID:</span> {scooter.scooterId}</p>}

        <div className="mt-4">
          <button
            className="btn btn-primary me-3"
            onClick={() => navigate(-1)}
          >
            Try Again
          </button>

          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailed;
