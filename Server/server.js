import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully. ✅');
    // Start the server after a successful database connection
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT} 🚀`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error: ❌', err);
    process.exit(1); // Exit with failure
  });

// Simple test route
app.get('/', (req, res) => {
  res.send('SkillCompass Backend is Live! 🧭');
});