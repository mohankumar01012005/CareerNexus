const express = require("express");
const { requireHR } = require("../middleware/auth");
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  applyForJob,
  updateApplicationStatus,
  getJobStats
} = require("../controllers/jobController");

const router = express.Router();

// All routes require HR authentication except applying for jobs
router.get("/", requireHR, getAllJobs);
router.get("/stats", requireHR, getJobStats);
router.get("/:id", requireHR, getJobById);
router.post("/", requireHR, createJob);
router.put("/:id", requireHR, updateJob);
router.delete("/:id", requireHR, deleteJob);
router.patch("/:id/status", requireHR, updateJobStatus);
router.patch("/:jobId/applications/:applicantId/status", requireHR, updateApplicationStatus);

// Employee application route (no HR auth required)
router.post("/:id/apply", applyForJob);

module.exports = router;