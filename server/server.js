require("dotenv").config();
const express = require("express");
const cors = require("cors");


const userController = require("./controllers/userController");
const emailController = require("./controllers/emailController");
const verifyToken = require("./middlewares/authMiddleware");
const upload = require("./middlewares/uploadMiddleware");
const fileController = require("./controllers/fileController");
const trendController = require("./controllers/trendController");
const agentController = require("./controllers/agentController");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", require("express").static("uploads"));

// Health Route
app.get("/", (req, res) => {
  res.json({ message: "Server Running" });
});

// Auth Routes
app.post("/api/register", userController.register);
app.post("/api/login", userController.login);
app.post("/api/send-mail", emailController.sendMailHandler);
app.post("/api/upload", verifyToken, upload.array("file", 10), fileController.extractFileData);
app.post("/api/ask", verifyToken, agentController.askAgent);
app.get("/api/trends", verifyToken, trendController.getUserTrends);


// Protected Route Example
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});