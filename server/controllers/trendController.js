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

      const first = records[0].value;
      const latest = records[records.length - 1].value;

      const percentChange = ((latest - first) / first) * 100;

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