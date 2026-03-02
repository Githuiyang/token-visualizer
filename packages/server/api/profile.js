import { getUserProfile, updateUserProfile, getUserRank } from '../db/index.js';

export function handleGetProfile(req, res) {
  try {
    const profile = getUserProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get ranking info
    const rankInfo = getUserRank(req.user.id, 'totalTokens');

    res.json({
      success: true,
      data: {
        ...profile,
        rank: rankInfo.rank,
        totalTokens: rankInfo.totalTokens,
        totalCost: rankInfo.totalCost
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export function handleUpdateProfile(req, res) {
  const { nickname, show_email, show_nickname, show_on_leaderboard } = req.body;

  const updates = {};
  if (nickname !== undefined) {
    if (typeof nickname !== 'string' || nickname.length > 30) {
      return res.status(400).json({ error: 'Nickname must be 30 characters or less' });
    }
    updates.nickname = nickname;
  }
  if (show_email !== undefined) {
    updates.show_email = show_email === true || show_email === 'true' ? 1 : 0;
  }
  if (show_nickname !== undefined) {
    updates.show_nickname = show_nickname === true || show_nickname === 'true' ? 1 : 0;
  }
  if (show_on_leaderboard !== undefined) {
    updates.show_on_leaderboard = show_on_leaderboard === true || show_on_leaderboard === 'true' ? 1 : 0;
  }

  try {
    updateUserProfile(req.user.id, updates);
    const profile = getUserProfile(req.user.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
