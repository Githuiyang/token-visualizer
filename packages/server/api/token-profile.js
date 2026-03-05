/**
 * Token Profile API endpoints
 */

import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';

/**
 * Handle POST /api/token-profile - Upload token profile
 */
export async function handleUploadTokenProfile(req, res) {
  const userId = req.user.id;
  const profileData = req.body;

  if (!profileData.version || !profileData.stats) {
    return res.status(400).json({ error: 'Invalid profile data' });
  }

  try {
    const db = await getDb();
    const profileId = nanoid(10);

    const existing = await db.get(
      'SELECT id, profile_id FROM token_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing) {
      await db.run(
        'UPDATE token_profiles SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(profileData), userId]
      );
      return res.json({ success: true, profileId: existing.profile_id });
    }

    await db.run(
      'INSERT INTO token_profiles (user_id, profile_id, data) VALUES (?, ?, ?)',
      [userId, profileId, JSON.stringify(profileData)]
    );

    res.json({ success: true, profileId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
}

/**
 * Handle GET /api/token-profile - Get own profile
 */
export async function handleGetTokenProfile(req, res) {
  const userId = req.user.id;

  try {
    const db = await getDb();
    const profile = await db.get(
      'SELECT * FROM token_profiles WHERE user_id = ?',
      [userId]
    );

    if (!profile) {
      return res.status(404).json({ error: 'No profile found' });
    }

    const data = JSON.parse(profile.data);
    data.profileId = profile.profile_id;
    data.isPublic = profile.is_public === 1;

    res.json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * Handle GET /api/token-profile/:profileId - Get public profile
 */
export async function handleGetPublicTokenProfile(req, res) {
  const { profileId } = req.params;

  try {
    const db = await getDb();
    const profile = await db.get(
      'SELECT tp.*, u.nickname, u.show_nickname FROM token_profiles tp JOIN users u ON tp.user_id = u.id WHERE tp.profile_id = ?',
      [profileId]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.is_public) {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const data = JSON.parse(profile.data);
    data.profileId = profile.profile_id;
    data.owner = profile.show_nickname && profile.nickname ? { nickname: profile.nickname } : { nickname: 'Anonymous' };

    res.json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * Handle PUT /api/token-profile - Update profile privacy
 */
export async function handleUpdateTokenProfile(req, res) {
  const userId = req.user.id;
  const { isPublic, projects } = req.body;

  try {
    const db = await getDb();

    if (typeof isPublic === 'boolean') {
      await db.run(
        'UPDATE token_profiles SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [isPublic ? 1 : 0, userId]
      );
    }

    if (projects && Array.isArray(projects)) {
      const profile = await db.get('SELECT data FROM token_profiles WHERE user_id = ?', [userId]);
      if (profile) {
        const data = JSON.parse(profile.data);
        for (const update of projects) {
          const project = data.projects.find(p => p.name === update.name);
          if (project) {
            if (update.alias !== undefined) project.alias = update.alias;
            if (update.visible !== undefined) project.visible = update.visible;
          }
        }
        await db.run('UPDATE token_profiles SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [JSON.stringify(data), userId]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
