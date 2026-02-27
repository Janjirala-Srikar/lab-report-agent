import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Upload from "./Upload";
import Trends from "./Trends";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(
          "http://localhost:5000/api/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.leftSection}>
          <strong>
            Welcome {user?.username}
          </strong>
        </div>

        <div style={styles.centerSection}>
          <button
            style={styles.navBtn}
            onClick={() => setActiveTab("trends")}
          >
            Trends
          </button>
          <button
            style={styles.navBtn}
            onClick={() => setActiveTab("upload")}
          >
            Upload
          </button>
        </div>

        <div style={styles.rightSection}>
          <div
            style={styles.profileBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.username}
          </div>

          {dropdownOpen && (
            <div style={styles.dropdown}>
              <p><strong>{user?.username}</strong></p>
              <p>{user?.email}</p>
              <hr />
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        {activeTab === "upload" && <Upload />}
        {activeTab === "trends" && <Trends />}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f4f4f4",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#111",
    color: "#fff",
    position: "relative",
  },
  leftSection: {
    fontSize: "16px",
  },
  centerSection: {
    display: "flex",
    gap: "20px",
  },
  navBtn: {
    padding: "8px 18px",
    border: "none",
    backgroundColor: "#444",
    color: "white",
    cursor: "pointer",
    borderRadius: "5px",
  },
  rightSection: {
    position: "relative",
  },
  profileBtn: {
    cursor: "pointer",
    backgroundColor: "#444",
    padding: "8px 16px",
    borderRadius: "5px",
  },
  dropdown: {
    position: "absolute",
    top: "45px",
    right: 0,
    backgroundColor: "white",
    color: "black",
    padding: "15px",
    borderRadius: "8px",
    width: "220px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 100,
  },
  logoutBtn: {
    width: "100%",
    padding: "8px",
    marginTop: "10px",
    border: "none",
    backgroundColor: "#dc3545",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
  },
  mainContent: {
    padding: "40px",
  },
};

export default Dashboard;