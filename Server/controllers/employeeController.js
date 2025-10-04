const Employee = require("../models/Employee")
const User = require("../models/User")

// Get employee dashboard data
const getDashboardData = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).populate("user", "email lastLogin")

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    // Calculate career readiness score (mock calculation)
    const readinessScore = calculateReadinessScore(employee)

    const dashboardData = {
      profile: {
        fullName: employee.fullName,
        role: employee.role,
        department: employee.department,
        joiningDate: employee.joiningDate,
        tenure: employee.tenure,
        avatar: employee.avatar,
      },
      careerReadinessScore: readinessScore,
      skills: employee.skills,
      careerGoals: employee.careerGoals,
      quickStats: {
        skillsTracked: employee.skills.length,
        coursesAvailable: 15, // Mock data
        openPositions: 8, // Mock data
        achievements: employee.achievements.length,
      },
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    })
  }
}

// Update employee skills
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body

    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    employee.skills = skills
    await employee.save()

    res.json({
      success: true,
      message: "Skills updated successfully",
      skills: employee.skills,
    })
  } catch (error) {
    console.error("Update skills error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating skills",
    })
  }
}

// Add career goal
const addCareerGoal = async (req, res) => {
  try {
    const { targetRole, priority, targetDate, skillsRequired } = req.body

    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    const newGoal = {
      targetRole,
      priority,
      targetDate: new Date(targetDate),
      skillsRequired: skillsRequired || [],
      progress: 0,
    }

    employee.careerGoals.push(newGoal)
    await employee.save()

    res.status(201).json({
      success: true,
      message: "Career goal added successfully",
      goal: newGoal,
    })
  } catch (error) {
    console.error("Add career goal error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while adding career goal",
    })
  }
}

// Update employee's resume_link field from a provided public URL
const updateResumeLink = async (req, res) => {
  try {
    const { resumeLink, resume_link, publicUrl, resumeData, resume_data, parsedData } = req.body
    const link = resumeLink || resume_link || publicUrl

    if (!link) {
      return res.status(400).json({
        success: false,
        message: "resumeLink (or publicUrl/resume_link) is required",
      })
    }

    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    employee.resume_link = link

    // Optionally accept parsed resume data in the same call (non-breaking)
    const data = resumeData ?? resume_data ?? parsedData
    if (data && typeof data === "object" && !Array.isArray(data)) {
      // Override resume_data with new data (single object in array)
      employee.resume_data = [data]
    }

    await employee.save()

    return res.json({
      success: true,
      message: "Resume link saved successfully",
      resume_link: employee.resume_link,
      resume_data_count: employee.resume_data?.length || 0,
    })
  } catch (error) {
    console.error("Update resume link error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while updating resume link",
    })
  }
}

// Updated controller to override resume data (instead of appending)
const addResumeData = async (req, res) => {
  try {
    // Accept multiple naming variants to be robust with client payloads
    const { resumeData, resume_data, parsedData } = req.body
    const data = resumeData ?? resume_data ?? parsedData

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "resumeData (object) is required",
      })
    }

    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    // Override resume_data with new data (single object in array)
    employee.resume_data = [data]
    await employee.save()

    return res.status(201).json({
      success: true,
      message: "Resume data overridden successfully",
      count: employee.resume_data.length,
    })
  } catch (error) {
    console.error("Add resume data error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while saving resume data",
    })
  }
}

// Get resume link
const getResumeLink = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    return res.json({
      success: true,
      resume_link: employee.resume_link || null,
    })
  } catch (error) {
    console.error("Get resume link error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while fetching resume link",
    })
  }
}

// Get resume data
const getResumeData = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    return res.json({
      success: true,
      count: employee.resume_data?.length || 0,
      resume_data: employee.resume_data || [],
    })
  } catch (error) {
    console.error("Get resume data error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while fetching resume data",
    })
  }
}

// Get resume link by email and password
const getResumeLinkByCredentials = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      })
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    return res.json({
      success: true,
      resume_link: employee.resume_link || null,
    })
  } catch (error) {
    console.error("Get resume link by credentials error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while fetching resume link",
    })
  }
}

// Get resume data by email and password
const getResumeDataByCredentials = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      })
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    return res.json({
      success: true,
      count: employee.resume_data?.length || 0,
      resume_data: employee.resume_data || [],
    })
  } catch (error) {
    console.error("Get resume data by credentials error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while fetching resume data",
    })
  }
}

// NEW: Update resume link by email and password
const updateResumeLinkByCredentials = async (req, res) => {
  try {
    const { email, password, resumeLink, resume_link, publicUrl, resumeData, resume_data, parsedData } = req.body
    const link = resumeLink || resume_link || publicUrl

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    if (!link) {
      return res.status(400).json({
        success: false,
        message: "resumeLink (or publicUrl/resume_link) is required",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      })
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    employee.resume_link = link

    // Optionally accept parsed resume data in the same call (non-breaking)
    const data = resumeData ?? resume_data ?? parsedData
    if (data && typeof data === "object" && !Array.isArray(data)) {
      // Override resume_data with new data (single object in array)
      employee.resume_data = [data]
    }

    await employee.save()

    return res.json({
      success: true,
      message: "Resume link saved successfully",
      resume_link: employee.resume_link,
      resume_data_count: employee.resume_data?.length || 0,
    })
  } catch (error) {
    console.error("Update resume link by credentials error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while updating resume link",
    })
  }
}

// NEW: Update resume data by email and password
const updateResumeDataByCredentials = async (req, res) => {
  try {
    const { email, password, resumeData, resume_data, parsedData } = req.body
    const data = resumeData ?? resume_data ?? parsedData

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "resumeData (object) is required",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      })
    }

    // Find employee by user ID
    const employee = await Employee.findOne({ user: user._id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      })
    }

    // Override resume_data with new data (single object in array)
    employee.resume_data = [data]
    await employee.save()

    return res.status(201).json({
      success: true,
      message: "Resume data overridden successfully",
      count: employee.resume_data.length,
    })
  } catch (error) {
    console.error("Update resume data by credentials error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error while saving resume data",
    })
  }
}

// Helper function to calculate readiness score
const calculateReadinessScore = (employee) => {
  // Mock calculation based on skills proficiency and career goals
  const skillScore = employee.skills.reduce((acc, skill) => acc + skill.proficiency, 0) / (employee.skills.length || 1)
  const goalProgress =
    employee.careerGoals.reduce((acc, goal) => acc + goal.progress, 0) / (employee.careerGoals.length || 1)

  return Math.round(skillScore * 0.6 + goalProgress * 0.4)
}

module.exports = {
  getDashboardData,
  updateSkills,
  addCareerGoal,
  updateResumeLink,
  addResumeData,
  getResumeLink,
  getResumeData,
  getResumeLinkByCredentials,
  getResumeDataByCredentials,
  updateResumeLinkByCredentials,
  updateResumeDataByCredentials,
}