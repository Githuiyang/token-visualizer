import { getLeaderboard, getGroupLeaderboard } from '../db/index.js';

/**
 * Handle /api/leaderboard - Return public leaderboard
 */
export async function handleLeaderboard(req, res) {
  const sortBy = req.query.sortBy || 'totalTokens';
  const limit = parseInt(req.query.limit) || 100;
  const period = req.query.period || 'all';
  const group = req.query.group; // Group filter

  try {
    let leaderboard;
    if (group) {
      // Get group leaderboard
      leaderboard = await getGroupLeaderboard(group, sortBy, limit, period);
    } else {
      // Get global leaderboard
      leaderboard = await getLeaderboard(sortBy, limit, period);
    }
    res.json({ data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
