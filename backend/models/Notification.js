const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
},
actor: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
},
type: { type: String, trim: true }, // e.g. 'request', 'request-accepted', 'message'
message: { type: String, trim: true },
meta: { type: mongoose.Schema.Types.Mixed },
refModel: { type: String, trim: true },
refId: { type: mongoose.Schema.Types.ObjectId },
read: { type: Boolean, default: false },
},
{ timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);