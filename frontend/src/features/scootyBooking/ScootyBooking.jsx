import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";


import "./ScootyBooking.css";

function ScooterBooking() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const scooter = location.state?.scooter;
    const [estimatedMinutes, setEstimatedMinutes] = useState(15);


    if (!scooter) {
        return <h3 className="p-4 text-white">Invalid booking request</h3>;
    }

    const handleConfirmBooking = async () => {
        const userConfirmed = window.confirm(
        `Start ride for approximately ${estimatedMinutes} minutes?`
        );
        if (!userConfirmed) return;
    
        // send booking to backend
        await fetch("http://localhost:8000/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            scooterId: scooter.scooterId,
            model: scooter.scooterId,
            userId: "student123",
            estimatedMinutes
        })
        });

        localStorage.setItem("rideStartTime", new Date().toISOString());
        localStorage.setItem("estimatedMinutes", estimatedMinutes);
        localStorage.setItem("scooterId", scooter.scooterId);
    
        navigate("/ride-timer", {
        state: {
            estimatedMinutes,
            scooter,
            startTime: new Date().toISOString()
        }
        });
    };
  
return (
    <div className="dashboard-container">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="dashboard-body">
            <Sidebar
            open={sidebarOpen}
            toggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="dashboard-main booking-page">
                <h2 className="text-white mb-4">{scooter.scooterId}</h2>

                <div className="booking-details mb-5">
                    <img
                    src={"images/scooter.webp"}
                    alt="Scooter"
                    className="booking-scooter-img mb-4"
                    />

                    <p><b>Scooter ID:</b> {scooter.scooterId}</p>
                    <p><b>Battery:</b> {scooter.batteryHealth}%</p>
                    <p><b>Base Fee:</b> ₹{scooter.baseFee}</p>
                    <p><b>Rate per Minute:</b> ₹{scooter.ratePerMin}</p>
                </div>

                <div className="estimated-time-container mb-4">
                    <label><b>Estimated Ride Duration:</b></label>

                    <input
                        type="range"
                        min="1"
                        max="180"
                        step="1"
                        value={estimatedMinutes}
                        className="form-range mt-3 w-100"
                        onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    />

                    <p className="mt-2">
                        Selected Time: <b>{estimatedMinutes}</b> min
                    </p>
                </div>



                <div className="booking-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    Cancel
                    </button>

                    <button className="btn btn-primary" onClick={handleConfirmBooking}>
                    Confirm & Start Ride
                    </button>
                </div>
            </main>
        </div>
    </div>
);
}

export default ScooterBooking;
