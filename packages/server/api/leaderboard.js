import { getLeaderboard } from '../db/index.js';

/**
 * Handle /api/leaderboard - Return public leaderboard
 */
export async function handleLeaderboard(req, res) {
  const sortBy = req.query.sortBy || 'totalTokens';
  const limit = parseInt(req.query.limit) || 100;
  const period = req.query.period || 'all';

  try {
    const leaderboard = await getLeaderboard(sortBy, limit, period);
    res.json({ data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
