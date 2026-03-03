import { insertUsageRecords, getUserStats } from '../db/index.js';

/**
 * Handle /api/push - Accept usage records and store in database
 */
export async function handlePush(req, res) {
  const { records } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array required' });
  }

  try {
    await insertUsageRecords(userId, records);
    res.json({
      success: true,
      received: records.length,
      message: `Successfully stored ${records.length} records`
    });
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).json({ error: 'Failed to store records' });
  }
}
