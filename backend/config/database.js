// SkillCompass Database Configuration
// MongoDB connection setup with Mongoose

const mongoose = require('mongoose');
const { createIndexes, createCompoundIndexes, createTTLIndexes } = require('../models/indexes');

// MongoDB connection options
const mongoOptions = {
  // Connection settings
  maxPoolSize: 10, // Maximum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  
  // Replica set settings
  readPreference: 'primary',
  retryWrites: true,
  w: 'majority',
  
  // Authentication
  authSource: 'admin',
  
  // SSL/TLS (enable in production)
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: process.env.NODE_ENV === 'production',
  
  // Compression
  compressors: 'zlib',
  zlibCompressionLevel: 6,
};

// Database connection state
let isConnected = false;

/**
 * Connect to MongoDB database
 */
const connectDatabase = async () => {
  try {
    if (isConnected) {
      console.log('📊 Database already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillcompass';
    
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, mongoOptions);
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Create database indexes for performance
    await createDatabaseIndexes();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDatabase = async () => {
  try {
    if (!isConnected) {
      return;
    }
    
    await mongoose.disconnect();
    isConnected = false;
    console.log('📊 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

/**
 * Create database indexes for optimal performance
 */
const createDatabaseIndexes = async () => {
  try {
    console.log('🔄 Creating database indexes...');
    
    await createIndexes();
    await createCompoundIndexes();
    await createTTLIndexes();
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    // Don't exit process, indexes can be created later
  }
};

/**
 * Database health check
 */
const checkDatabaseHealth = async () => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      connected: true,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      readyState: mongoose.connection.readyState,
      collections: Object.keys(mongoose.connection.collections).length
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return {
      database: mongoose.connection.name,
      collections: collections.length,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      fileSize: stats.fileSize,
      indexSize: stats.indexSize
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

/**
 * Seed initial data (for development/testing)
 */
const seedDatabase = async () => {
  try {
    const { Company, Department, User, HRProfile, Skill, SystemConfig } = require('../models/schemas');
    
    console.log('🌱 Seeding database with initial data...');
    
    // Check if data already exists
    const existingCompany = await Company.findOne();
    if (existingCompany) {
      console.log('📊 Database already seeded');
      return;
    }
    
    // Create default company
    const company = new Company({
      companyCode: 'DEMO001',
      companyName: 'Demo Company Inc.',
      industry: 'Technology',
      companySize: 'medium',
      headquartersLocation: 'San Francisco, CA',
      websiteUrl: 'https://democompany.com',
      subscriptionPlan: 'professional',
      maxEmployees: 500,
      isActive: true
    });
    await company.save();
    
    // Create default departments
    const departments = [
      { departmentName: 'Engineering', departmentCode: 'ENG' },
      { departmentName: 'Design', departmentCode: 'DES' },
      { departmentName: 'Product', departmentCode: 'PRD' },
      { departmentName: 'Marketing', departmentCode: 'MKT' },
      { departmentName: 'Sales', departmentCode: 'SAL' },
      { departmentName: 'Operations', departmentCode: 'OPS' },
      { departmentName: 'Human Resources', departmentCode: 'HR' }
    ];
    
    const createdDepartments = [];
    for (const dept of departments) {
      const department = new Department({
        companyId: company._id,
        ...dept,
        isActive: true
      });
      await department.save();
      createdDepartments.push(department);
    }
    
    // Create default HR user
    const hrUser = new User({
      companyId: company._id,
      email: 'hr@company.com',
      passwordHash: 'admin123', // Will be hashed by middleware
      userType: 'hr',
      isActive: true,
      emailVerified: true
    });
    await hrUser.save();
    
    // Create HR profile
    const hrProfile = new HRProfile({
      userId: hrUser._id,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'hr_admin',
      permissions: [
        'create_employees',
        'manage_jobs',
        'view_analytics',
        'approve_requests',
        'manage_settings',
        'export_data',
        'manage_departments'
      ],
      isActive: true
    });
    await hrProfile.save();
    
    // Create default skills
    const skills = [
      { skillName: 'JavaScript', skillCode: 'JS', category: 'technical', icon: '⚛️' },
      { skillName: 'TypeScript', skillCode: 'TS', category: 'technical', icon: '📘' },
      { skillName: 'React', skillCode: 'REACT', category: 'technical', icon: '⚛️' },
      { skillName: 'Node.js', skillCode: 'NODE', category: 'technical', icon: '🟢' },
      { skillName: 'Python', skillCode: 'PY', category: 'technical', icon: '🐍' },
      { skillName: 'UI/UX Design', skillCode: 'UXUI', category: 'design', icon: '🎨' },
      { skillName: 'Figma', skillCode: 'FIGMA', category: 'design', icon: '🎨' },
      { skillName: 'Leadership', skillCode: 'LEAD', category: 'leadership', icon: '👑' },
      { skillName: 'Communication', skillCode: 'COMM', category: 'soft_skills', icon: '💬' },
      { skillName: 'Project Management', skillCode: 'PM', category: 'business', icon: '📊' },
      { skillName: 'Data Analysis', skillCode: 'DATA', category: 'data', icon: '📈' },
      { skillName: 'Product Strategy', skillCode: 'PSTRAT', category: 'business', icon: '🎯' }
    ];
    
    for (const skill of skills) {
      const skillDoc = new Skill({
        ...skill,
        description: `${skill.skillName} proficiency and expertise`,
        isActive: true
      });
      await skillDoc.save();
    }
    
    // Create system configuration
    const configs = [
      { configKey: 'app_name', configValue: 'SkillCompass', description: 'Application name' },
      { configKey: 'app_version', configValue: '1.0.0', description: 'Application version' },
      { configKey: 'max_login_attempts', configValue: 5, description: 'Maximum login attempts before lockout' },
      { configKey: 'session_timeout', configValue: 24, description: 'Session timeout in hours' },
      { configKey: 'password_min_length', configValue: 6, description: 'Minimum password length' }
    ];
    
    for (const config of configs) {
      const systemConfig = new SystemConfig({
        ...config,
        isActive: true
      });
      await systemConfig.save();
    }
    
    console.log('✅ Database seeded successfully');
    console.log('👤 Default HR user: hr@company.com / admin123');
    console.log('🏢 Default company: Demo Company Inc. (DEMO001)');
    
  } catch (error) {
    console.error('❌ Database seeding error:', error);
    throw error;
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  getDatabaseStats,
  seedDatabase,
  isConnected: () => isConnected
};