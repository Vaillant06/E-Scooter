import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUpPage.css"; 

export default function SignUpPage() {
    const BACKEND = "http://localhost:8000";
    const navigate = useNavigate();

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // ---- THEME ----
    useEffect(() => {
        document.body.classList.toggle("light-mode", theme === "light");
        document.body.classList.toggle("dark-mode", theme !== "light");
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    // ---- VALIDATION ----
    const validateEmail = (email) =>
        /^[a-zA-Z0-9._%+-]+@ssn\.edu\.in$/.test(email);

    const validatePassword = (password) =>
        /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

    const validateUsername = (username) =>
        /^[A-Za-z]+$/.test(username);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setErrorMsg("Use your SSN college email ( @ssn.edu.in )");
            return;
        }
        if (!validatePassword(password)) {
            setErrorMsg("Password must be 8+ chars, 1 uppercase & 1 number");
            return;
        }
        if (!validateUsername(username)) {
            setErrorMsg("Username must contain only letters.");
            return;
        }

        setErrorMsg("");

        try {
            const res = await fetch(`${BACKEND}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.detail || "Signup failed. Try again.");
                return;
            }

            alert("Signup successful!");
            navigate("/");
        } catch {
            setErrorMsg("Server error. Try again later.");
        }
    };

    const googleSignup = () => {
        window.location.href = `${BACKEND}/auth/google`;
    };

    return (
        <>
            <button
                className="theme-toggle"
                onClick={toggleTheme}
                title="Toggle theme"
            >
                {theme === "light" ? "☀️" : "🌙"}
            </button>

            <div className="page">
                <div className="hero">
                    <div className="hero-content">
                        <p className="eyebrow">Electric • Clean • Connected</p>
                        <h1>Powering Green Mobility</h1>
                        <p className="subtext">
                            Join our e-scooter network and help keep campuses moving with zero emissions and smarter energy use.
                        </p>
                        <div className="badges">
                            <span className="badge">Green energy</span>
                            <span className="badge">Smart charging</span>
                            <span className="badge">Shared rides</span>
                        </div>
                    </div>
                </div>

                <div className="form-wrap">
                    <div className="top-link">
                        Already have an account? <Link to="/">Sign in</Link>
                    </div>

                    <div className="card">
                        <button className="google-btn" onClick={googleSignup}>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                width="18"
                                alt="Google icon"
                            />
                            Sign up with Google
                        </button>

                        <div className="divider">or create your account</div>

                        <h2>Create your account</h2>

                        <form onSubmit={handleSignup}>
                            <div className="error">{errorMsg}</div>

                            <label>College Email</label>
                            <input
                                type="email"
                                value={email}
                                placeholder="sample@ssn.edu.in"
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label>Password</label>
                            <div className="password-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    placeholder="Samplepass1"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                            <p className="hint">At least 8 characters, include 1 uppercase and 1 number.</p>

                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                placeholder="Username"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <p className="hint">Letters only; no spaces or special characters.</p>

                            <button type="submit">Create account</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
