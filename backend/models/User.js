const mongoose = require('mongoose');

const profileVisibilitySchema = new mongoose.Schema(
{
showEmail: { type: Boolean, default: false },
showEnrollmentYears: { type: Boolean, default: true },
showCareerInfo: { type: Boolean, default: true },
},
{ _id: false }
);

const userSchema = new mongoose.Schema(
{
name: { type: String, trim: true },
email: { type: String, trim: true, unique: true, sparse: true },
passwordHash: { type: String, required: true },

role: {
  type: String,
  enum: ['JUNIOR', 'SENIOR', 'ALUMNI', 'ADMIN'],
  default: 'JUNIOR',
},

profileType: {
  type: String,
  enum: ['STUDENT', 'ALUMNI'],
  default: 'STUDENT',
},

enrollmentYear: { type: Number },
graduationYear: { type: Number },
currentYear: { type: Number },

degree: { type: String, trim: true },
branch: { type: String, trim: true },

bio: { type: String, trim: true },
achievements: { type: String, trim: true },

tags: [{ type: String, trim: true }],

currentCompany: { type: String, trim: true },
jobTitle: { type: String, trim: true },
linkedIn: { type: String, trim: true },
location: { type: String, trim: true },

avatarUrl: { type: String, trim: true },

profileVisibility: {
  type: profileVisibilitySchema,
  default: () => ({}),
},
},
{ timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ name: 1 });

module.exports = mongoose.model('User', userSchema);