const express = require("express");
const {
  getActiveJobsForEmployee,
  submitJobSwitchRequest,
  applyForJob,
  referCandidate,
  getJobSwitchRequestStatus
} = require("../controllers/employeeJobController");

const router = express.Router();

// Employee job routes (credential-based authentication)
router.post("/active-jobs", getActiveJobsForEmployee);
router.post("/job-switch-request", submitJobSwitchRequest);
router.post("/job-switch-request/status", getJobSwitchRequestStatus);
router.post("/:jobId/apply", applyForJob);
router.post("/:jobId/refer", referCandidate);

module.exports = router;