// // backend/routes/chat.js
// const express = require('express');
// const router = express.Router();
// const Chat = require('../models/Chat');

// // Create (or return existing) chat between two users
// router.post('/create', async (req, res) => {
//   try {
//     const { fromUser, toUser } = req.body;

//     if (!fromUser || !toUser) {
//       return res.status(400).json({ message: "fromUser and toUser are required" });
//     }

//     // Find existing chat with both participants
//     let chat = await Chat.findOne({
//       participants: { $all: [fromUser, toUser] }
//     });

//     if (!chat) {
//       chat = await Chat.create({
//         participants: [fromUser, toUser]
//       });
//     }

//     return res.status(200).json({ message: "Chat created", chat });
//   } catch (error) {
//     console.error("Chat creation error:", error);
//     return res.status(500).json({ message: "Failed to create chat" });
//   }
// });

// module.exports = router;



// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models — adjust the paths if your models folder is different
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Middleware & helpers — ensure these exist in your project
// auth should set req.user.id (or adjust below to match your auth middleware)
const auth = require('../middleware/auth');
// normalizeUserForClient should return a safe user object (ensure it preserves avatarUrl)
const { normalizeUserForClient } = require('../utils/normalizeUser');

// Helper: convert relative avatar path to absolute URL
function ensureFullAvatarUrl(req, userObj) {
  if (!userObj) return userObj;
  if (!userObj.avatarUrl) return userObj;
  const val = userObj.avatarUrl;
  if (typeof val !== 'string') return userObj;
  if (val.startsWith('http://') || val.startsWith('https://')) return userObj;
  const full = `${req.protocol}://${req.get('host')}${val}`;
  return { ...userObj, avatarUrl: full };
}

/**
 * GET /api/chat/    -> list chats for current user
 * Note: this route is mounted at /api/chat in server.js
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // find chats where this user is a participant
    const chats = await Chat.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .lean();

    const formatted = await Promise.all(chats.map(async (c) => {
      // pick partner id (the other participant)
      const partnerId = (c.participants || []).find(p => String(p) !== String(userId));
      let partner = null;
      if (partnerId) {
        partner = await User.findById(partnerId)
          .select('name email tags avatarUrl profileVisibility profileType enrollmentYear graduationYear')
          .lean();
        if (partner) {
          partner = normalizeUserForClient(partner);
          partner = ensureFullAvatarUrl(req, partner);
        }
      }

      const lastMsg = await Message.findOne({ chatId: c._id }).sort({ createdAt: -1 }).lean();
      const lastMessage = lastMsg ? {
        text: lastMsg.text,
        senderId: lastMsg.senderId,
        createdAt: lastMsg.createdAt
      } : null;

      return {
        _id: c._id,
        partner: partner || null,
        lastMessage,
        updatedAt: c.lastMessageAt || c.updatedAt || c.createdAt
      };
    }));

    return res.json({ chats: formatted });
  } catch (err) {
    console.error('GET /api/chat err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/chat/:chatId/messages
 * Returns messages for a chat and the partner info
 */
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat id' });
    }

    const chat = await Chat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // ensure user is a participant
    const isParticipant = (chat.participants || []).some(p => String(p) === String(userId));
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

    const partnerId = (chat.participants || []).find(p => String(p) !== String(userId));
    let partner = null;
    if (partnerId) {
      partner = await User.findById(partnerId)
        .select('name email tags avatarUrl profileVisibility profileType enrollmentYear graduationYear')
        .lean();
      if (partner) {
        partner = normalizeUserForClient(partner);
        partner = ensureFullAvatarUrl(req, partner);
      }
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();

    return res.json({
      chatId,
      partner: partner || null,
      messages: messages || []
    });
  } catch (err) {
    console.error('GET /api/chat/:chatId/messages err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * POST /api/chat/create
 * Body: { fromUser, toUser }
 * Creates or returns existing chat and returns partner info
 */
router.post('/create', auth, async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) return res.status(400).json({ error: 'fromUser and toUser required' });

    // find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [fromUser, toUser] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [fromUser, toUser]
      });
    }

    // populate partner info for response
    const fullChat = await Chat.findById(chat._id).lean();
    const partnerId = (fullChat.participants || []).find(p => String(p) !== String(req.user.id));
    let partner = null;
    if (partnerId) {
      partner = await User.findById(partnerId)
        .select('name email tags avatarUrl profileVisibility profileType enrollmentYear graduationYear')
        .lean();
      if (partner) {
        partner = normalizeUserForClient(partner);
        partner = ensureFullAvatarUrl(req, partner);
      }
    }

    return res.status(200).json({ message: 'Chat created', chat: fullChat, partner: partner || null });
  } catch (err) {
    console.error('POST /api/chat/create err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
