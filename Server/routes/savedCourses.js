// routes/savedCourses.js
const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');

// Middleware to verify employee credentials for saving courses
const verifyEmployeeForSave = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Verifying employee:', email);
    
    // Verify against user collection
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      userType: "employee",
      isActive: true 
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee credentials'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee credentials'
      });
    }
    
    // Find employee profile
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    req.employee = employee;
    req.userEmail = user.email;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Save a new AI course (Employee only)
router.post('/save-course', verifyEmployeeForSave, async (req, res) => {
  try {
    const { course } = req.body;
    const employee = req.employee;

    console.log('Saving course for:', req.userEmail, 'Course:', course.title);

    // Check if employee already has 3 courses
    if (employee.savedCourses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 3 courses can be saved'
      });
    }

    // Check if course already exists for this employee
    const existingCourse = employee.savedCourses.find(
      sc => sc.title === course.title && sc.provider === course.provider
    );

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course already saved'
      });
    }

    const newSavedCourse = {
      title: course.title,
      provider: course.provider,
      duration: course.duration,
      costType: course.costType,
      skillsCovered: course.skillsCovered,
      enrollLink: course.enrollLink,
      rating: course.rating,
      level: course.level,
      certificate: course.certificate,
      description: course.description,
      savedAt: new Date()
    };

    employee.savedCourses.push(newSavedCourse);
    await employee.save();

    // Get the newly added course (last one in array)
    const savedCourse = employee.savedCourses[employee.savedCourses.length - 1];

    res.json({
      success: true,
      message: 'Course saved successfully',
      savedCourse: {
        id: savedCourse._id.toString(),
        title: savedCourse.title,
        provider: savedCourse.provider,
        duration: savedCourse.duration,
        costType: savedCourse.costType,
        skillsCovered: savedCourse.skillsCovered,
        enrollLink: savedCourse.enrollLink,
        savedAt: savedCourse.savedAt.toISOString(),
        status: savedCourse.status,
        completionProof: savedCourse.completionProof,
        rating: savedCourse.rating,
        level: savedCourse.level,
        certificate: savedCourse.certificate,
        description: savedCourse.description
      }
    });
  } catch (error) {
    console.error('Error saving course:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course already saved'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to save course'
    });
  }
});

// Mark course as completed with proof (Employee only)
router.post('/complete-course', verifyEmployeeForSave, async (req, res) => {
  try {
    const { courseId, proof } = req.body;
    const employee = req.employee;

    console.log('Completing course:', courseId, 'for:', req.userEmail);

    // Find the course in employee's savedCourses
    const savedCourse = employee.savedCourses.id(courseId);

    if (!savedCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Store the proof links as provided by frontend
    savedCourse.status = 'pending_review';
    savedCourse.completionProof = {
      file: proof.file, // Supabase URL from frontend
      link: proof.link, // Direct link from frontend
      submittedAt: new Date()
    };

    await employee.save();

    res.json({
      success: true,
      message: 'Course completion submitted for review',
      savedCourse: {
        id: savedCourse._id.toString(),
        title: savedCourse.title,
        provider: savedCourse.provider,
        duration: savedCourse.duration,
        costType: savedCourse.costType,
        skillsCovered: savedCourse.skillsCovered,
        enrollLink: savedCourse.enrollLink,
        savedAt: savedCourse.savedAt.toISOString(),
        status: savedCourse.status,
        completionProof: savedCourse.completionProof,
        rating: savedCourse.rating,
        level: savedCourse.level,
        certificate: savedCourse.certificate,
        description: savedCourse.description
      }
    });
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit course completion'
    });
  }
});

// Get employee's own saved courses (Employee only)
router.post('/my-saved-courses', verifyEmployeeForSave, async (req, res) => {
  try {
    const employee = req.employee;

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
      }))
    });
  } catch (error) {
    console.error('Error fetching saved courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved courses'
    });
  }
});

// Delete a saved course (Employee only)
router.post('/delete-course', verifyEmployeeForSave, async (req, res) => {
  try {
    const { courseId } = req.body;
    const employee = req.employee;

    console.log('Deleting course:', courseId, 'for:', req.userEmail);

    // Find and remove the course from savedCourses
    const courseIndex = employee.savedCourses.findIndex(course => course._id.toString() === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const deletedCourse = employee.savedCourses[courseIndex];
    employee.savedCourses.splice(courseIndex, 1);
    
    await employee.save();

    res.json({
      success: true,
      message: 'Course deleted successfully',
      deletedCourse: {
        id: deletedCourse._id.toString(),
        title: deletedCourse.title
      }
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
});

module.exports = router;