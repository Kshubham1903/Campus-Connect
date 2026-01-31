const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
{
chatId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Chat',
required: true,
},
senderId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
},
text: { type: String, trim: true, required: true },
},
{ timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);