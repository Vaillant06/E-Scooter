import { Link } from "react-router-dom";
import "./ScooterCard.css";

function ScooterCard({ scooter }) {
  const isunavailable = scooter.status === "unavailable";
  const isActive = scooter.status === "active";

  return (
    <div className={`scooter-card ${!isActive? "disabled" : ""}`}>

      {/* Image */}
      <img
        src={"/scooter.webp"}
        alt={scooter.scooterId}
        className="scooter-img"
      />

      {/* Overlay for active scooters */}
      {isActive && (
        <div className="overlay">
          <span className="text-success">Active</span>
        </div>
      )}

      {/* Details */}
      <h4 className="mt-2">{scooter.scooterId}</h4>
      <p>Battery: {scooter.batteryHealth}</p>
      <p>Status: {scooter.status}</p>

      {/* Buttons stacked vertically */}
      <div className="actions-vertical">
        <Link
          to={isunavailable ? "/tracking" : "#"}
          className={`btn btn-secondary mb-2 ${!isunavailable ? "disabled-btn" : ""}`}
          state={isunavailable ? { scooter } : null}
        >
          View Location
        </Link>

        <Link
          to={isunavailable ? "/book" : "#"}
          className={`btn btn-primary mb-2 ${!isunavailable ? "disabled-btn" : ""}`}
          state={isunavailable ? { scooter } : null}
        >
          Select Scooter
        </Link>
      </div>
    </div>
  );
}

export default ScooterCard;
