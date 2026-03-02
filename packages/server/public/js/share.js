// Share Card Generator
(() => {
  const shareBtn = document.getElementById('share-btn');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareCanvas = document.getElementById('share-canvas');
  const downloadBtn = document.getElementById('download-share');
  const shareTabs = document.querySelectorAll('.share-tab');

  let currentPeriod = 'week';
  let shareData = null;

  // Store stats data globally for share to access
  window.shareStatsData = null;

  // Open share modal
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareModal.style.display = 'flex';
      generateShareCard();
    });
  }

  // Close modal
  shareClose.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  // Close on overlay click
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
      shareModal.style.display = 'none';
    }
  });

  // Period tabs
  shareTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shareTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      generateShareCard();
    });
  });

  // Download button
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `tokenviz-${currentPeriod}.png`;
    link.href = shareCanvas.toDataURL('image/png');
    link.click();
  });

  async function generateShareCard() {
    const ctx = shareCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;

    // Better dimensions (4:3 aspect ratio)
    const width = 480;
    const height = 640;

    shareCanvas.width = width * dpr;
    shareCanvas.height = height * dpr;
    shareCanvas.style.width = width + 'px';
    shareCanvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Polyfill for roundRect
    if (!ctx.roundRect) {
      ctx.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }

    // Background - deep black
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Get stats data
    const data = await getStatsData(currentPeriod);
    if (!data) return;

    // Draw content
    drawShareCard(ctx, width, height, data);
  }

  async function getStatsData(period) {
    try {
      const apiKey = localStorage.getItem('tokenviz_api_key');
      if (!apiKey) return null;

      // Calculate date range
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

      // Filter by period
      let byModel = stats.byModel || [];
      const byDay = stats.byDay || [];

      if (period !== 'all') {
        const filteredDays = byDay.filter(d => new Date(d.date) >= startDate);
        // Recalculate model stats for period
        const modelMap = new Map();
        filteredDays.forEach(day => {
          const model = stats.byDayDetail.find(m => m.date === day.date);
          if (model) {
            const existing = modelMap.get(model.model) || { tokens: 0, cost: 0 };
            modelMap.set(model.model, {
              tokens: existing.tokens + model.total_tokens,
              cost: existing.cost + model.cost
            });
          }
        });
        byModel = Array.from(modelMap.entries()).map(([name, data]) => ({
          model: name,
          total_tokens: data.tokens,
          cost: data.cost
        })).sort((a, b) => b.cost - a.cost);
      }

      const totalTokens = byModel.reduce((sum, m) => sum + (m.total_tokens || 0), 0);
      const totalCost = byModel.reduce((sum, m) => sum + (m.cost || 0), 0);

      return {
        totalTokens,
        totalCost,
        byModel: byModel.slice(0, 5), // Top 5
        period
      };
    } catch (error) {
      console.error('Failed to fetch stats for share:', error);
      return null;
    }
  }

  function drawShareCard(ctx, width, height, data) {
    const padding = 48;
    let yPos = padding;

    // Brand
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOKEN VISUALIZER', padding, yPos);
    yPos += 72;

    // Total Tokens - Large number (serif, elegant)
    const formattedTokens = formatTokens(data.totalTokens);
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'normal 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(formattedTokens, width / 2, yPos);
    yPos += 20;

    // Label
    ctx.fillStyle = '#a8a8a8';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('TOTAL TOKENS', width / 2, yPos);
    yPos += 72;

    // Thin divider
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(width - padding, yPos);
    ctx.stroke();
    yPos += 48;

    // Period indicator
    const periodNames = { week: 'PAST 7 DAYS', month: 'PAST 30 DAYS', all: 'ALL TIME' };
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(periodNames[data.period], width / 2, yPos);
    yPos += 60;

    // Model list
    const modelList = data.byModel && data.byModel.length > 0 ? data.byModel : [];

    if (modelList.length === 0) {
      ctx.fillStyle = '#6a6a6a';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data for this period', width / 2, height / 2);
      return;
    }

    const maxCost = Math.max(...modelList.map(m => m.cost || 0));

    // Reserve space for footer
    const footerSpace = 40;
    const availableHeight = height - yPos - footerSpace - padding;
    const itemHeight = Math.min(60, availableHeight / modelList.length);

    modelList.forEach((model, index) => {
      const cost = model.cost || 0;
      const modelDisplayName = formatModelName(model.model);

      // Model name
      ctx.fillStyle = '#f5f5f5';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(modelDisplayName, padding, yPos);

      // Cost (right aligned)
      ctx.fillStyle = '#a8a8a8';
      ctx.font = '13px SF Mono, Monaco, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('$' + cost.toFixed(2), width - padding, yPos);

      // Progress bar
      const barY = yPos + 18;
      const barWidth = width - padding * 2;

      // Background line
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(padding, barY, barWidth, 1);

      // Fill line
      if (cost > 0 && maxCost > 0) {
        const percentage = Math.min(cost / maxCost, 1);
        ctx.fillStyle = '#d4a056';
        ctx.fillRect(padding, barY, barWidth * percentage, 1);
      }

      yPos += itemHeight;
    });

    // Footer
    ctx.fillStyle = '#3a3a3a';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('token-visualizer.com', width / 2, height - padding + 4);
  }

  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000000) return (tokens / 1000000000).toFixed(1) + 'B';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toLocaleString();
  }

  function formatModelName(model) {
    // Shorten model names for card
    const name = model
      .replace('claude-', '', '')
      .replace('gpt-', '', '')
      .replace('-sonnet', 'S', '')
      .replace('-haiku', 'H', '')
      .replace('-opus', 'O', '')
      .toUpperCase();
    return name.length > 18 ? name.substring(0, 15) + '...' : name;
  }

  // Hook into dashboard data
  const originalLoadDashboard = window.loadDashboard;
  if (typeof originalLoadDashboard === 'function') {
    window.loadDashboard = async function() {
      const result = await originalLoadDashboard.apply(this, arguments);
      // Store data for share
      window.shareStatsData = result;
      return result;
    };
  }
})();
