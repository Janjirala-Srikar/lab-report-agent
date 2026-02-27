const reportModel = require("../models/reportModel");

exports.getUserTrends = async (req, res) => {
  try {
    const userId = req.user.id;

    const allTests = await reportModel.getAllTestHistory(userId);

    if (!allTests.length) {
      return res.json({ message: "No historical data available" });
    }

    const grouped = {};

    // Group by test_name
    for (const row of allTests) {
      if (!grouped[row.test_name]) {
        grouped[row.test_name] = [];
      }
      grouped[row.test_name].push(row);
    }

    const trends = [];

    for (const testName in grouped) {
      const records = grouped[testName];

      if (records.length < 2) continue;

      const first = parseFloat(records[0].value);
      const latest = parseFloat(records[records.length - 1].value);

      // Handle edge cases: zero or negative values
      let percentChange;
      if (first === 0) {
        percentChange = latest === 0 ? 0 : (latest > 0 ? 100 : -100);
      } else {
        percentChange = ((latest - first) / Math.abs(first)) * 100;
      }

      // Ensure it's a valid number
      percentChange = isNaN(percentChange) ? 0 : percentChange;

      // Get unit and reference_range from the first record
      const unit = records[0].unit || "";
      const reference_range = records[0].reference_range || "";

      trends.push({
        test_name: testName,
        previous_value: first,
        current_value: latest,
        percent_change: percentChange.toFixed(2),
        trend:
          percentChange > 0
            ? "Increased"
            : percentChange < 0
            ? "Decreased"
            : "Stable",
        unit,
        reference_range,
      });
    }

    res.json({
      user_id: userId,
      trends,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Trend calculation failed" });
  }
};