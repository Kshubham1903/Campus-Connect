const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  message: { type: String },
  meta: { type: Object },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
