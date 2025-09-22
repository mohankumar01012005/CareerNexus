// SkillCompass MongoDB Indexes for Performance Optimization
// Industry Standard Database Indexing Strategy

const mongoose = require('mongoose');

// =============================================
// PERFORMANCE INDEXES
// =============================================

const createIndexes = async () => {
  try {
    // User Authentication Indexes
    await mongoose.connection.collection('users').createIndex(
      { email: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('users').createIndex(
      { companyId: 1, userType: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('users').createIndex(
      { isActive: 1, lastLogin: -1 }, 
      { background: true }
    );

    // Employee Profile Indexes
    await mongoose.connection.collection('employee_profiles').createIndex(
      { userId: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('employee_profiles').createIndex(
      { employeeId: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('employee_profiles').createIndex(
      { departmentId: 1, isActive: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('employee_profiles').createIndex(
      { managerId: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('employee_profiles').createIndex(
      { joinDate: -1 }, 
      { background: true }
    );

    // Skills and Assessment Indexes
    await mongoose.connection.collection('skills').createIndex(
      { skillName: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('skills').createIndex(
      { category: 1, isActive: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('employee_skills').createIndex(
      { employeeId: 1, skillId: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('employee_skills').createIndex(
      { skillId: 1, proficiencyLevel: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('employee_skills').createIndex(
      { lastAssessedDate: -1 }, 
      { background: true }
    );

    // Job Management Indexes
    await mongoose.connection.collection('job_postings').createIndex(
      { jobCode: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('job_postings').createIndex(
      { companyId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('job_postings').createIndex(
      { departmentId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('job_postings').createIndex(
      { postedDate: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('job_postings').createIndex(
      { applicationDeadline: 1 }, 
      { background: true }
    );

    // Job Applications Indexes
    await mongoose.connection.collection('job_applications').createIndex(
      { jobId: 1, applicantId: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('job_applications').createIndex(
      { applicantId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('job_applications').createIndex(
      { jobId: 1, status: 1, matchPercentage: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('job_applications').createIndex(
      { applicationDate: -1 }, 
      { background: true }
    );

    // Career Management Indexes
    await mongoose.connection.collection('career_goals').createIndex(
      { employeeId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('career_goals').createIndex(
      { targetDate: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('career_journeys').createIndex(
      { employeeId: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('career_journeys').createIndex(
      { careerPathId: 1, status: 1 }, 
      { background: true }
    );

    // Approval Workflow Indexes
    await mongoose.connection.collection('approval_requests').createIndex(
      { requesterId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('approval_requests').createIndex(
      { requestType: 1, status: 1, priority: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('approval_requests').createIndex(
      { 'approvalWorkflow.approverId': 1, 'approvalWorkflow.status': 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('approval_requests').createIndex(
      { dueDate: 1, status: 1 }, 
      { background: true }
    );

    // Mentor Requests Indexes
    await mongoose.connection.collection('mentor_requests').createIndex(
      { requesterId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('mentor_requests').createIndex(
      { mentorId: 1, status: 1 }, 
      { background: true }
    );

    // Training Requests Indexes
    await mongoose.connection.collection('training_requests').createIndex(
      { requesterId: 1, status: 1 }, 
      { background: true }
    );
    await mongoose.connection.collection('training_requests').createIndex(
      { status: 1, preferredStartDate: 1 }, 
      { background: true }
    );

    // Performance Metrics Indexes
    await mongoose.connection.collection('performance_metrics').createIndex(
      { employeeId: 1, 'reviewPeriod.endDate': -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('performance_metrics').createIndex(
      { reviewType: 1, reviewDate: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('performance_metrics').createIndex(
      { overallRating: 1, reviewDate: -1 }, 
      { background: true }
    );

    // Analytics Dashboard Indexes
    await mongoose.connection.collection('analytics_dashboard').createIndex(
      { companyId: 1, reportType: 1, reportDate: -1 }, 
      { background: true }
    );

    // Notifications Indexes
    await mongoose.connection.collection('notifications').createIndex(
      { recipientId: 1, isRead: 1, createdAt: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('notifications').createIndex(
      { type: 1, priority: 1, createdAt: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('notifications').createIndex(
      { expiresAt: 1 }, 
      { expireAfterSeconds: 0, background: true }
    );

    // Audit Logs Indexes
    await mongoose.connection.collection('audit_logs').createIndex(
      { userId: 1, timestamp: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('audit_logs').createIndex(
      { action: 1, timestamp: -1 }, 
      { background: true }
    );
    await mongoose.connection.collection('audit_logs').createIndex(
      { entityType: 1, entityId: 1, timestamp: -1 }, 
      { background: true }
    );

    // Company and Department Indexes
    await mongoose.connection.collection('companies').createIndex(
      { companyCode: 1 }, 
      { unique: true, background: true }
    );
    await mongoose.connection.collection('departments').createIndex(
      { companyId: 1, departmentCode: 1 }, 
      { unique: true, background: true }
    );

    // Text Search Indexes
    await mongoose.connection.collection('job_postings').createIndex(
      { 
        jobTitle: 'text', 
        description: 'text', 
        requirements: 'text' 
      },
      { 
        background: true,
        weights: {
          jobTitle: 10,
          description: 5,
          requirements: 3
        }
      }
    );

    await mongoose.connection.collection('employee_profiles').createIndex(
      { 
        firstName: 'text', 
        lastName: 'text', 
        fullName: 'text',
        currentRole: 'text'
      },
      { 
        background: true,
        weights: {
          fullName: 10,
          firstName: 8,
          lastName: 8,
          currentRole: 5
        }
      }
    );

    await mongoose.connection.collection('skills').createIndex(
      { 
        skillName: 'text', 
        description: 'text' 
      },
      { 
        background: true,
        weights: {
          skillName: 10,
          description: 3
        }
      }
    );

    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

// =============================================
// COMPOUND INDEXES FOR COMPLEX QUERIES
// =============================================

const createCompoundIndexes = async () => {
  try {
    // Employee search and filtering
    await mongoose.connection.collection('employee_profiles').createIndex(
      { 
        departmentId: 1, 
        currentRole: 1, 
        isActive: 1,
        joinDate: -1 
      },
      { background: true }
    );

    // Job matching and recommendations
    await mongoose.connection.collection('job_applications').createIndex(
      { 
        jobId: 1, 
        status: 1, 
        matchPercentage: -1,
        applicationDate: -1 
      },
      { background: true }
    );

    // Skills gap analysis
    await mongoose.connection.collection('employee_skills').createIndex(
      { 
        skillId: 1, 
        proficiencyLevel: 1,
        lastAssessedDate: -1 
      },
      { background: true }
    );

    // Performance tracking
    await mongoose.connection.collection('performance_metrics').createIndex(
      { 
        employeeId: 1, 
        reviewType: 1,
        'reviewPeriod.endDate': -1,
        overallRating: -1 
      },
      { background: true }
    );

    // Analytics queries
    await mongoose.connection.collection('analytics_dashboard').createIndex(
      { 
        companyId: 1, 
        reportType: 1,
        reportDate: -1 
      },
      { background: true }
    );

    console.log('✅ All compound indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating compound indexes:', error);
    throw error;
  }
};

// =============================================
// TTL INDEXES FOR DATA CLEANUP
// =============================================

const createTTLIndexes = async () => {
  try {
    // Auto-expire old audit logs (keep for 2 years)
    await mongoose.connection.collection('audit_logs').createIndex(
      { timestamp: 1 },
      { 
        expireAfterSeconds: 63072000, // 2 years in seconds
        background: true 
      }
    );

    // Auto-expire read notifications (keep for 90 days)
    await mongoose.connection.collection('notifications').createIndex(
      { readAt: 1 },
      { 
        expireAfterSeconds: 7776000, // 90 days in seconds
        background: true,
        partialFilterExpression: { isRead: true }
      }
    );

    // Auto-expire old analytics data (keep for 5 years)
    await mongoose.connection.collection('analytics_dashboard').createIndex(
      { reportDate: 1 },
      { 
        expireAfterSeconds: 157680000, // 5 years in seconds
        background: true 
      }
    );

    console.log('✅ All TTL indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating TTL indexes:', error);
    throw error;
  }
};

// =============================================
// INDEX MANAGEMENT FUNCTIONS
// =============================================

const dropAllIndexes = async () => {
  try {
    const collections = [
      'users', 'employee_profiles', 'hr_profiles', 'companies', 'departments',
      'skills', 'employee_skills', 'career_goals', 'career_paths', 'career_journeys',
      'job_postings', 'job_applications', 'approval_requests', 'mentor_requests',
      'training_requests', 'performance_metrics', 'analytics_dashboard',
      'notifications', 'audit_logs', 'system_configs'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.collection(collectionName).dropIndexes();
        console.log(`✅ Dropped indexes for ${collectionName}`);
      } catch (error) {
        if (error.code !== 26) { // Ignore "namespace not found" errors
          console.warn(`⚠️ Could not drop indexes for ${collectionName}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

const recreateAllIndexes = async () => {
  try {
    console.log('🔄 Recreating all database indexes...');
    await dropAllIndexes();
    await createIndexes();
    await createCompoundIndexes();
    await createTTLIndexes();
    console.log('✅ All indexes recreated successfully');
  } catch (error) {
    console.error('❌ Error recreating indexes:', error);
    throw error;
  }
};

module.exports = {
  createIndexes,
  createCompoundIndexes,
  createTTLIndexes,
  dropAllIndexes,
  recreateAllIndexes
};