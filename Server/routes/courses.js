
const express = require("express");
const {
  storeCourseRecommendations,
  getCourseRecommendations,
  getCourseRecommendationsByPriority,
  startCourse,
  submitCourseCompletion,
  getCourseProgressSummary
} = require("../controllers/courseController");

const router = express.Router();

// Store AI-generated course recommendations
router.post("/store-recommendations", storeCourseRecommendations);

// Get all course recommendations for employee
router.post("/get-recommendations", getCourseRecommendations);

// Get course recommendations by specific priority
router.post("/get-recommendations-by-priority", getCourseRecommendationsByPriority);

// Start a course (mark as in progress)
router.post("/start-course", startCourse);

// Submit course completion proof
router.post("/submit-completion", submitCourseCompletion);

// Get course progress summary
router.post("/progress-summary", getCourseProgressSummary);

module.exports = router;
