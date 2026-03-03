// Share Card Generator
(() => {
  const shareBtn = document.getElementById('share-btn');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareCanvas = document.getElementById('share-canvas');
  const downloadBtn = document.getElementById('download-share');
  const shareTabs = document.querySelectorAll('.share-tab');

  let currentPeriod = 'week';

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareModal.style.display = 'flex';
      generateShareCard();
    });
  }

  shareClose.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
      shareModal.style.display = 'none';
    }
  });

  shareTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shareTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      generateShareCard();
    });
  });

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `tokenviz-${currentPeriod}.png`;
    link.href = shareCanvas.toDataURL('image/png');
    link.click();
  });

  async function generateShareCard() {
    const ctx = shareCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;
    const width = 480;
    const height = 800;

    shareCanvas.width = width * dpr;
    shareCanvas.height = height * dpr;
    shareCanvas.style.width = width + 'px';
    shareCanvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const data = await getStatsData(currentPeriod);
    if (!data) return;

    drawShareCard(ctx, width, height, data);
  }

  async function getStatsData(period) {
    try {
      const apiKey = localStorage.getItem('tokenviz_api_key');
      if (!apiKey) return null;

      const now = new Date();
      let startDate = new Date('2020-01-01');

      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const response = await fetch('/api/stats', {
        headers: { 'X-API-Key': apiKey }
      });

      if (!response.ok) return null;

      const result = await response.json();
      const stats = result.data;
      const byDay = stats.byDay || [];
      const byModel = stats.byModel || [];

      const filteredDays = byDay.filter(d => new Date(d.date) >= startDate);

      // 重新计算各模型的统计数据
      const modelMap = new Map();
      stats.byDayDetail.forEach(d => {
        if (new Date(d.date) >= startDate) {
          const existing = modelMap.get(d.model) || { tokens: 0, cost: 0 };
          modelMap.set(d.model, {
            tokens: existing.tokens + d.total_tokens,
            cost: existing.cost + d.cost
          });
        }
      });

      const models = Array.from(modelMap.entries())
        .map(([name, data]) => ({
          model: name,
          tokens: data.tokens,
          cost: data.cost
        }))
        .filter(m => m.cost > 0 && !m.model.toLowerCase().includes('test'))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);

      const totalTokens = filteredDays.reduce((sum, d) => sum + d.tokens, 0);
      const totalCost = filteredDays.reduce((sum, d) => sum + d.cost, 0);

      return {
        totalTokens,
        totalCost,
        byDay: filteredDays,
        models,
        period
      };
    } catch (error) {
      console.error('Failed to fetch stats for share:', error);
      return null;
    }
  }

  function drawShareCard(ctx, width, height, data) {
    const padding = 40;
    let yPos = padding;

    // Brand
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOKEN VISUALIZER', padding, yPos);
    yPos += 45;

    // Total Tokens
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'normal 42px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(formatTokens(data.totalTokens), width / 2, yPos);
    yPos += 16;

    ctx.fillStyle = '#a8a8a8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('TOTAL TOKENS', width / 2, yPos);
    yPos += 28;

    // Total Cost
    ctx.fillStyle = '#d4a056';
    ctx.font = 'normal 28px Georgia, serif';
    ctx.fillText('$' + data.totalCost.toFixed(2), width / 2, yPos);
    yPos += 14;

    ctx.fillStyle = '#a8a8a8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('ESTIMATED COST', width / 2, yPos);
    yPos += 30;

    // Divider
    ctx.strokeStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(width - padding, yPos);
    ctx.stroke();
    yPos += 20;

    // Model list with active days on the right
    const maxCost = Math.max(...data.models.map(m => m.cost), 1);
    data.models.slice(0, 5).forEach((m, i) => {
      const name = formatModelName(m.model);

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, padding, yPos);

      ctx.fillStyle = '#d4a056';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'right';

      // 右边显示活跃天数（只对第一个模型显示）
      if (i === 0) {
        ctx.fillText(`${formatTokens(m.tokens)} · $${m.cost.toFixed(2)}   ${data.byDay.length} days`, width - padding, yPos);
      } else {
        ctx.fillText(`${formatTokens(m.tokens)} · $${m.cost.toFixed(2)}`, width - padding, yPos);
      }

      // Progress bar
      const barY = yPos + 12;
      const barWidth = width - padding * 2;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(padding, barY, barWidth, 3);
      ctx.fillStyle = '#d4a056';
      ctx.fillRect(padding, barY, barWidth * (m.cost / maxCost), 3);

      yPos += 38;
    });

    yPos += 10;

    // Divider
    ctx.strokeStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(width - padding, yPos);
    ctx.stroke();
    yPos += 20;

    // Period
    const periodNames = { week: 'PAST 7 DAYS', month: 'PAST 30 DAYS', all: 'ALL TIME' };
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(periodNames[data.period], width / 2, yPos);
    yPos += 25;

    // Chart
    const chartHeight = 180;
    const chartWidth = width - padding * 2;

    if (data.period === 'week') {
      drawLineChart(ctx, padding, yPos, chartWidth, chartHeight, data.byDay);
    } else {
      drawHeatmap(ctx, padding, yPos, chartWidth, chartHeight, data.byDay);
    }

    // Footer
    ctx.fillStyle = '#3a3a3a';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('token-visualizer.com', width / 2, height - 20);
  }

  function drawLineChart(ctx, x, y, width, height, byDay) {
    if (!byDay || byDay.length === 0) return;

    const sorted = [...byDay].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxTokens = Math.max(...sorted.map(d => d.tokens), 1);

    ctx.beginPath();
    ctx.strokeStyle = '#d4a056';
    ctx.lineWidth = 2;

    sorted.forEach((d, i) => {
      const px = x + (i / (sorted.length - 1 || 1)) * width;
      const py = y + height - (d.tokens / maxTokens) * height * 0.8 - 10;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Points
    sorted.forEach((d, i) => {
      const px = x + (i / (sorted.length - 1 || 1)) * width;
      const py = y + height - (d.tokens / maxTokens) * height * 0.8 - 10;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#d4a056';
      ctx.fill();
    });

    // Gradient
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, 'rgba(212, 160, 86, 0.2)');
    gradient.addColorStop(1, 'rgba(212, 160, 86, 0)');

    ctx.beginPath();
    sorted.forEach((d, i) => {
      const px = x + (i / (sorted.length - 1 || 1)) * width;
      const py = y + height - (d.tokens / maxTokens) * height * 0.8 - 10;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function drawHeatmap(ctx, x, y, width, height, byDay) {
    if (!byDay || byDay.length === 0) return;

    const sorted = [...byDay].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxTokens = Math.max(...sorted.map(d => d.tokens), 1);
    const colors = ['#1a1a1a', '#3d2a1a', '#5a4528', '#8a6a3d', '#d4a056'];

    // GitHub 风格：小方格，按周排列
    const cellSize = 10;
    const gap = 2;
    const rows = 7;

    // 固定显示100天（约15周）
    const numWeeks = 15;

    // 日期到数据的映射
    const dataMap = {};
    sorted.forEach(d => dataMap[d.date] = d);

    // 计算热力图总宽度，用于居中
    const heatmapWidth = numWeeks * (cellSize + gap);
    const heatmapHeight = rows * (cellSize + gap);

    // 居中起始位置
    const startX = x + (width - heatmapWidth) / 2;

    // 从第一个数据的周日开始
    const firstDate = new Date(sorted[0].date);
    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // 渲染格子
    let current = new Date(startDate);
    for (let week = 0; week < numWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split('T')[0];
        const d = dataMap[dateStr];

        const cx = startX + week * (cellSize + gap);
        const cy = y + day * (cellSize + gap);

        let level = 0;
        if (d) {
          const normalized = d.tokens / maxTokens;
          if (d.tokens > 0) level = 1;
          if (normalized > 0.25) level = 2;
          if (normalized > 0.5) level = 3;
          if (normalized > 0.75) level = 4;
        }

        ctx.fillStyle = colors[level];
        ctx.beginPath();
        ctx.roundRect(cx, cy, cellSize, cellSize, 2);
        ctx.fill();

        current.setDate(current.getDate() + 1);
      }
    }

    // 右边显示活跃天数
    const activeDays = sorted.length;
    const textX = startX + heatmapWidth + 15;
    const textY = y + heatmapHeight / 2 + 4;

    ctx.fillStyle = '#d4a056';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(activeDays.toString(), textX, textY);

    ctx.fillStyle = '#a8a8a8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('days', textX, textY + 16);
  }

  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    return tokens.toLocaleString();
  }

  function formatModelName(model) {
    return model
      .replace('claude-3-5-sonnet', 'Claude 3.5 Sonnet')
      .replace('claude-3-opus', 'Claude 3 Opus')
      .replace('claude-3-haiku', 'Claude 3 Haiku')
      .replace('claude-sonnet-4', 'Claude Sonnet 4')
      .replace('claude-opus-4', 'Claude Opus 4')
      .replace('gpt-4o-mini', 'GPT-4o Mini')
      .replace('gpt-4o', 'GPT-4o')
      .replace('gemini-2.5-pro', 'Gemini 2.5 Pro')
      .replace('glm-4.7', 'GLM-4.7')
      .replace('glm-5', 'GLM-5');
  }
})();
