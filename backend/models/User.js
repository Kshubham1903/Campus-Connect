// backend/models/User.js  (example)
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  role: { type: String, enum: ['JUNIOR','SENIOR'], default: 'JUNIOR' },
  tags: [String],
  bio: String,
  avatarUrl: String, // <--- new field
  // ... any other fields
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
