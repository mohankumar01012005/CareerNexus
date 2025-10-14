
const CourseRecommendation = require("../models/CourseRecommendation");
const CourseProgress = require("../models/CourseProgress");
const Employee = require("../models/Employee");
const User = require("../models/User");

// Store AI-generated course recommendations
const storeCourseRecommendations = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      targetRole, 
      priority, 
      courses, 
      aspirationId 
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!targetRole || !priority || !courses || !Array.isArray(courses)) {
      return res.status(400).json({
        success: false,
        message: "targetRole, priority, and courses array are required",
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

    // Calculate stats
    const freeCourses = courses.filter(course => course.cost === 'Free').length;
    const paidCourses = courses.filter(course => course.cost === 'Paid').length;
    const totalCourses = courses.length;
    const averageRelevanceScore = courses.reduce((acc, course) => acc + (course.relevanceScore || 0), 0) / totalCourses;

    // Create or update course recommendation
    const recommendation = await CourseRecommendation.findOneAndUpdate(
      {
        employee: employee._id,
        targetRole,
        priority,
        status: 'active'
      },
      {
        employee: employee._id,
        aspirationId: aspirationId || null,
        targetRole,
        priority,
        courses,
        totalCourses,
        freeCourses,
        paidCourses,
        averageRelevanceScore: Math.round(averageRelevanceScore),
        status: 'active',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Initialize progress tracking for each course
    const progressPromises = courses.map(course => 
      CourseProgress.findOneAndUpdate(
        {
          employee: employee._id,
          courseRecommendation: recommendation._id,
          courseId: course._id || course.id
        },
        {
          employee: employee._id,
          courseRecommendation: recommendation._id,
          courseId: course._id || course.id,
          courseTitle: course.title,
          status: 'not_started'
        },
        {
          upsert: true,
          new: true
        }
      )
    );

    await Promise.all(progressPromises);

    return res.status(201).json({
      success: true,
      message: "Course recommendations stored successfully",
      recommendation: {
        id: recommendation._id,
        targetRole: recommendation.targetRole,
        priority: recommendation.priority,
        totalCourses: recommendation.totalCourses,
        freeCourses: recommendation.freeCourses,
        paidCourses: recommendation.paidCourses,
        averageRelevanceScore: recommendation.averageRelevanceScore,
        generatedAt: recommendation.generatedAt
      }
    });

  } catch (error) {
    console.error("Store course recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while storing course recommendations",
    });
  }
};

// Get course recommendations for employee
const getCourseRecommendations = async (req, res) => {
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

    // Get active course recommendations
    const recommendations = await CourseRecommendation.find({
      employee: employee._id,
      status: 'active'
    }).sort({ priority: -1, generatedAt: -1 });

    // Get progress for all recommendations
    const recommendationsWithProgress = await Promise.all(
      recommendations.map(async (rec) => {
        const progress = await CourseProgress.find({
          employee: employee._id,
          courseRecommendation: rec._id
        });

        const coursesWithProgress = rec.courses.map(course => {
          const courseProgress = progress.find(p => 
            p.courseId.toString() === (course._id ? course._id.toString() : course.id)
          );

          return {
            ...course.toObject(),
            progress: courseProgress ? {
              status: courseProgress.status,
              startedAt: courseProgress.startedAt,
              completedAt: courseProgress.completedAt,
              aiVerified: courseProgress.aiVerification.verified,
              hrVerified: courseProgress.hrVerification.verified
            } : null
          };
        });

        return {
          ...rec.toObject(),
          courses: coursesWithProgress
        };
      })
    );

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations: recommendationsWithProgress,
    });

  } catch (error) {
    console.error("Get course recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course recommendations",
    });
  }
};

// Get course recommendations by priority
const getCourseRecommendationsByPriority = async (req, res) => {
  try {
    const { email, password, priority } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!priority || !['High', 'Medium', 'Low'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Valid priority (High, Medium, Low) is required",
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

    const recommendation = await CourseRecommendation.findOne({
      employee: employee._id,
      priority,
      status: 'active'
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: `No active course recommendations found for ${priority} priority`,
      });
    }

    // Get progress for this recommendation
    const progress = await CourseProgress.find({
      employee: employee._id,
      courseRecommendation: recommendation._id
    });

    const coursesWithProgress = recommendation.courses.map(course => {
      const courseProgress = progress.find(p => 
        p.courseId.toString() === (course._id ? course._id.toString() : course.id)
      );

      return {
        ...course.toObject(),
        progress: courseProgress ? {
          status: courseProgress.status,
          startedAt: courseProgress.startedAt,
          completedAt: courseProgress.completedAt,
          aiVerified: courseProgress.aiVerification.verified,
          hrVerified: courseProgress.hrVerification.verified
        } : null
      };
    });

    return res.json({
      success: true,
      recommendation: {
        ...recommendation.toObject(),
        courses: coursesWithProgress
      },
    });

  } catch (error) {
    console.error("Get course recommendations by priority error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course recommendations",
    });
  }
};

