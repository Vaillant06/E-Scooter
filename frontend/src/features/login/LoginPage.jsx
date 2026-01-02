import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css"; 

export default function LoginPage() {
    const BACKEND = "https://e-scooter-33r2.onrender.com";
    const navigate = useNavigate();

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // ---- Theme ----
    useEffect(() => {
        document.body.classList.toggle("light-mode", theme === "light");
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("google") === "1") {
            const userId = params.get("userId");
            const username = params.get("username");
            const email = params.get("email");

            if (userId) {
                localStorage.setItem("userId", userId);
                localStorage.setItem("username", username);
                localStorage.setItem("email", email);
                localStorage.setItem("lastLogin", new Date().toLocaleString());
                navigate("/dashboard");
            }
        }
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    // ---- Form Logic ----
    const validateEmail = (email) =>
        /^[a-zA-Z0-9._%+-]+@ssn\.edu\.in$/.test(email);

    const validatePassword = (password) =>
        /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setErrorMsg("Use your SSN college email ( @ssn.edu.in )");
            return;
        }
        if (!validatePassword(password)) {
            setErrorMsg("Password must be 8+ chars, 1 uppercase & 1 number");
            return;
        }
        setErrorMsg("");

        try {
            const res = await fetch(`${BACKEND}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.detail || "Login failed. Try again.");
                return;
            }

            localStorage.setItem("userId", data.userId);
            localStorage.setItem("username", data.username);

            navigate("/dashboard"); 
        } catch {
            setErrorMsg("Server error. Try again later.");
        }
    };

    const googleLogin = () => {
        window.location.href = `${BACKEND}/auth/google`;
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <button
                className="theme-toggle"
                type="button"
                onClick={toggleTheme}
                title="Toggle theme"
            >
                {theme === "light" ? "☀️" : "🌙"}
            </button>

            <div className="card">
                <div className="card-title">
                    <span className="card-icon">🛴</span>
                    <h2>Sign in to E-Scooter</h2>
                </div>

                <form onSubmit={handleLogin}>
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

                    <button className="login-btn mt-3" type="submit">
                        Sign in
                    </button>
                </form>

                <button className="google-btn" onClick={googleLogin}>
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        width="18"
                        alt="Google icon"
                    />
                    Continue with Google
                </button>

                <div className="signup-link">
                    New to E-Scooter? <Link to="/signup">Create an account</Link>
                </div>
            </div>
        </div>
    );
}
