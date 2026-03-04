import { generateEmailHash, getUserByEmailHash } from '../db/index.js';

/**
 * Handle /api/check-email - Check if email is already registered
 * Returns user info if exists, null otherwise
 */
export async function handleCheckEmail(req, res) {
  const { email } = req.query;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const emailHash = generateEmailHash(email);
    const user = await getUserByEmailHash(emailHash);

    if (user) {
      // Return user info (excluding sensitive data)
      return res.json({
        exists: true,
        nickname: user.nickname,
        show_on_leaderboard: user.show_on_leaderboard === 1
      });
    }

    res.json({ exists: false });
  } catch (err) {
    // On database errors, just return exists: false to allow registration to proceed
    // The registration endpoint will handle the actual user creation/lookup
    console.error('Email check error (allowing registration to proceed):', err.message);
    res.json({ exists: false });
  }
}
