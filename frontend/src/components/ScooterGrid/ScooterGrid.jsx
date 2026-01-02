import { useEffect, useState } from "react";
import ScooterCard from "../ScooterCard/ScooterCard";
import "./ScooterGrid.css";

function ScooterGrid() {
  const [scooters, setScooters] = useState([]);

  useEffect(() => {
    fetch("https://e-scooter-33r2.onrender.com/api/scooters")
      .then(res => res.json())
      .then(data => setScooters(data))
      .catch(err => console.error("Error fetching scooters:", err));
  }, []);

  return (
    <>
      <h3 className="text-white">Available Scooters</h3>

      <div className="scooter-grid">
        {scooters.length === 0 ? (
          <p className=" text-center text-white">Loading Scooters...</p> 
        ) : (
          scooters.map(scooter => (
            <ScooterCard key={scooter.id} scooter={scooter} />
          ))
        )}
      </div>
    </>
  );
}

export default ScooterGrid;
