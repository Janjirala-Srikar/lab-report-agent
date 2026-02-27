"""
╔══════════════════════════════════════════════════╗
║   HEALTH TRENDS v2 — STREAMLIT DASHBOARD         ║
║   Clean, clinical, warm. Built for real humans.  ║
╚══════════════════════════════════════════════════╝

Run:
    pip install streamlit plotly pandas requests
    streamlit run health_trends_streamlit.py
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import requests
import math
import re

# ─────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────
st.set_page_config(
    page_title="Health Trends",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─────────────────────────────────────────────
# STYLES — warm clinical, editorial feel
# Palette: off-white canvas, deep teal accents,
# amber warnings, rose alerts
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;600&family=Geist:wght@300;400;500;600&display=swap');

:root {
    --bg:       #0f1117;
    --surface:  #181c27;
    --border:   #272d3d;
    --text:     #e8eaf0;
    --muted:    #6b7280;
    --teal:     #2dd4bf;
    --teal-lt:  #0d2d2a;
    --amber:    #fbbf24;
    --amber-lt: #2a1f0a;
    --rose:     #fb7185;
    --rose-lt:  #2a0d14;
    --green:    #4ade80;
    --green-lt: #0a2016;
}

html, body, [class*="css"] {
    font-family: 'Geist', sans-serif;
    background: var(--bg);
    color: var(--text);
}

.block-container {
    padding: 2.5rem 3rem 5rem;
    max-width: 1140px;
    margin: 0 auto;
}

/* ── Top nav bar ── */
.top-bar {
    display: flex; align-items: center;
    justify-content: space-between;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
}
.top-bar-logo {
    font-family: 'Instrument Serif', serif;
    font-size: 1.55rem; font-style: italic;
    color: var(--teal); letter-spacing: -.01em;
}
.top-bar-sub {
    font-size: .78rem; color: var(--muted);
    font-weight: 300; margin-top: .1rem;
}
.top-bar-right {
    font-family: 'Geist Mono', monospace;
    font-size: .72rem; color: var(--muted);
    text-align: right;
}

/* ── KPI strip ── */
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: .8rem;
    margin-bottom: 2rem;
}
.kpi-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.1rem 1.3rem;
    position: relative;
    overflow: hidden;
}
.kpi-box::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 12px 12px 0 0;
}
.kpi-box.teal::before  { background: var(--teal); }
.kpi-box.rose::before  { background: var(--rose); }
.kpi-box.green::before { background: var(--green); }
.kpi-box.amber::before { background: var(--amber); }
.kpi-num {
    font-family: 'Instrument Serif', serif;
    font-size: 2.4rem; line-height: 1;
    margin-bottom: .1rem;
}
.kpi-box.teal  .kpi-num  { color: var(--teal); }
.kpi-box.rose  .kpi-num  { color: var(--rose); }
.kpi-box.green .kpi-num  { color: var(--green); }
.kpi-box.amber .kpi-num  { color: var(--amber); }
.kpi-label {
    font-size: .72rem; font-weight: 500;
    text-transform: uppercase; letter-spacing: .1em;
    color: var(--muted);
}

/* ── Section heading ── */
.sec-head {
    font-family: 'Instrument Serif', serif;
    font-size: 1.2rem; font-style: italic;
    color: var(--text); margin: 0 0 .3rem;
}
.sec-sub { font-size: .78rem; color: var(--muted); margin-bottom: 1rem; font-weight: 300; }

/* ── Chart card ── */
.chart-card {
    background: var(--surface);
    border: none;
    border-radius: 14px;
    padding: 1.4rem 1.6rem 1rem;
    margin-bottom: 1.2rem;
}

/* ── Status badge ── */
.badge {
    display: inline-block;
    font-size: .68rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: .09em;
    padding: .15rem .6rem; border-radius: 100px;
}
.badge-high   { background: var(--rose-lt);  color: var(--rose); }
.badge-low    { background: var(--amber-lt); color: var(--amber); }
.badge-normal { background: var(--green-lt); color: var(--green); }

/* ── Biomarker row ── */
.bm-row {
    display: flex; align-items: center; gap: 1rem;
    padding: .9rem 1.1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: .5rem;
    transition: border-color .15s, box-shadow .15s;
}
.bm-row:hover {
    border-color: var(--teal);
    box-shadow: 0 2px 16px rgba(45,212,191,.08);
}
.bm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.bm-name { flex: 1; min-width: 0; }
.bm-name strong { font-size: .9rem; font-weight: 500; color: var(--text); display: block; }
.bm-name span   { font-size: .71rem; color: var(--muted); font-weight: 300; }
.bm-value {
    font-family: 'Geist Mono', monospace;
    font-size: .9rem; font-weight: 600;
    color: var(--text); flex-shrink: 0;
}
.bm-ref {
    font-family: 'Geist Mono', monospace;
    font-size: .72rem; color: var(--muted); flex-shrink: 0;
    text-align: right; min-width: 110px;
}
.bm-pct {
    font-family: 'Geist Mono', monospace;
    font-size: .82rem; font-weight: 600;
    min-width: 58px; text-align: right; flex-shrink: 0;
}

/* ── Range gauge — IMPROVED SCALING ── */
.gauge-track {
    width: 140px; height: 8px;
    background: var(--border); border-radius: 100px;
    position: relative; flex-shrink: 0;
    overflow: visible;
}
.gauge-fill {
    height: 100%; border-radius: 100px;
    position: absolute; top: 0; left: 0;
    transition: width .4s;
}
.gauge-pin {
    width: 3px; height: 16px;
    position: absolute; top: -4px;
    background: var(--text);
    border-radius: 1px;
    transform: translateX(-50%);
    box-shadow: 0 0 8px currentColor;
}

/* ── Streamlit native widget dark overrides ── */
.stSelectbox > div > div,
.stTextInput > div > div {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text) !important;
}
.stSelectbox [data-baseweb="select"] > div { background: var(--surface) !important; }
.stSelectbox svg { fill: var(--muted) !important; }
[data-baseweb="popover"] { background: #1e2433 !important; border-color: var(--border) !important; }
[data-baseweb="menu"] { background: #1e2433 !important; }
[data-baseweb="option"]:hover { background: #272d3d !important; }
.stToggle label { color: var(--muted) !important; }
/* scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 100px; }

.stTabs [data-baseweb="tab-list"] {
    gap: 0; background: transparent;
    border-bottom: 1px solid var(--border) !important;
    margin-bottom: 1rem;
}
.stTabs [data-baseweb="tab"] {
    font-size: .82rem; font-weight: 500;
    color: var(--muted);
    padding: .55rem 1.2rem;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    background: transparent !important;
}
.stTabs [aria-selected="true"] {
    color: var(--teal) !important;
    border-bottom: 2px solid var(--teal) !important;
}
button[data-baseweb="tab"]:hover { color: var(--teal) !important; }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("### ⚙️ Settings")
    token_input, api_url, show_debug = "", "http://localhost:5000/api/trends", False
    query_params = st.query_params
    if "token" in query_params:
        token_input = query_params.get("token", "")
    
    token_input = st.text_input("JWT Token", value=token_input, type="password", placeholder="eyJhbGciOiJIUzI1NiIs...")
    api_url     = st.text_input("API Endpoint", value=api_url)
    show_debug  = st.checkbox("Show raw response")
    c1, c2 = st.columns(2)
    with c1:
        if st.button("Fetch", use_container_width=True):
            st.cache_data.clear(); st.rerun()
    with c2:
        if st.button("Clear", use_container_width=True):
            st.cache_data.clear(); st.toast("Cleared!")

# ─────────────────────────────────────────────
# FETCH — zero st.* calls inside (cached function)
# ─────────────────────────────────────────────
@st.cache_data(ttl=60, show_spinner=False)
def fetch_trends(token, url):
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
        try:   payload = resp.json()
        except: payload = {}
        if resp.status_code in (401, 403): 
            return None, f"❌ {resp.status_code} Auth error — check your token.", payload
        if resp.status_code == 404:        
            return None, f"❌ 404 Not Found — check your API URL.", payload
        if resp.status_code >= 500:        
            return None, f"❌ Server Error {resp.status_code}.", payload
        resp.raise_for_status()
        if "message" in payload and "trends" not in payload:
            return [], payload["message"], payload
        trends = payload.get("trends", [])
        required = {"test_name", "previous_value", "current_value", "percent_change", "trend"}
        valid = [t for t in trends if required.issubset(t.keys())]
        return valid, f"⚠️ {len(trends)-len(valid)} records skipped." if len(valid) < len(trends) else None, payload
    except requests.exceptions.ConnectionError:
        return None, f"❌ Cannot connect to {url}", None
    except Exception as exc:
        return None, f"❌ {type(exc).__name__}: {exc}", None

def load_data():
    if not token_input.strip():
        st.info("Open the sidebar → enter your JWT token → Fetch.")
        st.stop()
    with st.spinner("Loading…"):
        trends, msg, raw = fetch_trends(token_input.strip(), api_url.strip())
    if show_debug and raw:
        with st.expander("Raw API response"): st.json(raw)
    if trends is None:   st.error(msg);   st.stop()
    if msg:              st.warning(msg)
    if not trends:       st.info("No trends yet — upload 2+ lab reports first."); st.stop()
    return trends

raw = load_data()

# ─────────────────────────────────────────────
# HELPERS — parse reference ranges
# ─────────────────────────────────────────────
def safe_float(v):
    try:
        f = float(v); return 0.0 if math.isnan(f) else f
    except: return 0.0

def parse_ref_range(ref_str):
    """Returns (low, high) floats or (None, None)."""
    if not ref_str: return None, None
    ref_str = str(ref_str)
    # Pattern: < N  or  > N
    m = re.match(r"^[<≤]\s*([\d.]+)", ref_str)
    if m: return 0.0, float(m.group(1))
    m = re.match(r"^[>≥]\s*([\d.]+)", ref_str)
    if m: return float(m.group(1)), None
    # Pattern: N – M  (dash, en-dash, hyphen)
    m = re.search(r"([\d.]+)\s*[–\-]\s*([\d.]+)", ref_str)
    if m: return float(m.group(1)), float(m.group(2))
    return None, None

def ref_status(value, low, high):
    if low is None and high is None: return "normal"
    if high is not None and value > high: return "high"
    if low  is not None and value < low:  return "low"
    return "normal"

def gauge_pct(value, low, high):
    """Map value to 0-100% position within [low, high]."""
    if low is None and high is None: return 50
    if low is None:  lo, hi = 0, high * 1.5
    elif high is None: lo, hi = low * 0.5, low * 2
    else: lo, hi = max(0, low * 0.5), high * 1.3
    if hi == lo: return 50
    return min(100, max(0, (value - lo) / (hi - lo) * 100))

STATUS_COLORS = {"high": "#fb7185", "low": "#fbbf24", "normal": "#4ade80"}
STATUS_BADGE  = {"high": "badge-high", "low": "badge-low", "normal": "badge-normal"}
STATUS_LABELS = {"high": "High", "low": "Low", "normal": "Normal"}

TREND_COL = {"Increased": "#fb7185", "Decreased": "#2dd4bf", "Stable": "#818cf8"}
TREND_ICO = {"Increased": "↑", "Decreased": "↓", "Stable": "→"}



# ─────────────────────────────────────────────
# ENRICH
# ─────────────────────────────────────────────
enriched = []
for t in raw:
    prev  = safe_float(t.get("previous_value", 0))
    curr  = safe_float(t.get("current_value",  0))
    pct   = safe_float(t.get("percent_change", 0))
    name  = t["test_name"]
    short = " ".join(name.split("(")[0].strip().split()[:5])
    ref   = t.get("reference_range", "")
    unit  = t.get("unit", "")
    low, high = parse_ref_range(ref)
    status = ref_status(curr, low, high)
    g_pct  = gauge_pct(curr, low, high)
    enriched.append({
        **t, "prev": prev, "curr": curr, "pct": pct,
        "short": short, "delta": curr - prev,
        "ref": ref, "unit": unit,
        "low": low, "high": high,
        "status": status, "gauge_pct": g_pct,
    })

df = pd.DataFrame(enriched)
if df.empty: st.error("No data."); st.stop()

summary = {k: int((df["trend"] == k).sum()) for k in ["Increased", "Decreased", "Stable"]}
abnormal = int((df["status"] != "normal").sum())

# ─────────────────────────────────────────────
# PLOTLY LAYOUT BASE
# ─────────────────────────────────────────────
BASE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Geist, sans-serif", color="#6b7280"),
    margin=dict(l=8, r=8, t=8, b=8),
)
GRID = dict(gridcolor="rgba(255,255,255,0.06)", zerolinecolor="rgba(255,255,255,0.1)")

# ─────────────────────────────────────────────
# TOP BAR
# ─────────────────────────────────────────────
st.markdown("""
<div class="top-bar">
  <div>
    <div class="top-bar-logo">Health Trends</div>
    <div class="top-bar-sub">Comparative lab analysis across reports</div>
  </div>
  <div class="top-bar-right">
    REPORT COMPARISON<br>
    PREVIOUS → CURRENT
  </div>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# KPI STRIP
