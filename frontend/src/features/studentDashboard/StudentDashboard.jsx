/*  -----------------------------------
        STUDENT DASHBOARD PAGE
-----------------------------------  */

import { useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ScooterGrid from "../../components/ScooterGrid/ScooterGrid";

import "./StudentDashboard.css";

function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // later: replace null with data from backend `/api/current/:userId`
  const currentRide = null;

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
            <>
            <div class="message text-white">
              <h3 className="mb-4">Current Ride</h3>
              {/* later show ride info here */}
            </div>
            </>
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
