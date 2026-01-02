import { Link } from "react-router-dom";
import "./ScooterCard.css";

function ScooterCard({ scooter }) {
  const isFree = scooter.status === "free";
  const isActive = scooter.status === "active";
  
  // battery display: show "--" when scooter not free
  const batteryDisplay = isFree ? `${scooter.batteryHealth}%` : "--";

  return (
    <div className={`scooter-card ${!isFree ? "disabled" : ""}`}>

      {/* Image */}
      <img
        src={"/scooter.webp"}
        alt={scooter.scooterId}
        className="scooter-img"
      />

      {/* Overlay for unavailable scooters */}
      {!isFree && (
        <div className="overlay">
          <span>Available Soon</span>
        </div>
      )}

      {/* Overlay for active scooters */}
      {!isActive && (
        <div className="overlay">
          <span className="text-success">Active</span>
        </div>
      )}

      {/* Details */}
      <h4 className="mt-2">{scooter.scooterId}</h4>
      <p>Battery: {batteryDisplay}</p>
      <p>Status: {scooter.status}</p>

      {/* Buttons stacked vertically */}
      <div className="actions-vertical">
        <Link
          to={isFree ? "/tracking" : "#"}
          className={`btn btn-secondary mb-2 ${!isFree ? "disabled-btn" : ""}`}
          state={isFree ? { scooter } : null}
        >
          View Location
        </Link>

        <Link
          to={isFree ? "/book" : "#"}
          className={`btn btn-primary mb-2 ${!isFree ? "disabled-btn" : ""}`}
          state={isFree ? { scooter } : null}
        >
          Select Scooter
        </Link>
      </div>
    </div>
  );
}

export default ScooterCard;
