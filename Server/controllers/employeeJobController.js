const Job = require("../models/Job");
const JobSwitchRequest = require("../models/JobSwitchRequest");
const JobReferral = require("../models/JobReferral");
const Employee = require("../models/Employee");
const User = require("../models/User");

// Get active jobs for employee with application status
const getActiveJobsForEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
      .populate('user', 'email');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Check job switch request status
    const jobSwitchRequest = await JobSwitchRequest.findOne({
      employee: employee._id
    }).sort({ createdAt: -1 });

    let canApply = false;
    let rejectionMessage = null;

    if (jobSwitchRequest) {
      if (jobSwitchRequest.status === 'rejected') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (jobSwitchRequest.rejectionDate > oneMonthAgo) {
          canApply = false;
          rejectionMessage = jobSwitchRequest.rejectionReason || 
            "Your job switch request was rejected. You cannot apply for new jobs for one month.";
        } else {
          // One month has passed, employee can submit new request
          canApply = false;
        }
      } else if (jobSwitchRequest.status === 'approved') {
        canApply = true;
      } else if (jobSwitchRequest.status === 'pending') {
        canApply = false;
        rejectionMessage = "Your job switch request is pending HR review.";
      }
    } else {
      // No job switch request submitted yet
      canApply = false;
      rejectionMessage = "You need to submit a job switch request before applying for internal positions.";
    }

    // Get active jobs with application status for this employee
    const activeJobs = await Job.find({ 
      status: 'active',
      deadline: { $gte: new Date() }
    })
    .populate('createdBy', 'fullName')
    .select('-applications') // Don't send other applicants' data
    .sort({ createdAt: -1 });

    // Get employee's applications and referrals to determine button states
    const employeeApplications = await Job.find({
      'applications.employee': employee._id
    }, { 'applications.$': 1, title: 1 });

    const employeeReferrals = await JobReferral.find({
      referredBy: employee._id
    }).populate('job', 'title');

    const jobsWithStatus = activeJobs.map(job => {
      const hasApplied = employeeApplications.some(appJob => 
        appJob._id.toString() === job._id.toString() && 
        appJob.applications.length > 0
      );
      
      const hasReferred = employeeReferrals.some(ref => 
        ref.job._id.toString() === job._id.toString()
      );

      // Disable apply if referred, disable refer if applied
      const canApplyForJob = canApply && !hasApplied && !hasReferred;
      const canReferForJob = !hasApplied && !hasReferred;

      return {
        ...job.toObject(),
        hasApplied,
        hasReferred,
        canApply: canApplyForJob,
        canRefer: canReferForJob
      };
    });

    res.json({
      success: true,
      jobs: jobsWithStatus,
      jobSwitchRequest: jobSwitchRequest ? {
        status: jobSwitchRequest.status,
        requestDate: jobSwitchRequest.requestDate,
        rejectionReason: jobSwitchRequest.rejectionReason,
        rejectionDate: jobSwitchRequest.rejectionDate,
        reviewedBy: jobSwitchRequest.reviewedBy
      } : null,
      canApply,
      rejectionMessage,
      employeeInfo: {
        fullName: employee.fullName,
        email: employee.user.email,
        department: employee.department,
        role: employee.role
      }
    });
  } catch (error) {
    console.error("Get active jobs for employee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching active jobs",
    });
  }
};

// Submit job switch request
const submitJobSwitchRequest = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Check if there's already a pending request
    const existingRequest = await JobSwitchRequest.findOne({
      employee: employee._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending job switch request",
      });
    }

    // Check if there's a recent rejection (within 1 month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentRejection = await JobSwitchRequest.findOne({
      employee: employee._id,
      status: 'rejected',
      rejectionDate: { $gte: oneMonthAgo }
    });

    if (recentRejection) {
      return res.status(400).json({
        success: false,
        message: "You cannot submit a new request until one month after rejection",
      });
    }

    // Create new job switch request
    const jobSwitchRequest = new JobSwitchRequest({
      employee: employee._id,
      status: 'pending',
      requestDate: new Date()
    });

    await jobSwitchRequest.save();

    // Populate for response
    await jobSwitchRequest.populate('employee', 'fullName department role');

    res.status(201).json({
      success: true,
      message: "Job switch request submitted successfully for HR review",
      jobSwitchRequest: {
        id: jobSwitchRequest._id,
        status: jobSwitchRequest.status,
        requestDate: jobSwitchRequest.requestDate,
        employee: jobSwitchRequest.employee
      }
    });
  } catch (error) {
    console.error("Submit job switch request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting job switch request",
    });
  }
};

