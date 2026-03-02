import { getUserStats } from '../db/index.js';

export function handleStats(req, res) {
  const stats = getUserStats(req.user.id);

  res.json({
    success: true,
    data: stats
  });
}
