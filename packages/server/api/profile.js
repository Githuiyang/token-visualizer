import { getUserProfile, updateUserProfile } from '../db/index.js';

/**
 * Handle GET /api/profile - Return user profile
 */
export async function handleGetProfile(req, res) {
  const userId = req.user.id;

  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * Handle PATCH /api/profile - Update user profile
 */
export async function handleUpdateProfile(req, res) {
  const userId = req.user.id;
  const updates = req.body;

  try {
    await updateUserProfile(userId, updates);
    const profile = await getUserProfile(userId);
    res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
