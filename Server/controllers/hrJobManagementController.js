const JobSwitchRequest = require("../models/JobSwitchRequest");
const Job = require("../models/Job");
const Employee = require("../models/Employee");
const JobReferral = require("../models/JobReferral");
const User = require("../models/User");

// Get all pending job switch requests
const getPendingJobSwitchRequests = async (req, res) => {
  try {
    const pendingRequests = await JobSwitchRequest.find({ status: 'pending' })
      .populate('employee', 'fullName department role email phoneNumber skills careerGoals resume_link')
      .populate('reviewedBy', 'fullName')
      .sort({ requestDate: 1 });

    res.json({
      success: true,
      count: pendingRequests.length,
      pendingRequests: pendingRequests
    });
  } catch (error) {
    console.error("Get pending job switch requests error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending job switch requests",
    });
  }
};

// Update job switch request status - FIXED VERSION
const updateJobSwitchRequestStatus = async (req, res) => {
  try {
    const { requestId, status, rejectionReason } = req.body;

    console.log("Update job switch request:", { requestId, status, rejectionReason });

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: "Request ID and status are required",
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    const jobSwitchRequest = await JobSwitchRequest.findById(requestId)
      .populate('employee', 'fullName email');

    if (!jobSwitchRequest) {
      return res.status(404).json({
        success: false,
        message: "Job switch request not found",
      });
    }

    if (jobSwitchRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    // For HR basic auth, we don't have a user ID, so use a default or skip reviewedBy
    // Update request
    jobSwitchRequest.status = status;
    jobSwitchRequest.reviewedDate = new Date();

    if (status === 'rejected') {
      jobSwitchRequest.rejectionReason = rejectionReason || "Not provided";
      jobSwitchRequest.rejectionDate = new Date();
      
      // Set canApplyAfter date (1 month from now)
      const canApplyAfter = new Date();
      canApplyAfter.setMonth(canApplyAfter.getMonth() + 1);
      jobSwitchRequest.canApplyAfter = canApplyAfter;
    }

    await jobSwitchRequest.save();

    // Populate for response
    await jobSwitchRequest.populate('employee', 'fullName department role');

    res.json({
      success: true,
      message: `Job switch request ${status} successfully`,
      jobSwitchRequest: {
        _id: jobSwitchRequest._id,
        employee: jobSwitchRequest.employee,
        status: jobSwitchRequest.status,
        reviewedDate: jobSwitchRequest.reviewedDate,
        rejectionReason: jobSwitchRequest.rejectionReason
      }
    });
  } catch (error) {
    console.error("Update job switch request status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating job switch request status",
    });
  }
};

// Get all job applications for HR review
const getJobApplicationsForHR = async (req, res) => {
  try {
    const { jobId, status } = req.query;

    let filter = {};
    if (jobId) {
      filter._id = jobId;
    }

    const jobs = await Job.find(filter)
      .populate('applications.employee', 'fullName department role email phoneNumber')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    let allApplications = [];
    jobs.forEach(job => {
      job.applications.forEach(application => {
        if (!status || application.status === status) {
          allApplications.push({
            jobId: job._id,
            jobTitle: job.title,
            jobDepartment: job.department,
            applicationId: application._id,
            employee: application.employee,
            appliedDate: application.appliedDate,
            status: application.status,
            resumeType: application.resumeType,
            matchPercentage: application.matchPercentage,
            applicationData: application.applicationData
          });
        }
      });
    });

    // Sort by application date (newest first)
    allApplications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

    res.json({
      success: true,
      count: allApplications.length,
      applications: allApplications
    });
  } catch (error) {
    console.error("Get job applications for HR error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job applications",
    });
  }
};

// Get all job referrals for HR review
const getJobReferralsForHR = async (req, res) => {
  try {
    const referrals = await JobReferral.find()
      .populate('job', 'title department location')
      .populate('referredBy', 'fullName department role email')
      .sort({ referralDate: -1 });

    res.json({
      success: true,
      count: referrals.length,
      referrals: referrals
    });
  } catch (error) {
    console.error("Get job referrals for HR error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job referrals",
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId, status, notes } = req.body;

    if (!jobId || !applicationId || !status) {
      return res.status(400).json({
        success: false,
        message: "Job ID, Application ID, and status are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    if (notes) {
      application.notes = notes;
    }

    await job.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      application: {
        id: application._id,
        employee: application.employee,
        status: application.status,
        jobTitle: job.title
      }
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating application status",
    });
  }
};

// Update referral status
const updateReferralStatus = async (req, res) => {
  try {
    const { referralId, status, notes } = req.body;

    if (!referralId || !status) {
      return res.status(400).json({
        success: false,
        message: "Referral ID and status are required",
      });
    }

    const referral = await JobReferral.findById(referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    referral.status = status;
    if (notes) {
      referral.notes = notes;
    }

    await referral.save();

    res.json({
      success: true,
      message: `Referral status updated to ${status}`,
      referral: {
        id: referral._id,
        candidateName: referral.candidateName,
        status: referral.status,
        job: referral.job
      }
    });
  } catch (error) {
    console.error("Update referral status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating referral status",
    });
  }
};

module.exports = {
  getPendingJobSwitchRequests,
  updateJobSwitchRequestStatus,
  getJobApplicationsForHR,
  getJobReferralsForHR,
  updateApplicationStatus,
  updateReferralStatus
};