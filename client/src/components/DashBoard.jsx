import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Upload from "./Upload";
import Trends from "./Trends";
import "../Styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  const extractUsername = (email) => {
    if (!email) return "Guest";
    return email.split("@")[0];
  };

  const username = extractUsername(user?.email);

  return (
    <div className="dashboard">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar__brand">
          <span className="navbar__title">Welcome, <strong>{username}</strong></span>

        </div>

        <div className="navbar__tabs">
          <button
            className={`tab-btn ${activeTab === "upload" ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload
          </button>
          <button
            className={`tab-btn ${activeTab === "trends" ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab("trends")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Trends
          </button>
        </div>

        <div className="navbar__right" ref={dropdownRef}>
          <button
            className="profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <span className="profile-btn__avatar">{getInitials(user?.username)}</span>
            <span className="profile-btn__name">{user?.username}</span>
            <svg
              className={`profile-btn__chevron ${dropdownOpen ? "profile-btn__chevron--open" : ""}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown__header">
                <div className="dropdown__avatar">{getInitials(user?.username)}</div>
                <div className="dropdown__info">
                  <p className="dropdown__username">{user?.username}</p>
                  <p className="dropdown__email">{user?.email}</p>
                </div>
              </div>
              <div className="dropdown__divider" />
              <button className="dropdown__logout" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main">
        <div className="main__header">
          <div className="main__badge">
            {activeTab === "upload" ? "Upload Mode" : "Trends Mode"}
          </div>
        </div>

        <div className="main__content">
          {activeTab === "upload" && <Upload />}
          {activeTab === "trends" && <Trends />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;