import { getUserByApiKey } from '../db/index.js';

export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  const user = getUserByApiKey(apiKey);

  if (!user) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.user = user;
  next();
}

export function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'tv_';
  for (let i = 0; i < 29; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
