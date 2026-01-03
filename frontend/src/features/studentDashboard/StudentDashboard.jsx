/*  -----------------------------------
        STUDENT DASHBOARD PAGE
-----------------------------------  */
import { useState, useEffect } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ScooterGrid from "../../components/ScooterGrid/ScooterGrid";

import "./StudentDashboard.css";

function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
  
    fetch(`https://e-scooter-33r2.onrender.com/api/current/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch current ride");
        return res.json();
      })
      .then(data => {
        if (data.active) {
          setCurrentRide(data.booking);
        } else {
          setCurrentRide(null);
        }
      })
      .catch(err => {
        console.error("Error fetching current ride:", err);
        setCurrentRide(null);
      });
  }, []);
  
  return (
    <div className="dashboard-container">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="dashboard-body">
        <Sidebar
          open={sidebarOpen}
          toggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="dashboard-main">
        {currentRide ? (
            <div className="active-ride">
              <h3>Active Ride</h3>
              <p>Scooter: {currentRide.scooterId}</p>
              <p>Started at: {new Date(currentRide.startTime).toLocaleTimeString()}</p>
            </div>
            ) : (
            <>
              <h4 className="message mb-4">
                <i className="bi bi-flag-fill"></i>
                No active ride. You can book a scooter below!
              </h4>

              <ScooterGrid />   {/* ScooterGrid already filters free scooters */}
            </>
          )}
        </main>
      </div>

    </div>
  );
}

export default StudentDashboard;
