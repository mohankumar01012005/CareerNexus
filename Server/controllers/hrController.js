const Employee = require("../models/Employee")
const User = require("../models/User")

// Get all employees with their details
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("user", "email lastLogin isActive")
      .select("-resume_data") // Exclude large resume data for list view

    const employeeData = employees.map(employee => ({
      id: employee._id,
      user_id: employee.user._id,
      fullName: employee.fullName,
      email: employee.user.email,
      department: employee.department,
      role: employee.role,
      joiningDate: employee.joiningDate,
      tenure: employee.tenure,
      skills: employee.skills,
      careerGoals: employee.careerGoals,
      careerReadinessScore: employee.careerReadinessScore,
      isActive: employee.user.isActive,
      lastLogin: employee.user.lastLogin,
      resume_link: employee.resume_link,
      resume_data_count: employee.resume_data?.length || 0,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }))

    res.json({
      success: true,
      count: employeeData.length,
      employees: employeeData,
    })
  } catch (error) {
    console.error("Get all employees error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching employees",
    })
  }
}

// Get employee by ID with full details
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params

    const employee = await Employee.findById(id)
      .populate("user", "email lastLogin isActive")

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    const employeeData = {
      id: employee._id,
      user_id: employee.user._id,
      fullName: employee.fullName,
      email: employee.user.email,
      phoneNumber: employee.phoneNumber,
      department: employee.department,
      role: employee.role,
      joiningDate: employee.joiningDate,
      tenure: employee.tenure,
      avatar: employee.avatar,
      skills: employee.skills,
      careerGoals: employee.careerGoals,
      careerReadinessScore: employee.careerReadinessScore,
      isActive: employee.user.isActive,
      lastLogin: employee.user.lastLogin,
      achievements: employee.achievements,
      resume_link: employee.resume_link,
      resume_data: employee.resume_data,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }

    res.json({
      success: true,
      employee: employeeData,
    })
  } catch (error) {
    console.error("Get employee by ID error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching employee details",
    })
  }
}

// Get all pending career goals across all employees
const getPendingCareerGoals = async (req, res) => {
  try {
    const employees = await Employee.find({ "careerGoals.status": "pending" })
      .populate("user", "email")
      .select("fullName department role careerGoals")

    const pendingGoals = []

    employees.forEach(employee => {
      employee.careerGoals.forEach(goal => {
        if (goal.status === "pending") {
          pendingGoals.push({
            goalId: goal._id,
            employeeId: employee._id,
            employeeName: employee.fullName,
            employeeEmail: employee.user.email,
            department: employee.department,
            role: employee.role,
            targetRole: goal.targetRole,
            priority: goal.priority,
            targetDate: goal.targetDate,
            skillsRequired: goal.skillsRequired,
            progress: goal.progress,
            submittedAt: goal.submittedAt
          })
        }
      })
    })

    // Sort by submission date (newest first)
    pendingGoals.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    res.json({
      success: true,
      count: pendingGoals.length,
      pendingGoals: pendingGoals,
    })
  } catch (error) {
    console.error("Get pending career goals error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending career goals",
    })
  }
}

// Update career goal status (approve/reject)
const updateCareerGoalStatus = async (req, res) => {
  try {
    const { employeeId, goalId, status, reviewNotes } = req.body

    if (!employeeId || !goalId || !status) {
      return res.status(400).json({
        success: false,
        message: "employeeId, goalId, and status are required",
      })
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      })
    }

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    const goal = employee.careerGoals.id(goalId)
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Career goal not found",
      })
    }

    // Update goal status
    goal.status = status
    goal.reviewedAt = new Date()
    goal.reviewNotes = reviewNotes || ""

    await employee.save()

    res.json({
      success: true,
      message: `Career goal ${status} successfully`,
      goal: {
        id: goal._id,
        targetRole: goal.targetRole,
        priority: goal.priority,
        status: goal.status,
        reviewedAt: goal.reviewedAt,
        reviewNotes: goal.reviewNotes
      }
    })
  } catch (error) {
    console.error("Update career goal status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating career goal status",
    })
  }
}

// Get career goals statistics
const getCareerGoalsStats = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("user", "email")

    let totalGoals = 0
    let pendingGoals = 0
    let approvedGoals = 0
    let rejectedGoals = 0
    const goalsByDepartment = {}
    const goalsByPriority = { High: 0, Medium: 0, Low: 0 }

    employees.forEach(employee => {
      employee.careerGoals.forEach(goal => {
        totalGoals++
        
        if (goal.status === "pending") pendingGoals++
        if (goal.status === "approved") approvedGoals++
        if (goal.status === "rejected") rejectedGoals++

        // Count by department
        if (!goalsByDepartment[employee.department]) {
          goalsByDepartment[employee.department] = 0
        }
        goalsByDepartment[employee.department]++

        // Count by priority
        goalsByPriority[goal.priority]++
      })
    })

    res.json({
      success: true,
      stats: {
        totalGoals,
        pendingGoals,
        approvedGoals,
        rejectedGoals,
        goalsByDepartment,
        goalsByPriority
      }
    })
  } catch (error) {
    console.error("Get career goals stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching career goals statistics",
    })
  }
}

// Update employee status (activate/deactivate)
const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId, isActive } = req.body

    if (!employeeId || typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "employeeId and isActive (boolean) are required",
      })
    }

    const employee = await Employee.findById(employeeId).populate("user")
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      })
    }

    employee.user.isActive = isActive
    await employee.user.save()

    res.json({
      success: true,
      message: `Employee ${isActive ? "activated" : "deactivated"} successfully`,
      employee: {
        id: employee._id,
        fullName: employee.fullName,
        email: employee.user.email,
        isActive: employee.user.isActive
      }
    })
  } catch (error) {
    console.error("Update employee status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating employee status",
    })
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  getPendingCareerGoals,
  updateCareerGoalStatus,
  getCareerGoalsStats,
  updateEmployeeStatus,
}