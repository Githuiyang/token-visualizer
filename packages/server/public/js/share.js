// Share Card Generator - Redesigned Layout
(() => {
  const shareBtn = document.getElementById('share-btn');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareCanvas = document.getElementById('share-canvas');
  const downloadBtn = document.getElementById('download-share');
  const shareTabs = document.querySelectorAll('.share-tab');

  let currentPeriod = 'all';

  // Colors matching the page theme
  const COLORS = {
    bg: '#0a0a0a',
    bgSecondary: '#111111',
    textPrimary: '#f5f5f5',
    textSecondary: '#a8a8a8',
    textTertiary: '#6a6a6a',
    accent: '#d4a056',
    accentHover: '#e8b86a',
    border: '#3a3a3a',
    borderLight: '#1f1f1f',
    glow: 'rgba(212, 160, 86, 0.3)'
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
    // Portrait ratio (540x960)
    const width = 540;
    const height = 960;

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

    // ===== 顶部：核心数据 =====
    // 品牌名（小）
    ctx.fillStyle = COLORS.textTertiary;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOKEN VISUALIZER', 40, yPos);
    yPos += 50;

    // 超大发光 Token 数字
    const tokenText = formatTokens(data.totalTokens);
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = 'bold 56px -apple-system, sans-serif';
    ctx.textAlign = 'center';

    // 添加发光效果
    ctx.shadowColor = COLORS.glow;
    ctx.shadowBlur = 20;
    ctx.fillText(tokenText, width / 2, yPos);
    ctx.shadowBlur = 0;

    yPos += 25;

    // "Total Tokens" 标签
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL TOKENS', width / 2, yPos);
    yPos += 15;

    // 右上角分享图标
    drawShareIcon(ctx, width - 50, 60);

    // 总金额显示
    yPos += 30;
    const costText = `$${data.totalCost.toFixed(2)}`;
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 32px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(costText, width / 2, yPos);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('Total Cost', width / 2, yPos + 20);

    // ===== 中控：时间筛选 Tab =====
    yPos += 70;
    const tabs = [
      { key: 'week', label: '近7日' },
      { key: 'month', label: '近30日' },
      { key: 'all', label: '全部' }
    ];

    const tabWidth = 100;
    const tabHeight = 36;
    const tabSpacing = 12;
    const tabsTotalWidth = tabs.length * tabWidth + (tabs.length - 1) * tabSpacing;
    let tabX = (width - tabsTotalWidth) / 2;

    tabs.forEach(tab => {
      const isActive = data.period === tab.key;

      // 胶囊背景
      if (isActive) {
        // 发光效果
        ctx.shadowColor = COLORS.glow;
        ctx.shadowBlur = 15;

        ctx.fillStyle = COLORS.accent;
        roundRect(ctx, tabX, yPos, tabWidth, tabHeight, 18);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0a0a0a';
        ctx.font = '600 14px -apple-system, sans-serif';
      } else {
        ctx.fillStyle = COLORS.bgSecondary;
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        roundRect(ctx, tabX, yPos, tabWidth, tabHeight, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = COLORS.textTertiary;
        ctx.font = '500 14px -apple-system, sans-serif';
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tab.label, tabX + tabWidth / 2, yPos + tabHeight / 2);

      tabX += tabWidth + tabSpacing;
    });

    // ===== 底部：模型消耗榜单 =====
    yPos += 60;

    // 标题
    ctx.fillStyle = COLORS.textTertiary;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('模型消耗排行', 40, yPos);

    yPos += 25;

    const maxCost = Math.max(...data.models.map(m => m.cost), 1);

    data.models.forEach((model, index) => {
      const rowHeight = 52;
      const yPosStart = yPos;

      // 左侧：模型名称
      ctx.fillStyle = COLORS.textPrimary;
      ctx.font = '500 15px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const displayName = formatModelName(model.model);
      ctx.fillText(displayName, 40, yPosStart + 20);

      // 中间：发光进度条
      const barX = 40;
      const barY = yPosStart + 30;
      const barWidth = width - 160;
      const barHeight = 6;

      // 背景槽
      ctx.fillStyle = COLORS.bgSecondary;
      roundRect(ctx, barX, barY, barWidth, barHeight, 3);
      ctx.fill();

      // 进度（发光）
      const progress = model.cost / maxCost;
      const progressWidth = barWidth * progress;

      if (progress > 0) {
        // 发光
        ctx.shadowColor = COLORS.glow;
        ctx.shadowBlur = 10;

        // 创建渐变
        const gradient = ctx.createLinearGradient(barX, 0, barX + progressWidth, 0);
        gradient.addColorStop(0, COLORS.accent);
        gradient.addColorStop(1, COLORS.accentHover);

        ctx.fillStyle = gradient;
        roundRect(ctx, barX, barY, Math.max(progressWidth, barHeight), barHeight, 3);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      // 右侧：金额
      ctx.fillStyle = COLORS.accent;
      ctx.font = '600 16px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${model.cost.toFixed(2)}`, width - 40, yPosStart + 20);

      // Token 数量（小字）
      ctx.fillStyle = COLORS.textTertiary;
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText(formatTokens(model.tokens), width - 40, yPosStart + 36);

      yPos += rowHeight;
    });

    // 底部装饰
    yPos += 20;

    // 活跃天数
    ctx.fillStyle = COLORS.borderLight;
    ctx.fillRect(40, yPos, width - 80, 1);

    yPos += 30;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.activeDays} 活跃天数 · ${new Date().toLocaleDateString('zh-CN')}`, width / 2, yPos);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawShareIcon(ctx, x, y) {
    const size = 20;

    ctx.save();
    ctx.translate(x - size / 2, y - size / 2);

    // 分享图标（简单的箭头+方块）
    ctx.fillStyle = COLORS.textTertiary;
    ctx.fillRect(2, 8, 8, 8);
    ctx.fillRect(10, 2, 8, 8);

    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(14, 6);
    ctx.lineTo(10, 10);
    ctx.lineTo(14, 14);
    ctx.fill();

    ctx.restore();
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
