import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./RideTimer.css";

function RideTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { estimatedMinutes, scooter, startTime } = location.state || {};

  const storedStart = localStorage.getItem("rideStartTime");
  const storedEst = localStorage.getItem("estimatedMinutes");
  const storedScooterId = localStorage.getItem("scooterId");
  const storedExtended = localStorage.getItem("rideExtended") === "true";

  const finalEstMinutes = storedEst ? Number(storedEst) : estimatedMinutes;

  if (!finalEstMinutes) {
    navigate("/dashboard");
    return null;
  }

  const startDate = storedStart ? new Date(storedStart) : new Date(startTime);

  const [minutesLeft, setMinutesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [extendAsked, setExtendAsked] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffSec = Math.floor((now - startDate) / 1000); 
      const totalRemainingSec = Math.max(finalEstMinutes * 60 - diffSec, 0);

      setMinutesLeft(Math.floor(totalRemainingSec / 60));
      setSecondsLeft(totalRemainingSec % 60);
    }, 1000);

    return () => clearInterval(interval);
  }, [finalEstMinutes, startDate]);

  useEffect(() => {
    if (!extendAsked && !storedExtended && minutesLeft === 1 && secondsLeft === 0) {
      setShowExtendPrompt(true);
      setExtendAsked(true);
    }
  }, [minutesLeft, secondsLeft, extendAsked, storedExtended]);

  const handleEndRide = () => {
    const stop = window.confirm("End ride now?");
    if (!stop) return;

    const endTime = new Date().toISOString();
    localStorage.removeItem("rideStartTime");
    localStorage.removeItem("estimatedMinutes");
    localStorage.removeItem("scooterId");
    localStorage.removeItem("rideExtended"); // reset extension for next ride

    navigate("/ride-summary", {
      state: { scooter, startTime, endTime }
    });
  };

  const extendRide = () => {
    if (storedExtended) {
      alert("You can only extend the ride once.");
      return;
    }

    const extra = parseInt(prompt("Add extra minutes:", "10"));
    if (!isNaN(extra) && extra > 0) {
      const updatedMinutes = finalEstMinutes + extra;
      localStorage.setItem("estimatedMinutes", updatedMinutes);
      localStorage.setItem("rideExtended", "true");
      window.location.reload();
    }

    setShowExtendPrompt(false);
  };

  return (
    <>
      <Header hideNav />
      <div className="ride-page">
        <div className="ride-header text-white">
          <h1>Ride In Progress</h1>
          <h2 className="mt-2">{scooter?.scooterId || storedScooterId}</h2>
        </div>

        <div className="timer-circle">
          <div className="timer-text">
            {String(minutesLeft).padStart(2, "0")}:
            {String(secondsLeft).padStart(2, "0")}
          </div>
        </div>

        <div className="ride-actions">
          <button className="btn btn-secondary mt-3" onClick={handleEndRide}>
            End Ride
          </button>
        </div>

        {showExtendPrompt && (
          <div className="extend-popup">
            <div className="extend-box">
              <p><b>Only 1 minute left</b><br/>Extend your ride?</p>

              <button className="btn btn-primary" onClick={extendRide}>
                Extend
              </button>

              <button className="btn btn-secondary" onClick={() => setShowExtendPrompt(false)}>
                No
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default RideTimer;
  