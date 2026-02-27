const pool = require("../config/database");

// ==========================================
// SAVE MAIN MEDICAL REPORT
// ==========================================
const saveMedicalReport = async (
  userId,
  fileName,
  extractedText,
  structuredData,
  explanation
) => {
  const [result] = await pool.execute(
    `INSERT INTO medical_reports 
    (user_id, file_name, extracted_text, structured_data, explanation, created_at) 
    VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      fileName,
      extractedText,
      JSON.stringify(structuredData),
      JSON.stringify(explanation),
    ]
  );

  return result;
};

// ==========================================
// SAVE EACH INDIVIDUAL TEST VALUE (Step 2)
// ==========================================
const saveMedicalTestValue = async (
  userId,
  reportId,
  testName,
  value,
  unit,
  referenceRange
) => {
  const [result] = await pool.execute(
    `INSERT INTO medical_test_values
    (user_id, report_id, test_name, value, unit, reference_range, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [userId, reportId, testName, value, unit, referenceRange]
  );

  return result;
};

// ==========================================
// GET ALL REPORTS FOR USER
// ==========================================
const getMedicalReportsByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM medical_reports 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
};

// ==========================================
// GET SINGLE REPORT
// ==========================================
const getMedicalReportById = async (reportId, userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM medical_reports 
     WHERE id = ? AND user_id = ?`,
    [reportId, userId]
  );

  return rows[0];
};

// ==========================================
// GET HISTORY OF SPECIFIC TEST (TREND ENGINE)
// ==========================================
const getTestHistoryByName = async (userId, testName) => {
  const [rows] = await pool.execute(
    `SELECT value, unit, created_at
     FROM medical_test_values
     WHERE user_id = ?
     AND test_name = ?
     ORDER BY created_at ASC`,
    [userId, testName]
  );

  return rows;
};

// ==========================================
// GET ALL TEST HISTORY FOR USER
// ==========================================
const getAllTestHistory = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT test_name, value, unit, created_at
     FROM medical_test_values
     WHERE user_id = ?
     ORDER BY test_name, created_at ASC`,
    [userId]
  );

  return rows;
};

module.exports = {
  saveMedicalReport,
  saveMedicalTestValue,
  getMedicalReportsByUserId,
  getMedicalReportById,
  getTestHistoryByName,
  getAllTestHistory,
};