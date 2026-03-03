import { getUserByApiKey } from '../db/index.js';
import crypto from 'node:crypto';

/**
 * Generate API key
 */
export function generateApiKey() {
  const bytes = crypto.randomBytes(16);
  return 'tv_' + bytes.toString('hex');
}

/**
 * Authentication middleware - validates X-API-Key header
 */
export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  getUserByApiKey(apiKey).then(user => {
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    req.user = user;
    next();
  }).catch(err => {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  });
}
