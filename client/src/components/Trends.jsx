import React, { useEffect, useState } from "react";
import "../styles/Trends.css";

export default function Trends() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get JWT token from localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      // Redirect to Streamlit with token as URL parameter
      window.location.href = `http://localhost:8501?token=${encodeURIComponent(token)}`;
    } else {
      // If no token, still open Streamlit (user will be prompted to paste token)
      window.location.href = "http://localhost:8501";
    }
  }, []);

  if (loading) {
    return (
      <div className="tr-loading">
        <div className="tr-spinner" />
        <span>Redirecting to Health Trends Dashboard…</span>
      </div>
    );
  }

  return (
    <div className="tr-loading">
      <div className="tr-spinner" />
      <span>Opening Streamlit dashboard…</span>
    </div>
  );
}