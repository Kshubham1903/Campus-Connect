// backend/check-password.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String
}, { collection: 'users', strict: false });

const User = mongoose.model('User_check', userSchema);

async function run() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error('Usage: node check-password.js user@example.com passwordToTest');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error('User not found for email:', email);
    process.exit(2);
  }
  console.log('Found user:', user.email);
  console.log('Stored passwordHash field exists?', !!user.passwordHash);
  const match = await bcrypt.compare(password, user.passwordHash || '');
  console.log('bcrypt.compare result:', match);
  await mongoose.disconnect();
  process.exit(match ? 0 : 3);
}

run().catch(err => { console.error(err); process.exit(99); });
