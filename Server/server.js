const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { initializeHRAccount } = require('./controllers/authController');

// Load env vars first
dotenv.config();

// Debug: Check if env vars are loaded
console.log('Environment Variables Loaded:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HR_EMAIL:', process.env.HR_EMAIL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '*** Loaded Successfully ***' : 'NOT FOUND');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route to test server
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkillCompass API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Connect to database
connectDB();

// Initialize HR account after DB connection
setTimeout(() => {
  initializeHRAccount();
}, 2000); // Wait 2 seconds for DB connection

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employee', require('./routes/employees'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});