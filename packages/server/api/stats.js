import { getUserStats } from '../db/index.js';

/**
 * Handle /api/stats - Return user's usage statistics
 */
export async function handleStats(req, res) {
  const userId = req.user.id;

  try {
    const stats = await getUserStats(userId);
    res.json({ data: stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
