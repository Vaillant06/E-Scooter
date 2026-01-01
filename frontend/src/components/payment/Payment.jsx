import { useEffect, useState } from "react";
import ScooterList from "./pages/ScooterList";
import EstimateRide from "./pages/EstimateRide";
import TrackingRide from "./pages/TrackingRide";
import Payment from "./pages/Payment";
import OvertimeModal from "./components/OvertimeModal";
import useRideTimer from "./hooks/useRideTimer";
import "./index.css";

const API = import.meta.env.VITE_API_URL;

function App() {
  const [view, setView] = useState("list");
  const [scooters, setScooters] = useState([]);
  const [scooter, setScooter] = useState(null);
  const [ridingTime, setRidingTime] = useState(0);
  const [price, setPrice] = useState(15);
  const [rideDetails, setRideDetails] = useState({});
  const [showOvertime, setShowOvertime] = useState(false);

  const { rideTimer, startTimer, stopTimer, formatTime } = useRideTimer();

  useEffect(() => {
    fetch(API + "/scooty")
      .then(res => res.json())
      .then(setScooters);
  }, []);

  return (
    <div className="mobile-container">
      {showOvertime && (
        <OvertimeModal
          committedDuration={ridingTime}
          onEnd={() => setShowOvertime(false)}
          onContinue={() => setShowOvertime(false)}
        />
      )}

      {view === "list" && (
        <ScooterList
          scooters={scooters}
          onSelect={(s) => {
            setScooter(s);
            setView("estimate");
          }}
        />
      )}

      {view === "estimate" && (
        <EstimateRide
          scooter={scooter}
          ridingTime={ridingTime}
          price={price}
          onBack={() => setView("list")}
          onChange={(e) => {
            const v = +e.target.value;
            setRidingTime(v);
            setPrice(15 + v * 2);
          }}
          onStart={() => {
            startTimer();
            setView("tracking");
          }}
        />
      )}

      {view === "tracking" && (
        <TrackingRide
          scooter={scooter}
          rideTimer={rideTimer}
          formatTime={formatTime}
          onEnd={() => {
            stopTimer();
            setRideDetails({ duration: 10, amount: 100 });
            setView("payment");
          }}
        />
      )}

      {view === "payment" && (
        <Payment
          details={rideDetails}
          onPay={() => setView("list")}
        />
      )}
    </div>
  );
}

export default App;