// Apply for job with resume choice
const applyForJob = async (req, res) => {
  try {
    const { email, password, resumeType, updatedResume } = req.body;
    const { jobId } = req.params;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!resumeType || !['current', 'updated'].includes(resumeType)) {
      return res.status(400).json({
        success: false,
        message: "Valid resume type (current/updated) is required",
      });
    }

    if (resumeType === 'updated' && !updatedResume) {
      return res.status(400).json({
        success: false,
        message: "Updated resume file is required when resume type is 'updated'",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
      .populate('user', 'email');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Check job switch request status - STRICT CHECK
    const jobSwitchRequest = await JobSwitchRequest.findOne({
      employee: employee._id
    }).sort({ createdAt: -1 });

    if (!jobSwitchRequest || jobSwitchRequest.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: "You need an approved job switch request to apply for internal jobs",
      });
    }

    if (jobSwitchRequest.status === 'rejected') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (jobSwitchRequest.rejectionDate > oneMonthAgo) {
        return res.status(403).json({
          success: false,
          message: "Your job switch request was rejected. You cannot apply for new jobs for one month.",
          rejectionReason: jobSwitchRequest.rejectionReason
        });
      }
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Job not found or not active",
      });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(app => 
      app.employee.toString() === employee._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Check if already referred
    const existingReferral = await JobReferral.findOne({
      job: jobId,
      referredBy: employee._id
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: "You have already referred someone for this job",
      });
    }

    // Calculate match percentage
    const requiredSkills = job.requiredSkills || [];
    const employeeSkills = employee.skills.map(skill => skill.name);
    const matchingSkills = employeeSkills.filter(skill => 
      requiredSkills.includes(skill)
    );
    const matchPercentage = requiredSkills.length > 0 
      ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
      : 0;

    // Prepare application data
    const applicationData = {
      employee: employee._id,
      resumeType,
      updatedResume: resumeType === 'updated' ? updatedResume : undefined,
      matchPercentage,
      skills: employeeSkills,
      experience: employee.experience || 'Not specified',
      applicationData: {
        employeeInfo: {
          fullName: employee.fullName,
          email: employee.user.email,
          department: employee.department,
          role: employee.role,
          joiningDate: employee.joiningDate,
          tenure: employee.tenure
        },
        skills: employee.skills,
        careerGoals: employee.careerGoals,
        resumeData: employee.resume_data || [],
        resumeLink: employee.resume_link
      }
    };

    // Add application to job
    job.applications.push(applicationData);
    await job.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        jobTitle: job.title,
        resumeType,
        matchPercentage,
        appliedDate: new Date()
      }
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while applying for job",
    });
  }
};

// Refer candidate for job
const referCandidate = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      candidateName, 
      candidateEmail, 
      candidatePhone, 
      candidateResume, 
      candidateSkills, 
      candidateExperience 
    } = req.body;
    
    const { jobId } = req.params;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee email and password are required",
      });
    }

    if (!candidateName || !candidateEmail || !candidateResume) {
      return res.status(400).json({
        success: false,
        message: "Candidate name, email, and resume are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee user not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid employee password",
      });
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Job not found or not active",
      });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(app => 
      app.employee.toString() === employee._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Check if already referred
    const existingReferral = await JobReferral.findOne({
      job: jobId,
      referredBy: employee._id
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: "You have already referred someone for this job",
      });
    }

    // Create referral
    const referral = new JobReferral({
      job: jobId,
      referredBy: employee._id,
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateResume,
      candidateSkills: candidateSkills || [],
      candidateExperience: candidateExperience || 'Not specified',
      referralDate: new Date(),
      status: 'pending'
    });

    await referral.save();

    // Add referral to job
    job.referrals.push(referral._id);
    await job.save();

    // Populate for response
    await referral.populate('job', 'title department');

    res.status(201).json({
      success: true,
      message: "Candidate referred successfully",
      referral: {
        id: referral._id,
        candidateName: referral.candidateName,
        candidateEmail: referral.candidateEmail,
        jobTitle: referral.job.title,
        referralDate: referral.referralDate
      }
    });
  } catch (error) {
    console.error("Refer candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while referring candidate",
    });
  }
};

// Get job switch request status
const getJobSwitchRequestStatus = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    // Get latest job switch request
    const jobSwitchRequest = await JobSwitchRequest.findOne({
      employee: employee._id
    })
    .populate('reviewedBy', 'fullName')
    .sort({ createdAt: -1 });

    if (!jobSwitchRequest) {
      return res.json({
        success: true,
        hasRequest: false,
        message: "No job switch request found"
      });
    }

    const response = {
      success: true,
      hasRequest: true,
      status: jobSwitchRequest.status,
      requestDate: jobSwitchRequest.requestDate,
      reviewedBy: jobSwitchRequest.reviewedBy?.fullName,
      reviewedDate: jobSwitchRequest.reviewedDate
    };

    if (jobSwitchRequest.status === 'rejected') {
      response.rejectionReason = jobSwitchRequest.rejectionReason;
      response.rejectionDate = jobSwitchRequest.rejectionDate;
      
      // Check if still within restriction period
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      if (jobSwitchRequest.rejectionDate > oneMonthAgo) {
        response.canApply = false;
        response.restrictionMessage = "You cannot apply for jobs for one month after rejection";
      } else {
        response.canApply = false; // Still need to submit new request
        response.message = "Your rejection period has ended. You can submit a new job switch request.";
      }
    } else if (jobSwitchRequest.status === 'approved') {
      response.canApply = true;
    } else {
      response.canApply = false;
      response.message = "Your request is pending HR review";
    }

    res.json(response);
  } catch (error) {
    console.error("Get job switch request status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job switch request status",
    });
  }
};

module.exports = {
  getActiveJobsForEmployee,
  submitJobSwitchRequest,
  applyForJob,
  referCandidate,
  getJobSwitchRequestStatus
};