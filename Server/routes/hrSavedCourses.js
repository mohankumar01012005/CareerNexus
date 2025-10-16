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
    if (hrEmail !== process.env.HR_EMAIL || hrPassword !== process.env.HR_PASSWORD) {
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

module.exports = router;