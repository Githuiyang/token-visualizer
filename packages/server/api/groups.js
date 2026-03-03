import { addUserToGroup, removeUserFromGroup, getUserGroups } from '../db/index.js';

/**
 * Handle POST /api/groups/join - Join a group
 */
export async function handleJoinGroup(req, res) {
  const userId = req.user.id;
  const { group_name } = req.body;

  if (!group_name) {
    return res.status(400).json({ error: 'group_name required' });
  }

  try {
    await addUserToGroup(userId, group_name);
    res.json({
      success: true,
      message: `Joined group "${group_name}"`
    });
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ error: 'Failed to join group' });
  }
}

/**
 * Handle POST /api/groups/leave - Leave a group
 */
export async function handleLeaveGroup(req, res) {
  const userId = req.user.id;
  const { group_name } = req.body;

  if (!group_name) {
    return res.status(400).json({ error: 'group_name required' });
  }

  try {
    await removeUserFromGroup(userId, group_name);
    res.json({
      success: true,
      message: `Left group "${group_name}"`
    });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ error: 'Failed to leave group' });
  }
}

/**
 * Handle GET /api/groups - Get user's groups
 */
export async function handleGetUserGroups(req, res) {
  const userId = req.user.id;

  try {
    const groups = await getUserGroups(userId);
    res.json({ data: { groups } });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
}
