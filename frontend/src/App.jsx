import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./features/login/LoginPage";
import SignUpPage from "./features/signup/SignUpPage";
import StudentDashboard from "./features/studentDashboard/StudentDashboard";
import ScootyBooking from "./features/scootyBooking/ScootyBooking";
import RideTimer from "./features/rideTimer/RideTimer";
import RideSummary from "./features/rideSummary/RideSummary";
import TrackingPage from "./features/tracking/TrackingPage";
import PaymentPage from "./features/payment/PaymentPage";
import WalletPage from "./features/wallet/WalletPage";
import RideHistoryPage from "./features/rideHistory/RideHistoryPage";

import PaymentSuccess from "./components/paymentResult/PaymentSuccess";
import PaymentFailed from "./components/paymentResult/PaymentFailed";

import "./styles/App.css";

function App() {
  const isLoggedIn = !!localStorage.getItem("userId");

  return (
    <>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} /> 
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/dashboard" element={isLoggedIn ? <StudentDashboard /> : <Navigate to="/" />} />
      <Route path="/book" element={isLoggedIn ? <ScootyBooking /> : <Navigate to="/" />} />
      <Route path="/ride-timer" element={<RideTimer />} />
      <Route path="/ride-summary" element={<RideSummary />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/ride_history" element={<RideHistoryPage />} />

      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />

      <Route path="*" element={<h1>404 - Page not found</h1>} />
    </Routes>
    </>
  );
}

export default App;