# ─────────────────────────────────────────────
st.markdown(f"""
<div class="kpi-strip">
  <div class="kpi-box teal">
    <div class="kpi-num">{len(df)}</div>
    <div class="kpi-label">Biomarkers Tracked</div>
  </div>
  <div class="kpi-box rose">
    <div class="kpi-num">{summary['Increased']}</div>
    <div class="kpi-label">↑ Increased</div>
  </div>
  <div class="kpi-box green">
    <div class="kpi-num">{summary['Decreased']}</div>
    <div class="kpi-label">↓ Decreased</div>
  </div>
  <div class="kpi-box amber">
    <div class="kpi-num">{abnormal}</div>
    <div class="kpi-label">Outside Range</div>
  </div>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# TABS
# ─────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(["📊  Overview", "🎯  Range Status", "📋  All Biomarkers"])

# ══════════════════════════════════════════════
# TAB 1 — OVERVIEW
# ══════════════════════════════════════════════
with tab1:
    c1, c2 = st.columns([3, 2])

    # ── % Change waterfall bar chart ──
    with c1:
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="sec-head">% Change from Previous Test</div>', unsafe_allow_html=True)
        st.markdown('<div class="sec-sub">Each bar = (current − previous) ÷ previous × 100</div>', unsafe_allow_html=True)

        ds = df.sort_values("pct")
        colors = [TREND_COL[t] for t in ds["trend"]]
        text_labels = [f"{p:+.1f}%" for p in ds["pct"]]

        fig_pct = go.Figure(go.Bar(
            x=ds["pct"], y=ds["short"],
            orientation="h",
            marker_color=colors, marker_line_width=0,
            text=text_labels, textposition="outside",
            textfont=dict(family="Geist Mono", size=10, color="#9ca3af"),
            hovertemplate="<b>%{customdata}</b><br>%{x:+.1f}%<extra></extra>",
            customdata=ds["test_name"],
            width=0.6,
        ))
        fig_pct.add_vline(x=0, line_color="rgba(255,255,255,0.15)", line_width=1.2)
        fig_pct.update_layout(
            **BASE,
            height=max(280, len(df) * 38),
            showlegend=False,
            xaxis=dict(ticksuffix="%", tickfont_size=10, **GRID, zeroline=False),
            yaxis=dict(tickfont_size=11, linecolor="rgba(0,0,0,0)"),
            bargap=0.3,
        )
        st.plotly_chart(fig_pct, use_container_width=True, config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    # ── Donut + top movers ──
    with c2:
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="sec-head">Trend Breakdown</div>', unsafe_allow_html=True)
        st.markdown('<div class="sec-sub">Direction of change</div>', unsafe_allow_html=True)

        labels_d = [k for k, v in summary.items() if v > 0]
        vals_d   = [summary[k] for k in labels_d]
        cols_d   = [TREND_COL[k] for k in labels_d]

        fig_donut = go.Figure(go.Pie(
            labels=labels_d, values=vals_d, hole=0.68,
            marker=dict(colors=cols_d, line=dict(color="#0f1117", width=4)),
            textfont=dict(family="Geist", size=11),
            hovertemplate="%{label}: %{value}<extra></extra>",
            sort=False,
        ))
        fig_donut.add_annotation(
            text=f"<b>{len(df)}</b>", x=0.5, y=0.52,
            font=dict(size=28, family="Instrument Serif", color="#e8eaf0"),
            showarrow=False,
        )
        fig_donut.add_annotation(
            text="tests", x=0.5, y=0.35,
            font=dict(size=12, family="Geist", color="#6b7280"),
            showarrow=False,
        )
        fig_donut.update_layout(
            **BASE, height=220,
            showlegend=True,
            legend=dict(orientation="h", y=-0.05, x=0.5, xanchor="center",
                        font=dict(size=11), bgcolor="rgba(0,0,0,0)"),
        )
        st.plotly_chart(fig_donut, use_container_width=True, config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

        # Top movers card
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="sec-head">Biggest Movers</div>', unsafe_allow_html=True)
        st.markdown('<div class="sec-sub">By absolute % change</div>', unsafe_allow_html=True)

        top5 = df.reindex(df["pct"].abs().nlargest(5).index)
        for _, r in top5.iterrows():
            c = TREND_COL[r["trend"]]
            ico = TREND_ICO[r["trend"]]
            pct_str = f"{ico} {abs(r['pct']):.1f}%"
            st.markdown(f"""
            <div style="display:flex;justify-content:space-between;
                        align-items:center;padding:.55rem 0;
                        border-bottom:1px solid var(--border)">
              <span style="font-size:.85rem;font-weight:500;color:var(--text)">{r['short']}</span>
              <span style="font-family:'Geist Mono',monospace;font-size:.82rem;
                           font-weight:600;color:{c}">{pct_str}</span>
            </div>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # ── Bullet chart: prev vs current with ref range ──
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="sec-head">Previous vs Current — with Reference Bands</div>', unsafe_allow_html=True)
    st.markdown('<div class="sec-sub">Grey band = normal reference range · Dot = current value · Bar = previous value</div>', unsafe_allow_html=True)

    has_ref = df[df["low"].notna() | df["high"].notna()]
    if has_ref.empty:
        st.markdown("<p style='color:var(--muted);font-size:.85rem'>No reference ranges available in this data.</p>", unsafe_allow_html=True)
    else:
        fig_bullet = go.Figure()
        names = has_ref["short"].tolist()
        for i, (_, row) in enumerate(has_ref.iterrows()):
            low_v  = row["low"]  if row["low"]  is not None else 0
            high_v = row["high"] if row["high"] is not None else row["curr"] * 1.5
            axis_max = max(row["prev"], row["curr"], high_v) * 1.2

            # Ref band
            fig_bullet.add_shape(type="rect",
                x0=low_v, x1=high_v, y0=i - 0.38, y1=i + 0.38,
                fillcolor="rgba(45,212,191,0.10)", line_width=0,
            )
            # Previous bar
            fig_bullet.add_shape(type="rect",
                x0=0, x1=row["prev"], y0=i - 0.22, y1=i + 0.22,
                fillcolor="rgba(148,163,184,0.18)", line_width=0,
            )
            # Current marker
            dot_color = STATUS_COLORS[row["status"]]
            fig_bullet.add_shape(type="line",
                x0=row["curr"], x1=row["curr"], y0=i - 0.38, y1=i + 0.38,
                line=dict(color=dot_color, width=3),
            )
            fig_bullet.add_trace(go.Scatter(
                x=[row["curr"]], y=[i],
                mode="markers",
                marker=dict(color=dot_color, size=10, symbol="diamond"),
                name=row["short"],
                hovertemplate=f"<b>{row['test_name']}</b><br>Current: {row['curr']} {row['unit']}<br>Ref: {row['ref']}<extra></extra>",
                showlegend=False,
            ))

        fig_bullet.update_layout(
            **BASE,
            height=max(300, len(has_ref) * 52),
            showlegend=False,
            yaxis=dict(
                tickvals=list(range(len(names))),
                ticktext=names,
                tickfont_size=11,
                linecolor="rgba(0,0,0,0)",
            ),
            xaxis=dict(tickfont_size=10, **GRID, zeroline=False),
            shapes=fig_bullet.layout.shapes,
        )
        st.plotly_chart(fig_bullet, use_container_width=True, config={"displayModeBar": False})

    st.markdown('</div>', unsafe_allow_html=True)

# ══════════════════════════════════════════════
# TAB 2 — RANGE STATUS
# ══════════════════════════════════════════════
with tab2:
    # Add heading to Range Status tab
    st.markdown("""
    <div class="top-bar" style="margin-bottom: 2rem;">
      <div>
        <div class="top-bar-logo">Range Status</div>
        <div class="top-bar-sub">Current values aligned with reference ranges</div>
      </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('<div class="sec-head" style="margin-top:.5rem">Current Values vs Reference Ranges</div>', unsafe_allow_html=True)
    st.markdown('<div class="sec-sub">Based on reference_range from your lab database</div>', unsafe_allow_html=True)

    # Status summary
    s_high   = int((df["status"] == "high").sum())
    s_low    = int((df["status"] == "low").sum())
    s_normal = int((df["status"] == "normal").sum())

    sa, sb, sc = st.columns(3)
    for col, label, val, cls in [
        (sa, "Above Range", s_high,   "#fb7185"),
        (sb, "Below Range", s_low,    "#fbbf24"),
        (sc, "In Range",    s_normal, "#4ade80"),
    ]:
        with col:
            st.markdown(f"""
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
                        padding:.9rem 1.1rem;text-align:center;margin-bottom:1rem">
              <div style="font-family:'Instrument Serif',serif;font-size:2rem;color:{cls}">{val}</div>
              <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;
                          letter-spacing:.1em;font-weight:500">{label}</div>
            </div>""", unsafe_allow_html=True)

    # Show abnormal first, then normal
    df_sorted_status = pd.concat([
        df[df["status"] != "normal"],
        df[df["status"] == "normal"],
    ]).reset_index(drop=True)

    for _, row in df_sorted_status.iterrows():
        color  = STATUS_COLORS[row["status"]]
        badge  = STATUS_BADGE[row["status"]]
        label  = STATUS_LABELS[row["status"]]
        trend_c = TREND_COL[row["trend"]]
        trend_i = TREND_ICO[row["trend"]]
        gp      = row["gauge_pct"]
        pct_disp = f"{trend_i} {abs(row['pct']):.1f}%" if row['pct'] != 0 else "—"

        def fmt(v):
            return str(int(v)) if float(v) == int(float(v)) else f"{v:.2f}"

        st.markdown(f"""
        <div class="bm-row">
          <div class="bm-dot" style="background:{color}"></div>
          <div class="bm-name">
            <strong>{row['short']}</strong>
            <span>{row.get('test_name','')}</span>
          </div>
          <div class="gauge-track" title="Position in range">
            <div class="gauge-fill" style="width:{min(gp,100)}%;background:rgba(13,115,119,0.15)"></div>
            <div class="gauge-pin" style="left:{gp}%;background:{color}"></div>
          </div>
          <div class="bm-value">{fmt(row['curr'])} <span style="font-size:.72rem;color:var(--muted);font-weight:300">{row['unit']}</span></div>
          <div class="bm-ref">{row['ref']}</div>
          <div class="bm-pct" style="color:{trend_c}">{pct_disp}</div>
          <span class="badge {badge}">{label}</span>
        </div>
        """, unsafe_allow_html=True)

    # Lollipop chart — current value normalised within range
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    st.markdown('<div class="sec-head">Position Within Reference Range (%)</div>', unsafe_allow_html=True)
    st.markdown('<div class="sec-sub">0% = range low · 100% = range high · Outside = above/below range limit</div>', unsafe_allow_html=True)

    fig_lolly = go.Figure()
    df_ref = df.dropna(subset=["low"]).copy() if "low" in df.columns else df.copy()
    df_ref = df[df["low"].notna() | df["high"].notna()].copy()

    if not df_ref.empty:
        df_ref = df_ref.sort_values("gauge_pct")
        dot_cols = [STATUS_COLORS[s] for s in df_ref["status"]]

        for i, (_, row) in enumerate(df_ref.iterrows()):
            fig_lolly.add_shape(type="line",
                x0=50, x1=row["gauge_pct"], y0=i, y1=i,
                line=dict(color="rgba(255,255,255,0.1)", width=1.5),
            )
        # Normal range band
        fig_lolly.add_vrect(x0=0, x1=100,
            fillcolor="rgba(45,212,191,0.06)", line_width=0,
            annotation_text="Normal range", annotation_position="top left",
            annotation_font_size=10, annotation_font_color="#2dd4bf",
        )
        fig_lolly.add_vline(x=0,   line_color="rgba(45,212,191,0.3)", line_width=1, line_dash="dot")
        fig_lolly.add_vline(x=100, line_color="rgba(45,212,191,0.3)", line_width=1, line_dash="dot")
        fig_lolly.add_vline(x=50,  line_color="rgba(255,255,255,0.08)", line_width=1)

        fig_lolly.add_trace(go.Scatter(
            x=df_ref["gauge_pct"],
            y=list(range(len(df_ref))),
            mode="markers",
            marker=dict(color=dot_cols, size=11, line=dict(color="#0f1117", width=1.5)),
            hovertemplate="<b>%{customdata[0]}</b><br>Position: %{x:.0f}%<br>Value: %{customdata[1]}<extra></extra>",
            customdata=list(zip(df_ref["test_name"], df_ref["curr"])),
            showlegend=False,
        ))
        fig_lolly.update_layout(
            **BASE,
            height=max(240, len(df_ref) * 42),
            showlegend=False,
            xaxis=dict(ticksuffix="%", tickfont_size=10, range=[-30, 160], **GRID, zeroline=False),
            yaxis=dict(
                tickvals=list(range(len(df_ref))),
                ticktext=df_ref["short"].tolist(),
                tickfont_size=11,
                linecolor="rgba(0,0,0,0)",
            ),
        )
        st.plotly_chart(fig_lolly, use_container_width=True, config={"displayModeBar": False})
    else:
        st.markdown("<p style='color:var(--muted)'>Reference range data not available.</p>", unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

# ══════════════════════════════════════════════
# TAB 3 — ALL BIOMARKERS (full table)
# ══════════════════════════════════════════════
with tab3:
    # Filter
    fcol1, fcol2 = st.columns([2, 3])
    with fcol1:
        trend_filter = st.selectbox("Filter by trend", ["All", "Increased", "Decreased", "Stable"])
    with fcol2:
        status_filter = st.selectbox("Filter by range status", ["All", "Above Range", "In Range", "Below Range"])

    fdf = df.copy()
    if trend_filter != "All":
        fdf = fdf[fdf["trend"] == trend_filter]
    status_map_filter = {"Above Range": "high", "In Range": "normal", "Below Range": "low"}
    if status_filter != "All":
        fdf = fdf[fdf["status"] == status_map_filter[status_filter]]

    st.markdown(f"<p style='color:var(--muted);font-size:.8rem;margin:.5rem 0 1rem'>"
                f"Showing {len(fdf)} of {len(df)} biomarkers</p>", unsafe_allow_html=True)

    # Table header
    st.markdown("""
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.2fr 0.8fr 0.8fr;
                gap:.5rem;padding:.4rem .8rem;
                font-size:.7rem;font-weight:600;text-transform:uppercase;
                letter-spacing:.09em;color:var(--muted);
                border-bottom:1px solid var(--border);margin-bottom:.3rem">
      <div>Biomarker</div>
      <div style="text-align:right">Previous</div>
      <div style="text-align:right">Current</div>
      <div style="text-align:right">Change (Δ)</div>
      <div style="text-align:right">Reference</div>
      <div style="text-align:center">Trend</div>
      <div style="text-align:center">Status</div>
    </div>
    """, unsafe_allow_html=True)

    for _, r in fdf.iterrows():
        tc    = TREND_COL[r["trend"]]
        ti    = TREND_ICO[r["trend"]]
        sc_   = STATUS_COLORS[r["status"]]
        sb_   = STATUS_BADGE[r["status"]]
        sl_   = STATUS_LABELS[r["status"]]
        delta = r["curr"] - r["prev"]
        d_str = f"+{delta:.2f}" if delta > 0 else f"{delta:.2f}"

        def fmt(v):
            return str(int(v)) if float(v) == int(float(v)) else f"{v:.2f}"

        st.markdown(f"""
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.2fr 0.8fr 0.8fr;
                    gap:.5rem;align-items:center;padding:.65rem .8rem;
                    background:var(--surface);border:1px solid var(--border);
                    border-radius:8px;margin-bottom:.35rem;
                    font-size:.84rem;transition:border-color .15s">
          <div>
            <div style="font-weight:500;color:var(--text)">{r['short']}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:.1rem">{r['unit']}</div>
          </div>
          <div style="text-align:right;font-family:'Geist Mono',monospace;color:var(--muted)">{fmt(r['prev'])}</div>
          <div style="text-align:right;font-family:'Geist Mono',monospace;font-weight:600;color:var(--text)">{fmt(r['curr'])}</div>
          <div style="text-align:right;font-family:'Geist Mono',monospace;color:{tc};font-weight:600">{d_str}</div>
          <div style="text-align:right;font-family:'Geist Mono',monospace;font-size:.72rem;color:var(--muted)">{r['ref'] or '—'}</div>
          <div style="text-align:center">
            <span style="color:{tc};font-size:.8rem;font-weight:600">{ti} {r['trend']}</span>
          </div>
          <div style="text-align:center">
            <span class="badge {sb_}">{sl_}</span>
          </div>
        </div>
        """, unsafe_allow_html=True)

    if fdf.empty:
        st.markdown("<p style='text-align:center;color:var(--muted);padding:2rem'>No biomarkers match the selected filters.</p>", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# FOOTER
# ─────────────────────────────────────────────
st.markdown("""
<div style="text-align:center;margin-top:3rem;padding-top:1.5rem;
            border-top:1px solid var(--border)">
  <span style="font-family:'Instrument Serif',serif;font-style:italic;
               font-size:.9rem;color:#374151">
    Health Trends · Powered by your lab data
  </span>
</div>
""", unsafe_allow_html=True)