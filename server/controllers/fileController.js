const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const pdf = require("pdf-poppler");

exports.extractFileData = async (req, res) => {
  try {
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
        console.log("Processing image:", file.originalname);

        const result = await Tesseract.recognize(filePath, "eng");
        extractedText = result.data.text;
      }

      // ===============================
      // PDF OCR (Using Poppler)
      // ===============================
      else if (mimeType === "application/pdf") {
        console.log("Processing PDF with Poppler OCR:", file.originalname);

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
          .filter(f => f.startsWith(path.parse(file.originalname).name) && f.endsWith(".png"));

        for (const img of images) {
          const imgPath = path.join(outputDir, img);

          const result = await Tesseract.recognize(imgPath, "eng");
          extractedText += result.data.text + "\n";

          fs.unlinkSync(imgPath); // delete temp image
        }
      }

      else {
        extractedText = "Unsupported file format";
      }

      console.log("===== Extracted from:", file.originalname, "=====");
      console.log(extractedText);

      results.push({
        fileName: file.originalname,
        text: extractedText,
      });
    }

    res.json({
      message: "Files processed successfully",
      data: results,
    });

  } catch (error) {
    console.error("Extraction Error:", error);
    res.status(500).json({ message: "Text extraction failed" });
  }
};