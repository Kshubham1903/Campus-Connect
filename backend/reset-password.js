// backend/reset-password.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User_reset', userSchema);

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3] || 'test123';
  if (!email) {
    console.error('Usage: node reset-password.js user@example.com [newPassword]');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const hash = await bcrypt.hash(newPassword, 10);
  const r = await User.updateOne({ email }, { $set: { passwordHash: hash, updatedAt: new Date() } });
  console.log('Update result:', r);
  await mongoose.disconnect();
  console.log(`Password for ${email} set to '${newPassword}' (hashed).`);
}

run().catch(err => { console.error(err); process.exit(99); });
