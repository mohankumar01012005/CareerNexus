const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const { initializeHRAccount } = require("./controllers/authController");

// Load environment variables first
dotenv.config();

// Debug: Check if environment variables are loaded
console.log("Environment Variables Loaded:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("HR_EMAIL:", process.env.HR_EMAIL);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "*** Loaded Successfully ***" : "NOT FOUND");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Basic route to check server health
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillCompass API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize default HR account after DB connects
setTimeout(() => {
  initializeHRAccount();
}, 2000); // Wait 2 seconds to ensure DB is ready

// ✅ API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employee", require("./routes/employees"));
app.use("/api/employee", require("./routes/savedCourses")); // Employee saved courses routes
app.use("/api/hr", require("./routes/hr"));
app.use("/api/hr", require("./routes/hrSavedCourses")); // HR saved courses routes

// ✅ Default home route (use GET to avoid overriding APIs)
app.get("/", (req, res) => {
  res.send("Welcome to the Server! 🚀");
});

// ✅ 404 Not Found handler (keep after all routes)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});