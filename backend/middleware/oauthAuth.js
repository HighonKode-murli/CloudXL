import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware for OAuth initiation - stores user ID in session
export async function requireAuthForOAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    let token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    
    // Also check query parameter for token
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ error: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    // Store user ID in session for OAuth callback
    req.session.userId = user._id.toString();
    req.user = { _id: user._id };
    next();
  } catch (error) {
    console.error('OAuth Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Middleware for OAuth callback - uses session to get user ID
export async function requireAuthFromSession(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'No active session' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    req.user = { _id: user._id };
    next();
  } catch (error) {
    console.error('Session Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
