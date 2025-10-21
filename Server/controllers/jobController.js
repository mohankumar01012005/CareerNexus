const Job = require("../models/Job");
const Employee = require("../models/Employee");

// Get all jobs with filtering and population
const getAllJobs = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    
    let filter = {};
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by department
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    // Search by title
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const jobs = await Job.find(filter)
      .populate('createdBy', 'fullName')
      .populate('applications.employee', 'fullName role department avatar skills experience')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs,
    });
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching jobs",
    });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('createdBy', 'fullName')
      .populate('applications.employee', 'fullName role department avatar skills experience');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      job: job,
    });
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job details",
    });
  }
};

// Create new job
const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      type,
      salary,
      description,
      requirements,
      requiredSkills,
      deadline
    } = req.body;

    // Validate required fields
    if (!title || !department || !location || !type || !salary || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const job = new Job({
      title,
      department,
      location,
      type,
      salary,
      description,
      requirements: requirements || [],
      requiredSkills: requiredSkills || [],
      deadline,
      createdBy: req.user._id, // HR user ID from auth middleware
      applications: []
    });

    await job.save();

    // Populate the created job
    await job.populate('createdBy', 'fullName');

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating job",
    });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'fullName')
      .populate('applications.employee', 'fullName role department avatar skills experience');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message: "Job updated successfully",
      job: job,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating job",
    });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting job",
    });
  }
};

// Update job status
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('createdBy', 'fullName')
      .populate('applications.employee', 'fullName role department avatar skills experience');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      job: job,
    });
  } catch (error) {
    console.error("Update job status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating job status",
    });
  }
};

// Apply for job
const applyForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, resumeType = 'current', updatedResume } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(app => 
      app.employee.toString() === employeeId
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "Already applied for this job",
      });
    }

    // Calculate match percentage
    const requiredSkills = job.requiredSkills || [];
    const employeeSkills = employee.skills || [];
    
    const matchingSkills = employeeSkills.filter(skill => 
      requiredSkills.includes(skill)
    );
    
    const matchPercentage = requiredSkills.length > 0 
      ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
      : 0;

    // Create application data
    const applicationData = {
      fullName: employee.fullName,
      role: employee.role,
      department: employee.department,
      avatar: employee.avatar,
      skills: employee.skills,
      experience: employee.experience
    };

    // Add application
    job.applications.push({
      employee: employeeId,
      resumeType,
      updatedResume: updatedResume || null,
      matchPercentage,
      skills: employeeSkills,
      experience: employee.experience || 'Not specified',
      applicationData
    });

    await job.save();

    // Populate the response
    await job.populate('applications.employee', 'fullName role department avatar skills experience');

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      job: job,
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while applying for job",
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicantId } = req.params;
    const { status } = req.body;

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const application = job.applications.id(applicantId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    await job.save();

    // Populate the response
    await job.populate('applications.employee', 'fullName role department avatar skills experience');

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      job: job,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating application status",
    });
  }
};

// Get job statistics
const getJobStats = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    
    // Get total applications across all jobs
    const jobsWithApplications = await Job.find().select('applications');
    const totalApplications = jobsWithApplications.reduce((total, job) => 
      total + (job.applications ? job.applications.length : 0), 0
    );
    
    // Get pending applications
    const pendingApplications = jobsWithApplications.reduce((total, job) => 
      total + (job.applications ? job.applications.filter(app => app.status === 'pending').length : 0), 0
    );

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
      }
    });
  } catch (error) {
    console.error("Get job stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job statistics",
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  applyForJob,
  updateApplicationStatus,
  getJobStats
};