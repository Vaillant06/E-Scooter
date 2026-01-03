import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ open, toggle }) {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "unknown@ssn.edu.in";
  const lastLogin = localStorage.getItem("lastLogin") || "Today";

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("lastLogin");

    navigate("/login");
  };

  return (
    <aside className={`sidebar ${open ? "open" : "collapsed"}`}>
      <span className="collapse-btn" onClick={toggle}>
        <i className="bi bi-layout-sidebar"></i>
      </span>

      {open && (
        <>
          <div className="profile">
            <span className="avatar">👤</span>
            <div className="user-details">
              <p><strong>{username.toUpperCase()}</strong></p>
              <p>{email}</p>
              <p className="last-login">Last login: {lastLogin}</p>
            </div>
          </div>

          <hr />

          <div className="redirection">
            <Link to="/wallet" className="btn btn-info">
              <i className="bi bi-book me-2"></i> My Wallet
            </Link>

            <Link to="/ride_history" className="btn btn-ternary">
              <i className="bi bi-clock-history me-2"></i> Ride History
            </Link>

            <a
            className="btn btn-secondary mt-2"
            href="mailto:support@ssn.edu.in?subject=Signup%20Issue&body=Please%20describe%20your%20problem"
            >
            Contact Us
            </a>

            <button className="btn btn-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-left me-2"></i> Logout
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

export default Sidebar;
