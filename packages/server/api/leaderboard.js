import { getLeaderboard, getUserRank, getOrganizationLeaderboard, getUserRankInOrganization } from '../db/index.js';

export function handleLeaderboard(req, res) {
  const sortBy = req.query.sortBy || 'totalTokens';
  const limit = parseInt(req.query.limit) || 100;
  const period = req.query.period || 'all';
  const userId = req.query.userId;
  const organization = req.query.organization || null;

  // Validate sortBy
  if (!['totalTokens', 'totalCost'].includes(sortBy)) {
    return res.status(400).json({ error: 'Invalid sortBy parameter' });
  }

  // Validate period
  if (!['all', 'week', 'month'].includes(period)) {
    return res.status(400).json({ error: 'Invalid period parameter' });
  }

  // Validate limit
  if (limit < 1 || limit > 500) {
    return res.status(400).json({ error: 'Limit must be between 1 and 500' });
  }

  try {
    const leaderboard = organization
      ? getOrganizationLeaderboard(organization, sortBy, period)
      : getLeaderboard(sortBy, limit, period);

    let currentUser = null;

    if (userId && organization) {
      try {
        currentUser = getUserRankInOrganization(parseInt(userId), organization, sortBy);
      } catch (e) {
        // User might not have data yet, ignore
      }
    } else if (userId) {
      try {
        currentUser = getUserRank(parseInt(userId), sortBy);
      } catch (e) {
        // User might not have data yet, ignore
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        currentUser,
        sortBy,
        period,
        organization
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
