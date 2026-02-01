require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Request = require('./models/Request');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const chatRoutes = require('./routes/chat');
const app = express();

// CORS configuration for production
const envOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  ...envOrigins,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    const hasExplicitAllowList = allowedOrigins.length > 0;
    if (!hasExplicitAllowList) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// DB
connectDB();

// ---------- helper functions ----------
function parseAuthHeader(h) {
  if (!h) return null;
  const parts = String(h).trim().split(' ');
  if (parts.length === 1) return parts[0];
  return parts[1];
}

function normalizeUserForClient(u) {
  if (!u) return u;
  const user = { ...u };
  delete user.passwordHash;

  user.avatarUrl = user.avatarUrl
    ? (user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`)
    : null;

  const vis = user.profileVisibility || {
    showEmail: false,
    showEnrollmentYears: true,
    showCareerInfo: true,
  };

  if (!vis.showEmail) delete user.email;
  if (!vis.showEnrollmentYears) {
    delete user.enrollmentYear;
    delete user.graduationYear;
    delete user.currentYear;
  }
  if (!vis.showCareerInfo) {
    delete user.currentCompany;
    delete user.jobTitle;
    delete user.linkedIn;
    delete user.location;
  }

  return user;
}

async function createNotification({
  userId,
  actorId,
  type,
  message,
  meta = {},
  refModel = null,
  refId = null,
}) {
  try {
    const notif = await Notification.create({
      user: userId,
      actor: actorId,
      type,
      message,
      meta,
      refModel,
      refId,
    });

    if (app.locals.io && userId) {
      app.locals.io.to(`user:${String(userId)}`).emit('notification', {
        _id: notif._id,
        type: notif.type,
        message: notif.message,
        meta: notif.meta,
        createdAt: notif.createdAt,
        read: notif.read,
      });
    }
    return notif;
  } catch (err) {
    console.warn('createNotification err', err && (err.stack || err));
    return null;
  }
}

// ---------- auth middleware ----------
function auth(req, res, next) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  const token = parseAuthHeader(h);
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------- AUTH routes ----------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      graduationYear,
      enrollmentYear,
      degree,
      branch,
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email+password required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'email exists' });

    const hash = await bcrypt.hash(password, 10);

    // Derive profileType and role from graduationYear when provided.
    // Enrollment year is assumed to be graduationYear - 4 for a 4-year program.
    const now = new Date();
    const currentYear = now.getFullYear();

    let derivedProfileType = 'STUDENT';
    let derivedRole = 'JUNIOR';

    const gyNum = graduationYear ? Number(graduationYear) : null;
    if (gyNum && !Number.isNaN(gyNum)) {
      // If graduationYear is in the past, treat as alumni
      if (gyNum < currentYear) {
        derivedProfileType = 'ALUMNI';
        derivedRole = 'ALUMNI';
      } else {
        // student: compute year-of-study using enrollmentYear = gy - 4
        const enrollment = gyNum - 4;
        // if current year is before enrollment, treat as student but keep default role
        if (currentYear < enrollment) {
          derivedProfileType = 'STUDENT';
          derivedRole = 'JUNIOR';
        } else if (currentYear > gyNum) {
          // already handled, but guard
          derivedProfileType = 'ALUMNI';
          derivedRole = 'ALUMNI';
        } else {
          const studyYearNumber = currentYear - enrollment + 1;
          // map study year to JUNIOR/SENIOR: 1-2 => JUNIOR, 3-4 => SENIOR
          if (studyYearNumber === 1 || studyYearNumber === 2) {
            derivedRole = 'JUNIOR';
          } else if (studyYearNumber === 3 || studyYearNumber === 4) {
            derivedRole = 'SENIOR';
          }
        }
      }
    }

    const userData = {
      name,
      email,
      passwordHash: hash,
      role: derivedRole,
      profileType: derivedProfileType,
      graduationYear: gyNum || undefined,
      enrollmentYear: enrollmentYear ? Number(enrollmentYear) : (gyNum ? gyNum - 4 : undefined),
      degree,
      branch,
    };

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET);
    res.json({
      token,
      user: normalizeUserForClient(user.toObject ? user.toObject() : user),
    });
  } catch (err) {
    console.error('signup err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET);
    res.json({
      token,
      user: normalizeUserForClient(user.toObject ? user.toObject() : user),
    });
  } catch (err) {
    console.error('login err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: normalizeUserForClient(user) });
  } catch (err) {
    console.error('GET /auth/me', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// ---------- Requests ----------
app.post('/api/requests', auth, async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user.id;

    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return res.status(404).json({ error: 'user not found' });

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(400).json({ error: 'target user not found' });

    if (String(toUserId) === String(fromUserId)) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const existing = await Request.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'PENDING',
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending request to this user' });
    }

    const r = await Request.create({ fromUser: fromUserId, toUser: toUserId, message });

    const notifMsg = `${fromUser.name || fromUser.email || 'A user'} sent you a request`;
    await createNotification({
      userId: toUserId,
      actorId: fromUserId,
      type: 'request',
      message: notifMsg,
      meta: { requestId: r._id },
      refModel: 'Request',
      refId: r._id,
    });

    res.json(r);
  } catch (err) {
    console.error('create request err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/requests', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const incoming = await Request.find({ toUser: userId })
      .populate('fromUser', 'name email')
      .sort({ createdAt: -1 });
    const outgoing = await Request.find({ fromUser: userId })
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ incoming, outgoing });
  } catch (err) {
    console.error('list requests err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// ---------- Replace the /api/requests/:id/respond route with this robust handler ----------
app.post('/api/requests/:id/respond', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    let { action } = req.body; // 'accept' | 'decline'

    console.log('[respond] called', { requestId, action, user: req.user && req.user.id });

    // Basic pre-checks
    if (!req.user || !req.user.id) return res.status(401).json({ error: 'Not authenticated' });
    if (!requestId) return res.status(400).json({ error: 'Missing request id' });

    action = typeof action === 'string' ? action.trim().toLowerCase() : null;
    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action (accept|decline)' });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request id' });
    }

    // Load request document
    const request = await Request.findById(requestId);
    console.log('[respond] found request?', !!request);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Ensure only the recipient can respond
    const recipientId = String(request.toUser || request.to || request.to_user || request.toUserId || '');
    const authUserId = String(req.user.id || req.user._id || req.user);
    if (recipientId !== authUserId) {
      console.warn('[respond] auth mismatch', { recipientId, authUserId });
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }

    // If already responded, forbid re-responding
    if (String(request.status || '').toLowerCase() === 'accepted') {
      return res.status(400).json({ error: 'Request already accepted' });
    }
    if (String(request.status || '').toLowerCase() === 'declined') {
      return res.status(400).json({ error: 'Request already declined' });
    }

    // --- Decline flow (simple) ---
    if (action === 'decline') {
      try {
        request.status = 'DECLINED';
        request.respondedAt = new Date();
        await request.save();
      } catch (err) {
        console.error('[respond][decline] save error', err && (err.stack || err));
        return res.status(500).json({ error: 'Failed to decline request', detail: err.message });
      }

      // Optional: notify requester, best-effort (non-fatal)
      try {
        const responder = await User.findById(request.toUser).select('name email').lean();
        const notifMsg = `${responder?.name || responder?.email || 'A user'} declined your request`;
        await createNotification({
          userId: request.fromUser,
          actorId: request.toUser,
          type: 'request_response',
          message: notifMsg,
          meta: { requestId: request._id },
          refModel: 'Request',
          refId: request._id,
        });
      } catch (notifErr) {
        console.warn('[respond][decline] notification non-fatal err', notifErr && (notifErr.stack || notifErr));
      }

      return res.json({ success: true, request });
    }

    // --- Accept flow ---
    if (action === 'accept') {
      // Create or reuse a chat between the two users.
      let chat = null;
      try {
        // normalize ids
        const fromId = request.fromUser;
        const toId = request.toUser;

        // search for an existing chat in several compatible shapes
        chat = await Chat.findOne({
          $or: [
            { user1: fromId, user2: toId },
            { user1: toId, user2: fromId },
            { participants: { $all: [fromId, toId] } }
          ]
        }).exec();
      } catch (err) {
        console.error('[respond][accept] error when searching chat', err && (err.stack || err));
        return res.status(500).json({ error: 'Error searching for chat', detail: err.message });
      }

      // If not found, create a new chat with defensive checks
      if (!chat) {
        try {
          const chatData = {};
          const schemaPaths = Chat.schema && Chat.schema.paths ? Object.keys(Chat.schema.paths) : [];

          if (schemaPaths.includes('user1') && schemaPaths.includes('user2')) {
            chatData.user1 = request.fromUser;
            chatData.user2 = request.toUser;
          } else if (schemaPaths.includes('participants')) {
            chatData.participants = [request.fromUser, request.toUser];
          } else {
            // fallback: include both
            chatData.user1 = request.fromUser;
            chatData.user2 = request.toUser;
            chatData.participants = [request.fromUser, request.toUser];
          }

          // create chat
          chat = await Chat.create(chatData);
        } catch (createErr) {
          console.error('[respond][accept] chat create error', createErr && (createErr.stack || createErr));
          return res.status(500).json({ error: 'Failed to create chat', detail: createErr.message });
        }
      }

      // Attach chat to request and mark accepted
      try {
        request.chat = chat._id;
        request.status = 'ACCEPTED';
        request.respondedAt = new Date();
        await request.save();
      } catch (err) {
        console.error('[respond][accept] request save error', err && (err.stack || err));
        return res.status(500).json({ error: 'Failed to update request', detail: err.message });
      }

      // Try to notify the requester (non-fatal)
      try {
        const responder = await User.findById(request.toUser).select('name email').lean();
        const notifMsg = `${responder?.name || responder?.email || 'A user'} accepted your request`;
        await createNotification({
          userId: request.fromUser,
          actorId: request.toUser,
          type: 'request_response',
          message: notifMsg,
          meta: { requestId: request._id, chatId: chat._id },
          refModel: 'Chat',
          refId: chat._id,
        });

        // Emit socket event if io available - wrap in try/catch
        try {
          const io = req.app && req.app.locals && req.app.locals.io;
          if (io && io.emit) {
            io.emit('requestAccepted', {
              requestId: request._id,
              from: request.fromUser,
              to: request.toUser,
              chatId: chat._id,
              message: notifMsg,
            });
          }
        } catch (emitErr) {
          console.warn('[respond][accept] socket emit non-fatal err', emitErr && (emitErr.stack || emitErr));
        }
      } catch (notifyErr) {
        console.warn('[respond][accept] notify non-fatal err', notifyErr && (notifyErr.stack || notifyErr));
      }

      return res.json({ success: true, request, chatId: chat._id });
    }

    // Should not get here
    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    // Log full stack for debugging; in production you may want to remove stack from response
    console.error('FATAL /api/requests/:id/respond err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error', message: err.message, stack: err.stack });
  }
});


app.delete('/api/requests/:id', auth, async (req, res) => {
  try {
    const reqId = req.params.id;
    const requestDoc = await Request.findById(reqId).lean();
    if (!requestDoc) return res.status(404).json({ error: 'Request not found' });

    const callerId = req.user.id;
    const isRecipient = String(requestDoc.toUser) === String(callerId);
    const isSender = String(requestDoc.fromUser) === String(callerId);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isRecipient && !isSender && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }

    if (requestDoc.chat) {
      try {
        await Chat.findByIdAndDelete(requestDoc.chat);
      } catch (e) {
        console.warn('Failed to delete chat for declined request:', e);
      }
    }

    await Request.findByIdAndDelete(reqId);
    return res.json({ success: true, id: reqId });
  } catch (err) {
    console.error('DELETE /api/requests/:id err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});

// ---------- Chat & messages ----------
// Replace your existing GET /api/chats/:id/messages handler with this block
app.get('/api/chats/:id/messages', auth, async (req, res) => {
  try {
    const chatId = req.params.id;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat id' });
    }

    // load chat (lean for plain object)
    const chat = await Chat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ error: 'chat not found' });

    const userId = String(req.user.id);

    // membership check (works with user1/user2 or participants array)
    const isMember =
      (chat.user1 && String(chat.user1) === userId) ||
      (chat.user2 && String(chat.user2) === userId) ||
      (Array.isArray(chat.participants) && chat.participants.map(String).includes(userId));

    if (!isMember) {
      return res.status(403).json({ error: 'not allowed' });
    }

    // determine partner id (the other participant)
    let partnerId = null;
    if (Array.isArray(chat.participants) && chat.participants.length) {
      partnerId = chat.participants.find(p => String(p) !== userId) || null;
    } else if (chat.user1 && chat.user2) {
      partnerId = String(chat.user1) === userId ? chat.user2 : chat.user1;
    }

    // load partner and normalize
    let partner = null;
    if (partnerId) {
      partner = await User.findById(partnerId)
        .select('name email tags avatarUrl profileVisibility profileType enrollmentYear graduationYear')
        .lean();

      if (partner) {
        // reuse your normalize function so visibility rules apply
        partner = normalizeUserForClient(partner);

        // make avatarUrl absolute so browser can load it regardless of origin
        if (partner.avatarUrl && typeof partner.avatarUrl === 'string' && !partner.avatarUrl.startsWith('http')) {
          partner.avatarUrl = `${req.protocol}://${req.get('host')}${partner.avatarUrl}`;
        }
      }
    }

    // fetch messages ordered oldest->newest
    const msgs = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();

    return res.json({
      chatId,
      partner: partner || null,
      messages: msgs || []
    });
  } catch (err) {
    console.error('GET /api/chats/:id/messages err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});


app.get('/api/chats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({
      $or: [{ user1: userId }, { user2: userId }, { participants: userId }]
    }).sort({ lastMessageAt: -1 }).lean();

    const result = await Promise.all(chats.map(async (c) => {
      const partnerId = String(c.user1) === String(userId) ? c.user2 : c.user1;
      const partner = await User.findById(partnerId)
        .select('name email tags avatarUrl profileVisibility profileType enrollmentYear graduationYear')
        .lean();
      const lastMsg = await Message.findOne({ chatId: c._id }).sort({ createdAt: -1 }).lean();
      return {
        _id: c._id,
        partner: partner ? normalizeUserForClient(partner) : null,
        lastMessage: lastMsg ? {
          text: lastMsg.text,
          senderId: lastMsg.senderId,
          createdAt: lastMsg.createdAt
        } : null,
        updatedAt: c.lastMessageAt || c.updatedAt || c.createdAt
      };
    }));

    res.json({ chats: result });
  } catch (err) {
    console.error('GET /api/chats err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/chats/:id/messages', auth, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { text } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'chat not found' });

    const userId = req.user.id;
    if (String(chat.user1) !== String(userId) && String(chat.user2) !== String(userId) && !(chat.participants && chat.participants.map(String).includes(String(userId)))) {
      return res.status(403).json({ error: 'not allowed' });
    }

    const msg = await Message.create({ chatId, senderId: userId, text });

    try {
      chat.lastMessageAt = msg.createdAt || new Date();
      chat.lastMessage = {
        text: msg.text,
        senderId: msg.senderId,
        createdAt: msg.createdAt
      };
      await chat.save();
    } catch (e) {
      console.warn('failed to update chat after HTTP message', e && (e.stack || e));
    }

    if (app.locals.io) {
      app.locals.io.to(`chat:${chatId}`).emit('newMessage', {
        _id: msg._id,
        chatId,
        senderId: userId,
        text: msg.text,
        createdAt: msg.createdAt
      });

      try {
        const recipient = String(chat.user1) === String(userId)
          ? String(chat.user2)
          : String(chat.user1);
        await createNotification({
          userId: recipient,
          actorId: userId,
          type: 'message',
          message: msg.text.slice(0, 160),
          meta: { chatId },
          refModel: 'Chat',
          refId: chat._id
        });
      } catch (e) {
        console.warn('failed to create/emit message notification from http', e && (e.stack || e));
      }
    }

    res.json({ message: msg });
  } catch (err) {
    console.error('post message err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// ---------- Notifications ----------
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifs = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ notifications: notifs });
  } catch (err) {
    console.error('list notifications err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;
    const n = await Notification.findById(notifId);
    if (!n) return res.status(404).json({ error: 'not found' });
    if (String(n.user) !== String(userId)) return res.status(403).json({ error: 'not allowed' });
    n.read = true;
    await n.save();
    res.json({ notification: n });
  } catch (err) {
    console.error('mark notif read err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// ---------- Profiles & users update ----------
app.put('/api/users/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, bio, tags,
      enrollmentYear, graduationYear, degree, branch, currentYear, achievements,
      currentCompany, jobTitle, linkedIn, location,
      profileType, profileVisibility
    } = req.body;

    let tagsArr = [];
    if (Array.isArray(tags)) {
      tagsArr = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const update = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof bio === 'string') update.bio = bio.trim();
    if (tagsArr.length) update.tags = tagsArr;
    if (tags && tagsArr.length === 0) update.tags = [];

    if (typeof enrollmentYear !== 'undefined') update.enrollmentYear = Number(enrollmentYear);
    if (typeof graduationYear !== 'undefined') update.graduationYear = Number(graduationYear);
    if (typeof degree !== 'undefined') update.degree = degree;
    if (typeof branch !== 'undefined') update.branch = branch;
    if (typeof currentYear !== 'undefined') update.currentYear = Number(currentYear);
    if (typeof achievements !== 'undefined') update.achievements = achievements;

    if (typeof currentCompany !== 'undefined') update.currentCompany = currentCompany;
    if (typeof jobTitle !== 'undefined') update.jobTitle = jobTitle;
    if (typeof linkedIn !== 'undefined') update.linkedIn = linkedIn;
    if (typeof location !== 'undefined') update.location = location;

    if (profileType && (profileType === 'STUDENT' || profileType === 'ALUMNI')) {
      update.profileType = profileType;
    }
    if (profileVisibility) update.profileVisibility = profileVisibility;

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: normalizeUserForClient(user.toObject ? user.toObject() : user) });
  } catch (err) {
    console.error('PUT /api/users/me err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// filterable profiles
app.get('/api/profiles', auth, async (req, res) => {
  try {
    const { profileType, tag, name, page = 1, limit = 50 } = req.query;
    const q = {};
    if (profileType && (profileType === 'STUDENT' || profileType === 'ALUMNI')) q.profileType = profileType;
    if (tag) q.tags = tag;
    if (name) q.name = new RegExp(name, 'i');

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, parseInt(limit, 10));
    const skip = (p - 1) * l;

    const users = await User.find(q)
      .select('-passwordHash')
      .sort({ name: 1 })
      .skip(skip)
      .limit(l)
      .lean();

    const transformed = users.map(u => normalizeUserForClient(u));
    res.json({ profiles: transformed, count: transformed.length });
  } catch (err) {
    console.error('GET /api/profiles err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// seniors list
app.get('/api/seniors', async (req, res) => {
  try {
    const { type, page = 1, limit = 100 } = req.query;
    if (type === 'ALUMNI') {
      const p = Math.max(1, parseInt(page, 10));
      const l = Math.max(1, parseInt(limit, 10));
      const skip = (p - 1) * l;
      const alumni = await User.find({ profileType: 'ALUMNI' })
        .select('-passwordHash')
        .sort({ name: 1 })
        .skip(skip)
        .limit(l)
        .lean();
      const normalized = alumni.map(a => normalizeUserForClient(a));
      return res.json(normalized);
    }

    const users = await User.find({})
      .select('-passwordHash')
      .sort({ name: 1 })
      .lean();
    const normalized = users.map(u => normalizeUserForClient(u));
    return res.json(normalized);
  } catch (err) {
    console.error('GET /api/seniors err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
});

// ---------- avatar uploads ----------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

app.post('/api/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user.id;
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarPath },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: normalizeUserForClient(user.toObject ? user.toObject() : user),
      avatarUrl: avatarPath
    });
  } catch (err) {
    console.error('avatar upload err', err && (err.stack || err));
    res.status(500).json({ error: 'server error' });
  }
});

// ---------- HTTP server + socket.io ----------
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});
app.locals.io = io;

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  try {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);
  } catch (e) {
    console.warn('join user room err', e && (e.stack || e));
  }

  socket.on('joinChat', ({ chatId }) => {
    if (!chatId) return;
    const room = `chat:${chatId}`;
    socket.join(room);
    io.to(room).emit('userJoined', { userId: socket.user.id });
  });

  socket.on('sendMessage', async ({ chatId, text }) => {
    try {
      if (!chatId || !text) return;
      const chat = await Chat.findById(chatId);
      if (!chat) return socket.emit('error', { message: 'Chat not found' });

      const senderId = socket.user.id;
      if (
        String(chat.user1) !== String(senderId) &&
        String(chat.user2) !== String(senderId) &&
        !(chat.participants && chat.participants.map(String).includes(String(senderId)))
      ) {
        return socket.emit('error', { message: 'Not a chat participant' });
      }

      const msg = await Message.create({ chatId, senderId, text });

      io.to(`chat:${chatId}`).emit('newMessage', {
        _id: msg._id,
        chatId,
        senderId,
        text: msg.text,
        createdAt: msg.createdAt
      });

      try {
        chat.lastMessageAt = msg.createdAt || new Date();
        chat.lastMessage = {
          text: msg.text,
          senderId: msg.senderId,
          createdAt: msg.createdAt
        };
        await chat.save();
      } catch (e) {
        console.warn('failed to update chat after socket message', e && (e.stack || e));
      }

      try {
        const recipient =
          String(chat.user1) === String(senderId)
            ? String(chat.user2)
            : String(chat.user1);
        await createNotification({
          userId: recipient,
          actorId: senderId,
          type: 'message',
          message: text.slice(0, 160),
          meta: { chatId },
          refModel: 'Chat',
          refId: chat._id
        });
      } catch (e) {
        console.warn('failed to create/send message notification', e && (e.stack || e));
      }
    } catch (err) {
      console.error('socket sendMessage err', err && (err.stack || err));
      socket.emit('error', { message: 'send failed' });
    }
  });

  socket.on('disconnect', () => {
    // optional cleanup
  });
});
app.use('/api/chat', chatRoutes);
// ---------- start server ----------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