// Update course progress (start a course)
const startCourse = async (req, res) => {
  try {
    const { email, password, courseId, recommendationId } = req.body;

    if (!email || !password || !courseId || !recommendationId) {
      return res.status(400).json({
        success: false,
        message: "Email, password, courseId, and recommendationId are required",
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

    // Update course progress
    const progress = await CourseProgress.findOneAndUpdate(
      {
        employee: employee._id,
        courseRecommendation: recommendationId,
        courseId
      },
      {
        status: 'in_progress',
        startedAt: new Date()
      },
      {
        new: true
      }
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    return res.json({
      success: true,
      message: "Course marked as in progress",
      progress: {
        courseId: progress.courseId,
        status: progress.status,
        startedAt: progress.startedAt
      }
    });

  } catch (error) {
    console.error("Start course error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating course progress",
    });
  }
};

// Submit course completion proof
const submitCourseCompletion = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      courseId, 
      recommendationId, 
      proof, 
      proofType 
    } = req.body;

    if (!email || !password || !courseId || !recommendationId || !proof) {
      return res.status(400).json({
        success: false,
        message: "Email, password, courseId, recommendationId, and proof are required",
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

    // Update course progress with completion proof
    const progress = await CourseProgress.findOneAndUpdate(
      {
        employee: employee._id,
        courseRecommendation: recommendationId,
        courseId
      },
      {
        status: 'completed',
        completedAt: new Date(),
        proof,
        proofType: proofType || 'certificate'
      },
      {
        new: true
      }
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    return res.json({
      success: true,
      message: "Course completion proof submitted successfully. Awaiting verification.",
      progress: {
        courseId: progress.courseId,
        status: progress.status,
        completedAt: progress.completedAt,
        proof: progress.proof,
        proofType: progress.proofType
      }
    });

  } catch (error) {
    console.error("Submit course completion error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting course completion",
    });
  }
};

// Get course progress summary
const getCourseProgressSummary = async (req, res) => {
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

    // Get all course progress for employee
    const progress = await CourseProgress.find({
      employee: employee._id
    }).populate('courseRecommendation', 'targetRole priority');

    // Calculate summary statistics
    const totalCourses = progress.length;
    const notStarted = progress.filter(p => p.status === 'not_started').length;
    const inProgress = progress.filter(p => p.status === 'in_progress').length;
    const completed = progress.filter(p => p.status === 'completed').length;
    const verified = progress.filter(p => 
      p.status === 'verified' || p.hrVerification.verified
    ).length;

    const progressByPriority = {};
    progress.forEach(p => {
      const priority = p.courseRecommendation?.priority || 'Unknown';
      if (!progressByPriority[priority]) {
        progressByPriority[priority] = { total: 0, completed: 0, verified: 0 };
      }
      progressByPriority[priority].total++;
      if (p.status === 'completed' || p.status === 'verified') {
        progressByPriority[priority].completed++;
      }
      if (p.hrVerification.verified) {
        progressByPriority[priority].verified++;
      }
    });

    return res.json({
      success: true,
      summary: {
        totalCourses,
        notStarted,
        inProgress,
        completed,
        verified,
        completionRate: totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0,
        verificationRate: totalCourses > 0 ? Math.round((verified / totalCourses) * 100) : 0,
        progressByPriority
      },
      recentProgress: progress
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10)
        .map(p => ({
          courseId: p.courseId,
          courseTitle: p.courseTitle,
          status: p.status,
          targetRole: p.courseRecommendation?.targetRole,
          priority: p.courseRecommendation?.priority,
          updatedAt: p.updatedAt
        }))
    });

  } catch (error) {
    console.error("Get course progress summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching course progress summary",
    });
  }
};

module.exports = {
  storeCourseRecommendations,
  getCourseRecommendations,
  getCourseRecommendationsByPriority,
  startCourse,
  submitCourseCompletion,
  getCourseProgressSummary
};
