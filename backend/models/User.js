const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["JUNIOR", "SENIOR", "ADMIN"], default: "JUNIOR" },
  verified: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
