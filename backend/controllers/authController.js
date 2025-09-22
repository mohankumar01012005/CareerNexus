// SkillCompass Authentication Controller
// Handles user authentication, registration, and session management

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, EmployeeProfile, HRProfile, Company, Department } = require('../models/schemas');
const { AuditLog } = require('../models/schemas');

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

/**
 * HR Login - Only HR users can login directly
 * Employees get credentials from HR
 */
const loginUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and user type are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).populate('companyId');

    if (!user) {
      // Log failed login attempt
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User not found'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user type matches
    if (user.userType !== userType) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();

      // Log failed login attempt
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Get user profile based on type
    let userProfile;
    if (userType === 'employee') {
      userProfile = await EmployeeProfile.findOne({ userId: user._id })
        .populate('departmentId')
        .populate('managerId', 'email');
    } else {
      userProfile = await HRProfile.findOne({ userId: user._id });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        userType: user.userType,
        companyId: user.companyId._id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Return user data (excluding sensitive information)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          company: {
            id: user.companyId._id,
            name: user.companyId.companyName,
            code: user.companyId.companyCode
          },
          profile: userProfile,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Create Employee Account - Only HR can create employee accounts
 * This is the ONLY way employees get accounts
 */
const createEmployeeAccount = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      departmentId,
      currentRole,
      joinDate,
      phoneNumber,
      managerId,
      employmentType,
      workLocation,
      salary
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !departmentId || !currentRole || !joinDate) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if HR user is making this request
    if (req.user.userType !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR users can create employee accounts'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Validate department exists and belongs to same company
    const department = await Department.findOne({
      _id: departmentId,
      companyId: req.user.companyId,
      isActive: true
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // Generate unique employee ID
    const employeeCount = await EmployeeProfile.countDocuments({});
    const employeeId = `EMP${String(employeeCount + 1).padStart(6, '0')}`;

    // Create user account
    const newUser = new User({
      companyId: req.user.companyId,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save middleware
      userType: 'employee',
      isActive: true,
      emailVerified: true, // HR-created accounts are pre-verified
      createdBy: req.user.userId
    });

    await newUser.save();

    // Create employee profile
    const employeeProfile = new EmployeeProfile({
      userId: newUser._id,
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      departmentId,
      currentRole: currentRole.trim(),
      joinDate: new Date(joinDate),
      phoneNumber,
      managerId,
      employmentType: employmentType || 'full-time',
      workLocation: workLocation || 'office',
      salary: salary ? {
        amount: salary.amount,
        currency: salary.currency || 'USD',
        frequency: salary.frequency || 'yearly'
      } : undefined,
      isActive: true
    });

    await employeeProfile.save();

    // Log account creation
    await AuditLog.create({
      userId: req.user.userId,
      action: 'CREATE_EMPLOYEE',
      entityType: 'User',
      entityId: newUser._id,
      newValues: {
        email: newUser.email,
        employeeId,
        name: `${firstName} ${lastName}`,
        department: department.departmentName
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Return success response (excluding sensitive data)
    res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          userType: newUser.userType
        },
        profile: {
          employeeId,
          fullName: `${firstName} ${lastName}`,
          department: department.departmentName,
          currentRole,
          joinDate
        }
      }
    });

  } catch (error) {
    console.error('Create employee error:', error);
    
    // Log failed creation attempt
    await AuditLog.create({
      userId: req.user?.userId,
      action: 'CREATE_EMPLOYEE_FAILED',
      entityType: 'User',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during account creation'
    });
  }
};

/**
 * Logout User
 */
const logoutUser = async (req, res) => {
  try {
    // Log logout action
    await AuditLog.create({
      userId: req.user.userId,
      action: 'LOGOUT',
      entityType: 'User',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * Get Current User Profile
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('companyId')
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user profile based on type
    let userProfile;
    if (user.userType === 'employee') {
      userProfile = await EmployeeProfile.findOne({ userId: user._id })
        .populate('departmentId')
        .populate('managerId', 'email');
    } else {
      userProfile = await HRProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType,
          company: {
            id: user.companyId._id,
            name: user.companyId.companyName,
            code: user.companyId.companyCode
          },
          profile: userProfile,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Change Password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.userId);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    // Log password change
    await AuditLog.create({
      userId: req.user.userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
};

/**
 * Reset Password (HR can reset employee passwords)
 */
const resetEmployeePassword = async (req, res) => {
  try {
    const { employeeId, newPassword } = req.body;

    // Only HR can reset passwords
    if (req.user.userType !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Only HR users can reset employee passwords'
      });
    }

    if (!employeeId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find employee in same company
    const employeeProfile = await EmployeeProfile.findOne({ 
      employeeId,
      isActive: true 
    }).populate('userId');

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify employee belongs to same company
    if (employeeProfile.userId.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset password for employee from different company'
      });
    }

    // Update password
    const user = employeeProfile.userId;
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    user.loginAttempts = 0; // Reset login attempts
    user.lockUntil = undefined; // Unlock account
    await user.save();

    // Log password reset
    await AuditLog.create({
      userId: req.user.userId,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.status(200).json({
      success: true,
      message: 'Employee password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset'
    });
  }
};

module.exports = {
  loginUser,
  createEmployeeAccount,
  logoutUser,
  getCurrentUser,
  changePassword,
  resetEmployeePassword
};