// Share Card Generator - Minimal & Premium Design
(() => {
  const shareBtn = document.getElementById('share-btn');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareCanvas = document.getElementById('share-canvas');
  const downloadBtn = document.getElementById('download-share');
  const shareTabs = document.querySelectorAll('.share-tab');

  let currentPeriod = 'all';

  // Minimal color palette - inspired by Claude Code design
  const COLORS = {
    bg: '#000000',                    // Pure black
    bgSecondary: '#0a0a0a',           // Very dark gray
    border: '#1a1a1a',                // Subtle border
    borderLight: '#333333',           // Lighter border for active states
    textPrimary: '#e8e8e8',           // Soft white
    textSecondary: '#8a8a8a',          // Muted gray
    textTertiary: '#4a4a4a',           // Dark gray for labels
    accent: '#c9a661',                // Warm ochre/sand (similar to Claude Code)
    accentSubtle: '#8a7040',           // Desaturated accent
  };

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
    const width = 540;
    const height = 920;

    shareCanvas.width = width * dpr;
    shareCanvas.height = height * dpr;
    shareCanvas.style.width = width + 'px';
    shareCanvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLORS.bg;
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

      const filteredDays = byDay.filter(d => new Date(d.date) >= startDate);

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
        models,
        activeDays: filteredDays.length,
        period
      };
    } catch (error) {
      console.error('Failed to fetch stats for share:', error);
      return null;
    }
  }

  function drawShareCard(ctx, width, height, data) {
    let yPos = 60;

    // ===== 品牌 - 极简 =====
    ctx.fillStyle = COLORS.textTertiary;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOKEN VISUALIZER', 50, yPos);
    yPos += 70;

    // ===== Token 总量 - Serif 大标题 =====
    const tokenText = formatTokens(data.totalTokens);
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = '48px Georgia, serif';  // 使用衬线体
    ctx.textAlign = 'center';
    ctx.fillText(tokenText, width / 2, yPos);
    yPos += 18;

    // 极简标签
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('TOTAL TOKENS', width / 2, yPos);
    ctx.letterSpacing = '0';
    yPos += 45;

    // ===== 总金额 =====
    const costText = `$${data.totalCost.toFixed(2)}`;
    ctx.fillStyle = COLORS.accent;
    ctx.font = '32px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(costText, width / 2, yPos);
    yPos += 55;

    // ===== 模型消耗榜单 - 极简列表 =====
    const maxCost = Math.max(...data.models.map(m => m.cost), 1);

    data.models.forEach((model, index) => {
      const rowHeight = 48;
      const yPosStart = yPos;

      // 左侧：模型名称
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = '500 13px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const displayName = formatModelName(model.model);
      ctx.fillText(displayName, 50, yPosStart + 18);

      // 中间：极简进度条（细线）
      const barX = 50;
      const barY = yPosStart + 28;
      const barWidth = width - 160;
      const barHeight = 1;

      // 背景线
      ctx.fillStyle = COLORS.border;
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // 进度线
      const progress = model.cost / maxCost;
      if (progress > 0) {
        ctx.fillStyle = COLORS.accent;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      }

      // 右侧：金额（对齐）
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '400 13px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${model.cost.toFixed(2)}`, width - 50, yPosStart + 18);

      yPos += rowHeight;
    });

    // ===== 底部 - 极简装饰 =====
    yPos += 30;

    // 分隔线
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(50, yPos, width - 100, 1);
    yPos += 25;

    // 活跃天数
    ctx.fillStyle = COLORS.textTertiary;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.activeDays} 活跃天数`, width / 2, yPos);
  }

  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toLocaleString();
  }

  function formatModelName(model) {
    return model
      .replace('claude-opus-4', 'Claude Opus 4')
      .replace('claude-sonnet-4', 'Claude Sonnet 4')
      .replace('claude-3-5-sonnet', 'Claude 3.5 Sonnet')
      .replace('claude-3-opus', 'Claude 3 Opus')
      .replace('claude-3-haiku', 'Claude 3 Haiku')
      .replace('claude-sonnet-4-20250514', 'Claude Sonnet 4')
      .replace('gpt-4o-mini', 'GPT-4o Mini')
      .replace('gpt-4o', 'GPT-4o')
      .replace('gemini-2.5-pro', 'Gemini 2.5 Pro')
      .replace('glm-5', 'GLM-5')
      .replace('glm-4.7', 'GLM-4.7')
      .replace('glm-4.6', 'GLM-4.6')
      .replace('glm-4.5-air', 'GLM-4.5 Air')
      .replace('deepseek-chat', 'DeepSeek')
      .replace('deepseek-coder', 'DeepSeek Coder');
  }
})();
