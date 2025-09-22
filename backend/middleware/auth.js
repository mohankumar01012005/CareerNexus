// SkillCompass Authentication Middleware
// JWT token verification and user authorization

const jwt = require('jsonwebtoken');
const { User, Company } = require('../models/schemas');

/**
 * Verify JWT Token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId)
      .populate('companyId')
      .select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if company is still active
    if (!user.companyId.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Company account is inactive'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      userType: user.userType,
      companyId: user.companyId._id,
      companyCode: user.companyId.companyCode
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Authorize user types (HR or Employee)
 */
const authorizeUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Authorize HR users only
 */
const authorizeHR = (req, res, next) => {
  return authorizeUserType('hr')(req, res, next);
};

/**
 * Authorize Employee users only
 */
const authorizeEmployee = (req, res, next) => {
  return authorizeUserType('employee')(req, res, next);
};

/**
 * Check if user can access specific employee data
 * HR can access all employees in their company
 * Employees can only access their own data
 */
const authorizeEmployeeAccess = async (req, res, next) => {
  try {
    const targetEmployeeId = req.params.employeeId || req.body.employeeId;

    if (!targetEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // HR can access any employee in their company
    if (req.user.userType === 'hr') {
      // Verify employee belongs to same company
      const targetUser = await User.findById(targetEmployeeId);
      if (!targetUser || targetUser.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access employee from different company'
        });
      }
      return next();
    }

    // Employees can only access their own data
    if (req.user.userType === 'employee') {
      if (targetEmployeeId !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access other employee data'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });

  } catch (error) {
    console.error('Employee access authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + req.body.email;
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Validate company access for multi-tenant operations
 */
const validateCompanyAccess = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.body.companyId;

    // If no specific company ID in request, use user's company
    if (!companyId) {
      return next();
    }

    // Check if user can access the specified company
    if (companyId !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access data from different company'
      });
    }

    next();
  } catch (error) {
    console.error('Company access validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during company validation'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('companyId')
      .select('-passwordHash');

    if (user && user.isActive && user.companyId.isActive) {
      req.user = {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        companyId: user.companyId._id,
        companyCode: user.companyId.companyCode
      };
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeUserType,
  authorizeHR,
  authorizeEmployee,
  authorizeEmployeeAccess,
  rateLimitAuth,
  validateCompanyAccess,
  optionalAuth
};