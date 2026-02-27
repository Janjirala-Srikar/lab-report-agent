# Health Trends Setup Guide

## 🔄 Complete Data Flow

```
User uploads lab report
         ↓
Express Server (port 5000)
  ├─ POST /upload → Extracts test data → Stores in medical_test_values table
  └─ GET /api/trends (protected) → trendController.js → Calculates health trends
         ↓
Streamlit App (port 8501)
  ├─ Sidebarcredentials (JWT token)
  └─ Fetches from /api/trends → Displays visualizations
```

## ✅ Prerequisites

1. **Express Backend Running**
   ```bash
   cd c:\Users\shaik\KL_Hackathon\server
   node server.js
   ```
   Should show: `Listening on port 5000`

2. **Streamlit Running**
   ```bash
   cd c:\Users\shaik\KL_Hackathon\streamlit
   streamlit run health_trends_streamlit.py
   ```
   Should open on `http://localhost:8501`

## 🔐 How to Get Your JWT Token

1. Open React app: `http://localhost:5173` (or your client URL)
2. **Register** a new account or **login**
3. After successful login, open **Browser DevTools** (F12)
4. Go to **Application → Local Storage → look for `token` key**
5. Copy the entire JWT string (starts with `eyJ...`)

## 📊 Setting Up Real Data Feed

### In Streamlit:

1. **In the sidebar** (← top-left arrow), toggle **OFF** "🧪 Use demo data"
2. **Paste your JWT token** in the "JWT Token" field
3. Verify the API URL is: `http://localhost:5000/api/trends`
4. Click **"🔄 Fetch"** or refresh the page

### Expected Response:

Your Express backend will return:
```json
{
  "user_id": "12345",
  "trends": [
    {
      "test_name": "HbA1c (Glycated Haemoglobin)",
      "previous_value": 5.4,
      "current_value": 6.1,
      "percent_change": "12.96",
      "trend": "Increased"
    },
    {
      "test_name": "LDL Cholesterol (Direct)",
      "previous_value": 130,
      "current_value": 112,
      "percent_change": "-13.85",
      "trend": "Decreased"
    }
    ...
  ]
}
```

## ⚠️ Common Issues & Fixes

### Error: "Cannot connect to backend"
- ✅ Make sure Express server is running
- ✅ Check that port 5000 is free
- ✅ Look for errors in Node.js terminal

### Error: "401 Unauthorised"
- ✅ Your JWT token is wrong or expired
- ✅ Get a fresh token by logging in again
- ✅ Copy from DevTools → Application → Local Storage

### Error: "No historical data available"
- ✅ You need **at least 2 lab reports per test** for trends to show
- ✅ Upload multiple reports to generate trends
- ✅ The backend filters out single-record tests automatically

## 📁 Files Created

| File | Purpose |
|------|---------|
| `trend_calculator.py` | Python version of trend calculation (mirrors backend) |
| `backend_integration.py` | Client class for fetching trends from Express |
| `health_trends_streamlit.py` | Main Streamlit app with visualizations |

## 🚀 Testing the Backend Route Directly

```bash
# Terminal: Get your JWT token first, then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/trends
```

You should get a JSON response with your trends.

## 📊 What Each Visualization Shows

1. **KPI Cards** - Count of total biomarkers, increased, decreased, stable
2. **Previous vs Current Values** - Side-by-side bar comparison
3. **Absolute Change (Δ)** - Positive/negative change per test
4. **Biomarker Profile** - Radar chart of normalized values
5. **Biomarker Breakdown** - Individual progress bars
6. **% Change Line Chart** - Percentage changes across all tests
7. **Trend Distribution** - Donut chart of trend directions
8. **Full Data Table** - Complete data with all metrics
