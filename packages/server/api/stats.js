import { getUserStats } from '../db/index.js';
import { getModelPricing, formatModelName, formatSourceName } from '../config/models.js';

export function handleStats(req, res) {
  const stats = getUserStats(req.user.id);

  // Add pricing info to each model
  const byModelWithPricing = stats.byModel.map(m => ({
    ...m,
    displayName: formatModelName(m.model),
    pricing: getModelPricing(m.model),
  }));

  // Format detailed daily data
  const byDayDetailFormatted = stats.byDayDetail?.map(d => ({
    ...d,
    displayName: formatModelName(d.model),
    sourceName: formatSourceName(d.source),
    project: d.project || 'unknown',
    pricing: getModelPricing(d.model),
  })) || [];

  res.json({
    success: true,
    data: {
      ...stats,
      byModel: byModelWithPricing,
      byDayDetail: byDayDetailFormatted,
    }
  });
}
