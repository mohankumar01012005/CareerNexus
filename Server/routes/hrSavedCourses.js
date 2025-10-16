// routes/hrSavedCourses.js
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');

// Middleware to verify HR credentials using Basic Auth
const verifyHRForGet = async (req, res, next) => {
  try {
    // Check for Basic Auth header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        success: false,
        message: 'HR authentication required. Please provide Basic Auth credentials.'
      });
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [hrEmail, hrPassword] = credentials.split(':');

    console.log('Verifying HR via Basic Auth:', hrEmail);
    
    // Verify HR credentials from environment variables
    const expectedHREmail = process.env.HR_EMAIL || 'hr@skillcompass.com';
    const expectedHRPassword = process.env.HR_PASSWORD || 'hr123';
    
    if (hrEmail !== expectedHREmail || hrPassword !== expectedHRPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid HR credentials'
      });
    }
    
    next();
  } catch (error) {
    console.error('HR Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'HR authentication failed'
    });
  }
};

// Get saved courses for an employee (HR only) - Uses Basic Auth + employee email in body
router.post('/get-saved-courses', verifyHRForGet, async (req, res) => {
  try {
    const { employeeEmail } = req.body;

    if (!employeeEmail) {
      return res.status(400).json({
        success: false,
        message: 'employeeEmail is required in request body'
      });
    }

    console.log('HR fetching saved courses for:', employeeEmail);

    // Find user by email to get the employee profile
    const user = await User.findOne({ email: employeeEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const savedCourses = employee.savedCourses.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json({
      success: true,
      savedCourses: savedCourses.map(course => ({
        id: course._id.toString(),
        title: course.title,
        provider: course.provider,
        duration: course.duration,
        costType: course.costType,
        skillsCovered: course.skillsCovered,
        enrollLink: course.enrollLink,
        savedAt: course.savedAt.toISOString(),
        status: course.status,
        completionProof: course.completionProof,
        rating: course.rating,
        level: course.level,
        certificate: course.certificate,
        description: course.description
      })),
      count: savedCourses.length,
      employeeInfo: {
        fullName: employee.fullName,
        email: employeeEmail,
        department: employee.department,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Error fetching saved courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved courses'
    });
  }
});

// Get all pending course completions across all employees (HR only) - FIXED VERSION
router.get('/pending-course-completions', verifyHRForGet, async (req, res) => {
  try {
    console.log('HR fetching all pending course completions');

    // Find all employees with saved courses that have status 'pending_review'
    const employees = await Employee.find({
      'savedCourses.status': 'pending_review'
    }).populate('user', 'email');

    const pendingCompletions = [];

    // FIX: Properly iterate through all employees and their courses
    employees.forEach(employee => {
      employee.savedCourses.forEach(course => {
        if (course.status === 'pending_review') {
          pendingCompletions.push({
            id: course._id.toString(),
            title: course.title,
            provider: course.provider,
            duration: course.duration,
            costType: course.costType,
            skillsCovered: course.skillsCovered,
            enrollLink: course.enrollLink,
            savedAt: course.savedAt.toISOString(),
            status: course.status,
            completionProof: course.completionProof,
            rating: course.rating,
            level: course.level,
            certificate: course.certificate,
            description: course.description,
            employeeInfo: {
              fullName: employee.fullName,
              email: employee.user.email,
              department: employee.department,
              role: employee.role,
              employeeId: employee._id.toString()
            }
          });
        }
      });
    });

    // Sort by submission date (newest first)
    pendingCompletions.sort((a, b) => new Date(b.completionProof?.submittedAt || b.savedAt) - new Date(a.completionProof?.submittedAt || a.savedAt));

    res.json({
      success: true,
      pendingCompletions,
      count: pendingCompletions.length
    });
  } catch (error) {
    console.error('Error fetching pending course completions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending course completions'
    });
  }
});

// NEW: Get all saved courses across all employees regardless of status (HR only)
router.get('/all-saved-courses', verifyHRForGet, async (req, res) => {
  try {
    console.log('HR fetching all saved courses regardless of status');

    // Find all employees who have saved courses
    const employees = await Employee.find({
      'savedCourses.0': { $exists: true } // Employees with at least one saved course
    }).populate('user', 'email');

    const allCourses = [];

    // Iterate through all employees and their courses
    employees.forEach(employee => {
      employee.savedCourses.forEach(course => {
        allCourses.push({
          id: course._id.toString(),
          title: course.title,
          provider: course.provider,
          duration: course.duration,
          costType: course.costType,
          skillsCovered: course.skillsCovered,
          enrollLink: course.enrollLink,
          savedAt: course.savedAt.toISOString(),
          status: course.status,
          completionProof: course.completionProof,
          rating: course.rating,
          level: course.level,
          certificate: course.certificate,
          description: course.description,
          employeeInfo: {
            fullName: employee.fullName,
            email: employee.user.email,
            department: employee.department,
            role: employee.role,
            employeeId: employee._id.toString()
          }
        });
      });
    });

    // Sort by saved date (newest first)
    allCourses.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json({
      success: true,
      allCourses,
      count: allCourses.length,
      stats: {
        total: allCourses.length,
        pending: allCourses.filter(course => course.status === 'pending_review').length,
        active: allCourses.filter(course => course.status === 'active').length,
        completed: allCourses.filter(course => course.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching all saved courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all saved courses'
    });
  }
});

// Update course completion status (HR only)
router.put('/update-course-status', verifyHRForGet, async (req, res) => {
  try {
    const { courseId, employeeId, status, notes } = req.body;

    if (!courseId || !employeeId || !status) {
      return res.status(400).json({
        success: false,
        message: 'courseId, employeeId, and status are required'
      });
    }

    console.log('Updating course status:', { courseId, employeeId, status });

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const course = employee.savedCourses.id(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update course status
    course.status = status;
    
    // Add review notes if provided
    if (notes) {
      course.reviewNotes = notes;
      course.reviewedAt = new Date();
    }

    await employee.save();

    res.json({
      success: true,
      message: `Course status updated to ${status}`,
      course: {
        id: course._id.toString(),
        title: course.title,
        status: course.status,
        reviewNotes: course.reviewNotes,
        reviewedAt: course.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status'
    });
  }
});

module.exports = router;