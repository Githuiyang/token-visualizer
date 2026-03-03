import { registerUser } from '../db/index.js';

/**
 * Handle /api/register - Register new user or return existing API key
 */
export async function handleRegister(req, res) {
  const { email, nickname, show_on_leaderboard } = req.body;

  if (!email || !nickname) {
    return res.status(400).json({ error: 'email and nickname required' });
  }

  try {
    const result = await registerUser(email, nickname, null, show_on_leaderboard || false);

    if (result.existing) {
      return res.json({
        existing: true,
        apiKey: result.apiKey,
        message: 'Account already exists'
      });
    }

    res.json({
      existing: false,
      apiKey: result.apiKey,
      message: 'API key generated successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
