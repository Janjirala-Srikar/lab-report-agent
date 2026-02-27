import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "../styles/Trends.css";

const COLORS = {
  Increased: "#ef4444",
  Decreased: "#10b981",
  Stable: "#6b7280",
};

function Trends() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/trends",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


       console.log("Full API Response:", res);

    // 🔥 PRINT ONLY DATA
    console.log("Response Data:", res.data);

    // 🔥 PRINT ONLY TRENDS ARRAY
    console.log("Trends Array:", res.data.trends);
      setTrends(res.data.trends || []);
    } catch (err) {
      console.error("Failed to fetch trends", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="trends-loading">Loading Trends...</div>;
  }

  // Prepare chart data
  const barData = trends.map((item) => ({
    name: item.test_name,
    percent: parseFloat(item.percent_change),
    trend: item.trend,
  }));

  const summary = {
    total: trends.length,
    increased: trends.filter((t) => t.trend === "Increased").length,
    decreased: trends.filter((t) => t.trend === "Decreased").length,
    stable: trends.filter((t) => t.trend === "Stable").length,
  };

  const pieData = [
    { name: "Increased", value: summary.increased },
    { name: "Decreased", value: summary.decreased },
    { name: "Stable", value: summary.stable },
  ];

  return (
    <div className="trends-container">
      <h2 className="trends-title">Health Trends Dashboard</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Tests</h3>
          <p>{summary.total}</p>
        </div>
        <div className="card increased">
          <h3>Increased</h3>
          <p>{summary.increased}</p>
        </div>
        <div className="card decreased">
          <h3>Decreased</h3>
          <p>{summary.decreased}</p>
        </div>
        <div className="card stable">
          <h3>Stable</h3>
          <p>{summary.stable}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="chart-section">
        <h3>Percentage Change by Test</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="percent">
              {barData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[entry.trend]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="chart-section">
        <h3>Trend Distribution</h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[entry.name]}
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Trends;