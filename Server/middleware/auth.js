const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    })
  }
}

const requireHR = async (req, res, next) => {
  try {
    let email
    let password

    // Prefer Basic Auth, but accept body creds if header missing
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Basic ")) {
      const base64Credentials = authHeader.split(" ")[1]
      const credentials = Buffer.from(base64Credentials, "base64").toString("ascii")
      ;[email, password] = credentials.split(":")
    } else {
      // Fallback to body credentials
      email = req.body?.email
      password = req.body?.password
    }

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "HR authentication required. Provide email and password in body or Basic Authorization header.",
      })
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      userType: "hr",
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid HR credentials",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "HR account is deactivated",
      })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid HR credentials",
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("RequireHR middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during HR authentication",
    })
  }
}

const requireEmployee = async (req, res, next) => {
  try {
    if (req.user.userType !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Employee account required.",
      })
    }
    next()
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

module.exports = {
  authMiddleware,
  requireHR,
  requireEmployee,
}
