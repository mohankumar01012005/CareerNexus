const Employee = require('../models/Employee');
const User = require('../models/User');

// Get employee dashboard data
const getDashboardData = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'email lastLogin');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Calculate career readiness score (mock calculation)
    const readinessScore = calculateReadinessScore(employee);

    const dashboardData = {
      profile: {
        fullName: employee.fullName,
        role: employee.role,
        department: employee.department,
        joiningDate: employee.joiningDate,
        tenure: employee.tenure,
        avatar: employee.avatar
      },
      careerReadinessScore: readinessScore,
      skills: employee.skills,
      careerGoals: employee.careerGoals,
      quickStats: {
        skillsTracked: employee.skills.length,
        coursesAvailable: 15, // Mock data
        openPositions: 8, // Mock data
        achievements: employee.achievements.length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

// Update employee skills
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    employee.skills = skills;
    await employee.save();

    res.json({
      success: true,
      message: 'Skills updated successfully',
      skills: employee.skills
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating skills'
    });
  }
};

// Add career goal
const addCareerGoal = async (req, res) => {
  try {
    const { targetRole, priority, targetDate, skillsRequired } = req.body;
    
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const newGoal = {
      targetRole,
      priority,
      targetDate: new Date(targetDate),
      skillsRequired: skillsRequired || [],
      progress: 0
    };

    employee.careerGoals.push(newGoal);
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Career goal added successfully',
      goal: newGoal
    });
  } catch (error) {
    console.error('Add career goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding career goal'
    });
  }
};

// Helper function to calculate readiness score
const calculateReadinessScore = (employee) => {
  // Mock calculation based on skills proficiency and career goals
  const skillScore = employee.skills.reduce((acc, skill) => acc + skill.proficiency, 0) / 
                    (employee.skills.length || 1);
  const goalProgress = employee.careerGoals.reduce((acc, goal) => acc + goal.progress, 0) / 
                      (employee.careerGoals.length || 1);
  
  return Math.round((skillScore * 0.6) + (goalProgress * 0.4));
};

module.exports = {
  getDashboardData,
  updateSkills,
  addCareerGoal
};