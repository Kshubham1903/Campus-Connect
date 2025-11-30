// backend/models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: String,
  status: { type: String, enum: ['PENDING','ACCEPTED','DECLINED','CANCELLED'], default: 'PENDING' },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }, // <-- optional chat id
  respondedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
