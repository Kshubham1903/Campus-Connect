// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db'); // keeps your existing db connection file
const User = require('./models/User');
const Request = require('./models/Request');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// start DB (connectDB defined in config/db.js)
connectDB();

// ----------------- auth middleware -----------------
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });
  const token = h.split(' ')[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data; // data should include { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ----------------- AUTH routes -----------------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email+password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'email exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash, role: role || 'JUNIOR' });
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error('signup err', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error('login err', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ----------------- Seniors list -----------------
app.get('/api/seniors', async (req, res) => {
  try {
    // return all users who have role 'SENIOR'
    // adjust query if you only want verified: { role: 'SENIOR', verified: true }
    const seniors = await User.find({ role: 'SENIOR' })
      .select('-passwordHash')      // don't return password
      .sort({ name: 1 })
      .lean();

    // Normalize avatarUrl to have leading slash if stored differently (optional)
    const normalized = seniors.map(s => ({
      ...s,
      avatarUrl: s.avatarUrl ? (s.avatarUrl.startsWith('/') ? s.avatarUrl : `/${s.avatarUrl}`) : null
    }));

    return res.json(normalized); // returns array directly
  } catch (err) {
    console.error('GET /api/seniors err', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// ----------------- Requests -----------------
app.post('/api/requests', auth, async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user.id;
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return res.status(404).json({ error: 'user not found' });
    if (fromUser.role !== 'JUNIOR') return res.status(403).json({ error: 'only juniors can send requests' });
    const toUser = await User.findById(toUserId);
    if (!toUser || toUser.role !== 'SENIOR') return res.status(400).json({ error: 'target not a senior' });
    const r = await Request.create({ fromUser: fromUserId, toUser: toUserId, message });
    // (Optional) notify senior via email/push here
    res.json(r);
  } catch (err) {
    console.error('create request err', err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'user not found' });
    if (user.role === 'SENIOR') {
      const incoming = await Request.find({ toUser: user._id }).populate('fromUser', 'name email').sort({ createdAt: -1 });
      return res.json({ incoming });
    } else {
      const outgoing = await Request.find({ fromUser: user._id }).populate('toUser', 'name email').sort({ createdAt: -1 });
      return res.json({ outgoing });
    }
  } catch (err) {
    console.error('list requests err', err);
    res.status(500).json({ error: 'server error' });
  }
});

// accept/decline request — creates (or finds) chat and saves chat id in request
app.post('/api/requests/:id/respond', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { action } = req.body; // 'accept' | 'decline'
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ error: 'request not found' });

    // only the senior who is the target can respond
    if (String(request.toUser) !== req.user.id) return res.status(403).json({ error: 'not allowed' });

    request.status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    request.respondedAt = new Date();

    if (action === 'accept') {
      // find or create chat
      let chat = await Chat.findOne({
        $or: [
          { user1: request.fromUser, user2: request.toUser },
          { user1: request.toUser, user2: request.fromUser }
        ]
      });
      if (!chat) chat = await Chat.create({ user1: request.fromUser, user2: request.toUser });
      request.chat = chat._id; // store chat id in request for junior visibility
      await request.save();
      return res.json({ request, chatId: chat._id });
    } else {
      await request.save();
      return res.json({ request });
    }
  } catch (err) {
    console.error('respond err', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ----------------- Chat message HTTP endpoints -----------------
// fetch chat messages
app.get('/api/chats/:id/messages', auth, async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'chat not found' });
    // ensure participant
    const userId = req.user.id;
    if (String(chat.user1) !== userId && String(chat.user2) !== userId) return res.status(403).json({ error: 'not allowed' });
    const msgs = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
    res.json({ messages: msgs });
  } catch (err) {
    console.error('get messages err', err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/auth/me  -> returns current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('GET /auth/me', err);
    res.status(500).json({ error: 'server error' });
  }
});


// GET /api/chats  - list chats for signed-in user (with partner info and last message)
app.get('/api/chats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // find chats where user is either user1 or user2
    const chats = await Chat.find({
      $or: [{ user1: userId }, { user2: userId }]
    }).sort({ lastMessageAt: -1 }).lean();

    // load partner user and last message for each chat
    const result = await Promise.all(chats.map(async (c) => {
      const partnerId = String(c.user1) === String(userId) ? c.user2 : c.user1;
      const partner = await User.findById(partnerId).select('name email tags');
      // find last message (if exists)
      const lastMsg = await Message.findOne({ chatId: c._id }).sort({ createdAt: -1 }).lean();
      return {
        _id: c._id,
        partner: partner ? { _id: partner._id, name: partner.name, email: partner.email } : null,
        lastMessage: lastMsg ? { text: lastMsg.text, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt } : null,
        updatedAt: c.lastMessageAt || c.updatedAt || c.createdAt
      };
    }));

    res.json({ chats: result });
  } catch (err) {
    console.error('GET /api/chats err', err);
    res.status(500).json({ error: 'server error' });
  }
});


