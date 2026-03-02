import { insertUsageRecords } from '../db/index.js';

export async function handlePush(req, res) {
  const { records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'records must be an array' });
  }

  if (records.length === 0) {
    return res.status(400).json({ error: 'records cannot be empty' });
  }

  // Validate record structure
  for (const record of records) {
    if (!record.model || !record.bucketStart || !record.source) {
      return res.status(400).json({
        error: 'Each record must have model, bucketStart, and source'
      });
    }
  }

  try {
    insertUsageRecords(req.user.id, records);

    res.json({
      success: true,
      processed: records.length,
      message: `Successfully uploaded ${records.length} records`
    });
  } catch (error) {
    console.error('Push error:', error);
    res.status(500).json({ error: 'Failed to store records' });
  }
}
