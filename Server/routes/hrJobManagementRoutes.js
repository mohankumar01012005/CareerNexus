const express = require("express");
const { requireHR } = require("../middleware/auth");
const {
  getPendingJobSwitchRequests,
  updateJobSwitchRequestStatus,
  getJobApplicationsForHR,
  getJobReferralsForHR,
  updateApplicationStatus,
  updateReferralStatus
} = require("../controllers/hrJobManagementController");

const router = express.Router();

// All routes require HR authentication
router.use(requireHR);

// Job switch request management
router.get("/job-switch-requests/pending", getPendingJobSwitchRequests);
router.put("/job-switch-requests/status", updateJobSwitchRequestStatus);

// Job applications management
router.get("/job-applications", getJobApplicationsForHR);
router.put("/job-applications/status", updateApplicationStatus);

// Job referrals management
router.get("/job-referrals", getJobReferralsForHR);
router.put("/job-referrals/status", updateReferralStatus);

module.exports = router;