const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // use the URL from env (fall back to localhost)
    const url = process.env.MONGO_URL || 'mongodb://localhost:27017/mentorchat';
    await mongoose.connect(url); // no extra options for mongoose v7+
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connect error', err);
    process.exit(1);
  }
};

module.exports = connectDB;
