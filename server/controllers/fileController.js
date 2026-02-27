const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const pdf = require("pdf-poppler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const reportModel = require("../models/reportModel");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.extractFileData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let results = [];

    for (const file of req.files) {
      const filePath = file.path;
      const mimeType = file.mimetype;
      let extractedText = "";

      // ===============================
      // IMAGE OCR
      // ===============================
      if (mimeType.startsWith("image/")) {
        const result = await Tesseract.recognize(filePath, "eng");
        extractedText = result.data.text;
      }

      // ===============================
      // PDF OCR
      // ===============================
      else if (mimeType === "application/pdf") {
        const outputDir = "./uploads";

        const opts = {
          format: "png",
          out_dir: outputDir,
          out_prefix: path.parse(file.originalname).name,
          page: null,
        };

        await pdf.convert(filePath, opts);

        const images = fs
          .readdirSync(outputDir)
          .filter(
            f =>
              f.startsWith(path.parse(file.originalname).name) &&
              f.endsWith(".png")
          );

        for (const img of images) {
          const imgPath = path.join(outputDir, img);
          const result = await Tesseract.recognize(imgPath, "eng");
          extractedText += result.data.text + "\n";
          fs.unlinkSync(imgPath);
        }
      }

      extractedText = extractedText
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // ===============================
      // GEMINI STRUCTURING
      // ===============================
      const prompt = `
You are a medical data extraction assistant.

Extract structured medical data and explanation in English, Telugu and Hindi.

Return STRICT JSON in this format:

{
  "structured_data": {
    "patient_name": "",
    "age": "",
    "gender": "",
    "tests": [
      {
        "test_name": "",
        "value": "",
        "unit": "",
        "reference_range": ""
      }
    ]
  },
  "explanation": {
    "english": "",
    "telugu": "",
    "hindi": ""
  }
}

Medical Report Text:
${extractedText}
`;

      const response = await model.generateContent(prompt);
      const aiText = response.response.text();

      const cleanedAIText = aiText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsedResult;

      try {
        parsedResult = JSON.parse(cleanedAIText);
      } catch (err) {
        parsedResult = {
          structured_data: null,
          explanation: {
            english: "AI parsing failed.",
            telugu: "AI విశ్లేషణలో లోపం.",
            hindi: "AI विश्लेषण विफल।"
          }
        };
      }

      // ===============================
      // SAVE MAIN REPORT
      // ===============================
      const dbResult = await reportModel.saveMedicalReport(
        userId,
        file.originalname,
        extractedText,
        parsedResult.structured_data,
        parsedResult.explanation
      );

      const reportId = dbResult.insertId;

      // ===============================
      // STEP 2: SAVE EACH TEST VALUE SEPARATELY
      // ===============================
      if (
        parsedResult.structured_data &&
        parsedResult.structured_data.tests
      ) {
        for (const test of parsedResult.structured_data.tests) {
          const numericValue = parseFloat(test.value);

          if (!isNaN(numericValue)) {
            await reportModel.saveMedicalTestValue(
              userId,
              reportId,
              test.test_name,
              numericValue,
              test.unit,
              test.reference_range
            );
          }
        }
      }

      results.push({
        id: reportId,
        fileName: file.originalname,
        structured_data: parsedResult.structured_data,
        explanation: parsedResult.explanation
      });
    }

    res.json({
      message: "Files processed successfully",
      data: results
    });

  } catch (error) {
    console.error("Processing Error:", error);
    res.status(500).json({ message: "Processing failed" });
  }
};