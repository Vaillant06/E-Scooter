import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./RideTimer.css";

function RideTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { estimatedMinutes, scooter, startTime } = location.state || {};

  // ---- restore from localStorage (refresh-safe) ----
  const storedStart = localStorage.getItem("rideStartTime");
  const storedEst = localStorage.getItem("estimatedMinutes");
  const storedScooterId = localStorage.getItem("scooterId");
  const storedExtended = localStorage.getItem("rideExtended") === "true";

  const finalEstMinutes = storedEst ? Number(storedEst) : estimatedMinutes;

  // ---- redirect if invalid ----
  useEffect(() => {
    if (!finalEstMinutes) {
      navigate("/dashboard");
    }
  }, [finalEstMinutes, navigate]);

  if (!finalEstMinutes) return null;

  const startDate = storedStart
    ? new Date(storedStart)
    : new Date(startTime);

  // ---- timer state ----
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [extendAsked, setExtendAsked] = useState(false);
  const [ending, setEnding] = useState(false);

  // ---- main timer ----
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffSec = Math.floor((now - startDate) / 1000);
      // Allow negative time - don't clamp to 0
      const totalRemainingSec = finalEstMinutes * 60 - diffSec;

      // Handle negative time
      if (totalRemainingSec < 0) {
        const absSec = Math.abs(totalRemainingSec);
        setMinutesLeft(-Math.floor(absSec / 60));
        setSecondsLeft(absSec % 60);
      } else {
        setMinutesLeft(Math.floor(totalRemainingSec / 60));
        setSecondsLeft(totalRemainingSec % 60);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [finalEstMinutes, startDate]);

  // ---- extend prompt at 1 minute ----
  useEffect(() => {
    if (
      !extendAsked &&
      !storedExtended &&
      minutesLeft === 1 &&
      secondsLeft === 0
    ) {
      setShowExtendPrompt(true);
      setExtendAsked(true);
    }
  }, [minutesLeft, secondsLeft, extendAsked, storedExtended]);

  // ---- end ride ----
  const handleEndRide = async () => {
    if (ending) return;

    const stop = window.confirm("End ride now?");
    if (!stop) return;

    setEnding(true);

    const userId = Number(localStorage.getItem("userId"));
    const endTime = new Date().toISOString();

    try {
      const res = await fetch("https://e-scooter-33r2.onrender.com/api/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || "Failed to end ride. Please try again.");
        setEnding(false);
        return;
      }
    } catch (err) {
      console.error("Failed to end ride on backend", err);
    }

    // cleanup
    localStorage.removeItem("rideStartTime");
    localStorage.removeItem("estimatedMinutes");
    localStorage.removeItem("scooterId");
    localStorage.removeItem("rideExtended");

    navigate("/ride-summary", {
      state: { scooter, startTime, endTime }
    });
  };

  // ---- extend ride ----
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

      setShowExtendPrompt(false);
      setExtendAsked(false);
      setMinutesLeft(updatedMinutes);
    }
  };

  // ---------------- UI ----------------
  return (
    <>
      <Header hideNav />

      <div className="ride-page">
        <div className="ride-header text-white">
          <h1>Ride In Progress</h1>
          <h2 className="mt-2">
            {scooter?.scooterId || storedScooterId}
          </h2>
        </div>

        <div className="timer-circle">
          <div className="timer-text">
            {minutesLeft < 0 ? "-" : ""}
            {String(Math.abs(minutesLeft)).padStart(2, "0")}:
            {String(secondsLeft).padStart(2, "0")}
          </div>
        </div>

        <div className="ride-actions">
          <button
            className="btn btn-secondary mt-3"
            onClick={handleEndRide}
            disabled={ending}
          >
            {ending ? "Ending Ride..." : "End Ride"}
          </button>
        </div>

        {showExtendPrompt && (
          <div className="extend-popup">
            <div className="extend-box">
              <p>
                <b>Only 1 minute left</b>
                <br />
                Extend your ride?
              </p>

              <button className="btn btn-primary" onClick={extendRide}>
                Extend
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowExtendPrompt(false)}
              >
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
