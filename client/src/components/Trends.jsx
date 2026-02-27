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
  Cell,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
} from "recharts";
import "../styles/Trends.css";

const TREND_META = {
  Increased: { color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: "↑" },
  Decreased: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: "↓" },
  Stable:    { color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "⟶" },
};

/* ─── Tooltips ─── */
const GroupedTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="tt-box">
      <p className="tt-title">{d?.fullName}</p>
      {payload.map((p) => (
        <div key={p.name} className="tt-row">
          <span className="tt-lbl">{p.name}</span>
          <span className="tt-val" style={{ color: p.fill }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const DeltaTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tt-box">
      <p className="tt-title">{d.fullName}</p>
      <div className="tt-row"><span className="tt-lbl">Previous</span><span className="tt-val">{d.prev}</span></div>
      <div className="tt-row"><span className="tt-lbl">Current</span><span className="tt-val">{d.curr}</span></div>
      <div className="tt-row">
        <span className="tt-lbl">Δ Change</span>
        <span className="tt-val" style={{ color: d.delta > 0 ? "#f87171" : d.delta < 0 ? "#34d399" : "#818cf8" }}>
          {d.delta >= 0 ? "+" : ""}{d.delta}
        </span>
      </div>
    </div>
  );
};

const RadarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt-box">
      <p className="tt-title">{payload[0].payload.subject}</p>
      {payload.map((p) => (
        <div key={p.name} className="tt-row">
          <span className="tt-lbl">{p.name}</span>
          <span className="tt-val" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Spark track ─── */
const SparkBar = ({ value, max, color }) => (
  <div className="spark-track">
    <div className="spark-fill" style={{ width: `${max > 0 ? Math.max(3, (value / max) * 100) : 3}%`, background: color }} />
  </div>
);

export default function Trends() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrends(); }, []);

  const fetchTrends = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/trends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Full API Response:", res);
      console.log("Response Data:", res.data);
      console.log("Trends Array:", res.data.trends);
      setTrends(res.data.trends || []);
    } catch (err) {
      console.error("Failed to fetch trends", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tr-loading">
        <div className="tr-spinner" />
        <span>Analysing biomarkers…</span>
      </div>
    );
  }

  const safe = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  const enriched = trends.map((t) => ({
    ...t,
    fullName: t.test_name,
    shortName: t.test_name.split(/[,(]/)[0].trim().split(" ").slice(0, 3).join(" "),
    pct: safe(t.percent_change),
    delta: t.current_value - t.previous_value,
  }));

  const maxVal = Math.max(...enriched.map((t) => Math.max(t.previous_value, t.current_value)), 1);
  const hasPctVariance = enriched.some((t) => t.pct !== 0);

  const summary = {
    total:     trends.length,
    increased: trends.filter((t) => t.trend === "Increased").length,
    decreased: trends.filter((t) => t.trend === "Decreased").length,
    stable:    trends.filter((t) => t.trend === "Stable").length,
  };

  const groupedData = enriched.map((t) => ({
    name: t.shortName,
    fullName: t.fullName,
    Previous: t.previous_value,
    Current: t.current_value,
    trend: t.trend,
  }));

  const deltaData = enriched.map((t) => ({
    name: t.shortName,
    fullName: t.fullName,
    prev: t.previous_value,
    curr: t.current_value,
    delta: t.delta,
    trend: t.trend,
  }));

  const radarData = enriched.map((t) => ({
    subject: t.shortName,
    Current:  maxVal ? Math.round((t.current_value / maxVal) * 100) : 0,
    Previous: maxVal ? Math.round((t.previous_value / maxVal) * 100) : 0,
  }));

  const kpis = [
    { label: "Biomarkers", value: summary.total,     color: "#c4b5fd", icon: "◈" },
    { label: "Increased",  value: summary.increased, color: "#f87171", icon: "↑" },
    { label: "Decreased",  value: summary.decreased, color: "#34d399", icon: "↓" },
    { label: "Stable",     value: summary.stable,    color: "#818cf8", icon: "⟶" },
  ];

  return (
    <div className="tr-wrap">

      {/* Header */}
      <header className="tr-header">
        <div>
          <h1 className="tr-title">Health Trends</h1>
          <p className="tr-sub">Comparing most recent lab results across {summary.total} biomarker{summary.total !== 1 ? "s" : ""}</p>
        </div>
        <div className="tr-pill">{new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-row">
        {kpis.map(({ label, value, color, icon }) => (
          <div className="kpi-card" key={label}>
            <div className="kpi-left">
              <span className="kpi-icon" style={{ color }}>{icon}</span>
              <span className="kpi-num">{value}</span>
            </div>
            <span className="kpi-label">{label}</span>
            <div className="kpi-accent" style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Row 1 — grouped bar + horizontal delta */}
      <div className="chart-row two-col">

        <div className="chart-card">
          <div className="ch-head">
            <h3>Previous vs Current Values</h3>
            <div className="ch-legend">
              <span><i style={{ background: "#818cf8" }} />Previous</span>
              <span><i style={{ background: "#c4b5fd" }} />Current</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={groupedData} barCategoryGap="30%" barGap={4}
              margin={{ left: -5, right: 10, top: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(92,84,112,0.22)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9b96b0", fontSize: 11 }} axisLine={false} tickLine={false}
                interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#5C5470", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GroupedTooltip />} cursor={{ fill: "rgba(92,84,112,0.08)" }} />
              <Bar dataKey="Previous" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Current"  fill="#c4b5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="ch-head">
            <h3>Absolute Change (Δ)</h3>
            <span className="ch-caption">current − previous per biomarker</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deltaData} layout="vertical"
              margin={{ left: 8, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(92,84,112,0.22)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#5C5470", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130}
                tick={{ fill: "#9b96b0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <ReferenceLine x={0} stroke="rgba(129,140,248,0.5)" strokeWidth={1.5} />
              <Tooltip content={<DeltaTooltip />} cursor={{ fill: "rgba(92,84,112,0.08)" }} />
              <Bar dataKey="delta" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {deltaData.map((e, i) => (
                  <Cell key={i}
                    fill={e.delta > 0 ? "#f87171" : e.delta < 0 ? "#34d399" : "#818cf8"}
                    fillOpacity={0.82} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — radar + breakdown cards */}
      <div className="chart-row two-col">

        <div className="chart-card">
          <div className="ch-head">
            <h3>Biomarker Profile (Normalised 0–100)</h3>
            <div className="ch-legend">
              <span><i style={{ background: "#c4b5fd" }} />Current</span>
              <span><i style={{ background: "#5C5470", opacity: 0.9 }} />Previous</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <PolarGrid stroke="rgba(92,84,112,0.3)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#a9a4b8", fontSize: 11 }} />
              <Radar name="Current"  dataKey="Current"
                stroke="#c4b5fd" fill="#c4b5fd" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Previous" dataKey="Previous"
                stroke="#5C5470" fill="#5C5470" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" />
              <Tooltip content={<RadarTip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="ch-head"><h3>Biomarker Breakdown</h3></div>
          <div className="bk-list">
            {enriched.map((t, i) => {
              const meta = TREND_META[t.trend];
              return (
                <div className="bk-item" key={i}>
                  <div className="bk-top">
                    <span className="bk-name">{t.shortName}</span>
                    <span className="bk-pill" style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}30` }}>
                      {meta.icon} {t.trend}
                    </span>
                  </div>
                  <p className="bk-full">{t.fullName}</p>
                  <div className="bk-bars">
                    <div className="bk-bar-row">
                      <span className="bk-bar-lbl">Prev <b>{t.previous_value}</b></span>
                      <SparkBar value={t.previous_value} max={maxVal} color="#5C5470" />
                    </div>
                    <div className="bk-bar-row">
                      <span className="bk-bar-lbl">Curr <b style={{ color: meta.color }}>{t.current_value}</b></span>
                      <SparkBar value={t.current_value} max={maxVal} color={meta.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3 — % change line (only if there's variance) */}
      {hasPctVariance && (
        <div className="chart-card">
          <div className="ch-head">
            <h3>% Change Across Biomarkers</h3>
            <span className="ch-caption">positive = risen · negative = dropped</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={enriched.map((t) => ({ name: t.shortName, fullName: t.fullName, pct: t.pct, trend: t.trend }))}
              margin={{ left: 0, right: 20, top: 10, bottom: 45 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(92,84,112,0.22)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9b96b0", fontSize: 11 }} axisLine={false} tickLine={false}
                interval={0} angle={-30} textAnchor="end" height={55} />
              <YAxis tick={{ fill: "#5C5470", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="rgba(129,140,248,0.45)" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const meta = TREND_META[d.trend];
                  return (
                    <div className="tt-box">
                      <p className="tt-title">{d.fullName}</p>
                      <p className="tt-val" style={{ color: meta.color }}>
                        {meta.icon} {isNaN(d.pct) ? "No data" : `${d.pct > 0 ? "+" : ""}${d.pct.toFixed(2)}%`}
                      </p>
                    </div>
                  );
                }}
                cursor={{ stroke: "rgba(92,84,112,0.3)", strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="pct" stroke="#c4b5fd" strokeWidth={2.5}
                dot={({ cx, cy, payload }) => (
                  <circle key={payload.name} cx={cx} cy={cy} r={5}
                    fill={TREND_META[payload.trend].color} stroke="#1e1a28" strokeWidth={2} />
                )}
                activeDot={{ r: 7, fill: "#c4b5fd" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}