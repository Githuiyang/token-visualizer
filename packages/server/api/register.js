import { registerUser } from '../db/index.js';

export function handleRegister(req, res) {
  const { email, nickname, organization, show_on_leaderboard } = req.body;

  // Validate inputs
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: 'Nickname is required' });
  }

  if (nickname.length > 30) {
    return res.status(400).json({ error: 'Nickname must be 30 characters or less' });
  }

  if (organization && organization.length > 50) {
    return res.status(400).json({ error: 'Organization name must be 50 characters or less' });
  }

  try {
    const result = registerUser(
      email.trim(),
      nickname.trim(),
      organization ? organization.trim() : null,
      show_on_leaderboard === true || show_on_leaderboard === 'true'
    );

    res.json({
      success: true,
      apiKey: result.apiKey,
      existing: result.existing,
      userId: result.userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}