// post message via HTTP (fallback)
app.post('/api/chats/:id/messages', auth, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { text } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: 'chat not found' });
    const userId = req.user.id;
    if (String(chat.user1) !== userId && String(chat.user2) !== userId) return res.status(403).json({ error: 'not allowed' });
    const msg = await Message.create({ chatId, senderId: userId, text });
    // emit will be handled by socket.io below - but since HTTP route doesn't have io, we will broadcast from app locals
    if (app.locals.io) {
      app.locals.io.to(`chat:${chatId}`).emit('newMessage', {
        _id: msg._id,
        chatId,
        senderId: userId,
        text: msg.text,
        createdAt: msg.createdAt
      });
    }
    res.json({ message: msg });
  } catch (err) {
    console.error('post message err', err);
    res.status(500).json({ error: 'server error' });
  }
});

// ----------------- create HTTP server and attach socket.io -----------------
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' } // restrict in production
});

// expose io to routes (so HTTP message route can emit)
app.locals.io = io;

// socket authentication (reads token from handshake.auth.token)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload; // { id, role }
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id, 'user', socket.user?.id);

  socket.on('joinChat', ({ chatId }) => {
    if (!chatId) return;
    const room = `chat:${chatId}`;
    socket.join(room);
    // optional presence
    io.to(room).emit('userJoined', { userId: socket.user.id });
  });

  socket.on('sendMessage', async ({ chatId, text }) => {
    try {
      if (!chatId || !text) return;
      const chat = await Chat.findById(chatId);
      if (!chat) return socket.emit('error', { message: 'Chat not found' });
      const senderId = socket.user.id;
      if (String(chat.user1) !== senderId && String(chat.user2) !== senderId) {
        return socket.emit('error', { message: 'Not a chat participant' });
      }
      const msg = await Message.create({ chatId, senderId, text });
      // broadcast
      io.to(`chat:${chatId}`).emit('newMessage', {
        _id: msg._id,
        chatId,
        senderId,
        text: msg.text,
        createdAt: msg.createdAt
      });
      chat.lastMessageAt = new Date();
      await chat.save();
    } catch (err) {
      console.error('socket sendMessage err', err);
      socket.emit('error', { message: 'send failed' });
    }
  });

  socket.on('disconnect', () => {
    // optional: console.log('disconnect', socket.id)
  });
});



// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // keep unique name: timestamp + original name
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// POST /api/users/me/avatar  - upload avatar for current logged-in user
app.post('/api/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user.id;
    // build public URL for client access
    const avatarPath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(userId, { avatarUrl: avatarPath }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user, avatarUrl: avatarPath });
  } catch (err) {
    console.error('avatar upload err', err);
    res.status(500).json({ error: 'server error' });
  }
});


//
// Update current user's profile
app.put('/api/users/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, tags } = req.body;

    // normalize tags: accept array or comma-separated string
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
    if (tags && tagsArr.length === 0) update.tags = []; // allow clearing tags

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('PUT /api/users/me err', err);
    return res.status(500).json({ error: 'server error' });
  }
});


// start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
