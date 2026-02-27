
import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Form */}
      <div className="login-form-section">
        <div className="form-wrapper">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <button type="submit" className="submit-button">
              Sign In
            </button>
          </form>

          <div className="form-footer">
            <p className="signup-text">
              Don't have an account?{" "}
              <Link to="/register" className="signup-link">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="image-section">
        <img 
          src="https://i.postimg.cc/66z9jc3h/nurse-(1).png" 
          alt="Nurse Illustration" 
          className="nurse-image"
        />
      </div>
    </div>
  );
};

export default Login;