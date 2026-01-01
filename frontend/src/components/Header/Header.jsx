import { useState } from "react";
import { Link } from "react-router-dom";
import ssnImg from "../../assets/image.png";
import "./Header.css";

function Header({ onMenuClick, hideNav }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header>
      <div className="header-left">

        {/* show sidebar button only if nav is allowed */}
        {!hideNav && (
          <span className="menu-btn" onClick={onMenuClick}>
            <i className="bi bi-list"></i>
          </span>
        )}

        <h1 className="logo">
          <img src={ssnImg} alt="ssn-image" className="ssn-logo" />
          E-Scooter System
          <i className="bi bi-scooter"></i>
        </h1>
      </div>

      {/* Desktop navigation only if nav is shown */}
      {!hideNav && (
        <div className="nav-icons desktop-nav">
          <Link to="/tracking" className="nav">View Map</Link>
          <Link to="/dashboard" className="nav">Dashboard</Link>
        </div>
      )}

      {/* Mobile nav toggle only if nav is shown */}
      {!hideNav && (
        <span
          className="mobile-nav-btn"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          <i className="bi bi-three-dots-vertical"></i>
        </span>
      )}

      {/* Mobile dropdown nav */}
      {!hideNav && mobileNavOpen && (
        <div className="mobile-nav">
          <Link to="/tracking" onClick={() => setMobileNavOpen(false)}>
            View Map
          </Link>
          <Link to="/dashboard" onClick={() => setMobileNavOpen(false)}>
            Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}

export default Header;
