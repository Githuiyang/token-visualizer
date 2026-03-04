import { getLeaderboard, getGroupLeaderboard } from '../db/index.js';

/**
 * Handle /api/leaderboard - Return public leaderboard
 */
export async function handleLeaderboard(req, res) {
  const sortBy = req.query.sortBy || 'totalTokens';
  const limit = parseInt(req.query.limit) || 100;
  const period = req.query.period || 'all';
  const group = req.query.group; // Group filter

  // Debug logging
  console.log('[leaderboard] queryParams:', { sortBy, limit, period, group });

  try {
    let leaderboard;
    if (group) {
      // Get group leaderboard
      leaderboard = await getGroupLeaderboard(group, sortBy, limit, period);
    } else {
      // Get global leaderboard
      leaderboard = await getLeaderboard(sortBy, limit, period);
    }
    console.log('[leaderboard] result count:', leaderboard.length);
    if (leaderboard.length > 0) {
      console.log('[leaderboard] first user:', leaderboard[0].nickname, 'daysActive:', leaderboard[0].daysActive);
    }
    res.json({ data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
