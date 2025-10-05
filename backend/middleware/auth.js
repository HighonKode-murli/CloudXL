import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    let token = auth.startsWith('Bearer ') ? auth.substring(7) : null;

    // For OAuth routes, also check query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ error: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' });

    req.user = { _id: user._id, role: user.role, email: user.email };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
