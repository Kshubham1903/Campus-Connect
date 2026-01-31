// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

module.exports = function auth(req, res, next) {
  try {
    const h = req.headers.authorization || req.headers.Authorization;
    if (!h) return res.status(401).json({ error: 'No token' });

    const parts = String(h).trim().split(' ');
    const token = parts.length === 1 ? parts[0] : parts[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    let data;
    try {
      data = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // attach payload to req.user (keep same shape as your server.js)
    req.user = data;
    return next();
  } catch (err) {
    console.error('auth middleware err', err && (err.stack || err));
    return res.status(500).json({ error: 'server error' });
  }
};
