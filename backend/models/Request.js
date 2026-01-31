const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
{
fromUser: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
},
toUser: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
},
message: { type: String, trim: true },
status: {
type: String,
enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
default: 'PENDING',
},
chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
respondedAt: Date,
},
{ timestamps: true }
);

requestSchema.index({ toUser: 1, createdAt: -1 });
requestSchema.index({ fromUser: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);