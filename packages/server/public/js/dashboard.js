// Token Visualizer Dashboard
(() => {
  // State
  let API_KEY = null;

  // Get API key from URL param first, then localStorage
  function getApiKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');
    if (urlKey) {
      localStorage.setItem('tokenVizApiKey', urlKey);
      return urlKey;
    }
    return localStorage.getItem('tokenVizApiKey');
  }

  // Save API key
  function saveApiKey(key) {
    localStorage.setItem('tokenVizApiKey', key);
    API_KEY = key;
  }

  // Clear API key
  function clearApiKey() {
    localStorage.removeItem('tokenVizApiKey');
    API_KEY = null;
  }

  // Show API key input modal
  function showApiKeyModal(message = 'Enter your API key:') {
    const existingModal = document.getElementById('api-key-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'api-key-modal';
    modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#161b22;padding:32px;border-radius:12px;border:1px solid #30363d;min-width:320px;">
          <h2 style="margin:0 0 8px 0;color:#c9d1d9;">API Key Required</h2>
          <p style="margin:0 0 16px 0;color:#8b949e;font-size:14px;">${message}</p>
          <input type="text" id="api-key-input" placeholder="tv_xxxxx..." style="width:100%;padding:12px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:14px;box-sizing:border-box;">
          <button id="api-key-submit" style="margin-top:16px;width:100%;padding:12px;background:#238636;border:none;border-radius:6px;color:white;font-size:14px;font-weight:600;cursor:pointer;">Submit</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('api-key-input');
    const submit = document.getElementById('api-key-submit');

    submit.addEventListener('click', () => {
      const key = input.value.trim();
      if (key) {
        saveApiKey(key);
        document.getElementById('api-key-modal').remove();
        loadDashboard();
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submit.click();
    });

    input.focus();
  }

  // Show error message
  function showError(message) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;">
        <p style="color:#f85149;font-size:16px;">${message}</p>
        <button onclick="location.reload()" style="padding:12px 24px;background:#238636;border:none;border-radius:6px;color:white;cursor:pointer;font-size:14px;">Retry</button>
      </div>
    `;
  }

  // Load stats from API
  async function loadStats() {
    const response = await fetch('/api/stats', {
      headers: { 'X-API-Key': API_KEY }
    });

    if (response.status === 401 || response.status === 403) {
      clearApiKey();
      showApiKeyModal('Invalid API key. Please enter a valid key.');
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }

  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
  }

  function formatCost(cost) {
    return '$' + (cost || 0).toFixed(2);
  }

  function renderModelList(byModel) {
    const container = document.getElementById('model-list');
    if (!container) return;

    const filtered = byModel.filter(m => m.total_tokens > 0);

    container.innerHTML = filtered.map(m => `
      <div class="model-item">
        <div class="model-name">${m.displayName || m.model}</div>
        <div class="model-stats">
          <span>${formatTokens(m.total_tokens)}</span>
          <span>${formatCost(m.cost)}</span>
        </div>
      </div>
    `).join('');
  }

  function renderPieChart(byModel) {
    const container = document.getElementById('pie-chart');
    if (!container) return;

    const filtered = byModel.filter(m => m.total_tokens > 0);

    if (filtered.length === 0) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8b949e;">No data</div>';
      return;
    }

    const chart = echarts.init(container);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (params) => {
          const m = filtered[params.dataIndex];
          return `${m.displayName || m.model}: ${formatCost(m.cost)} (${params.percent}%)`;
        }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '55%'],
        data: filtered.map((m, i) => ({
          value: m.cost,
          name: m.displayName || m.model,
          itemStyle: {
            color: ['#238636', '#58a6ff', '#bc8cff', '#d29922', '#f85149'][i % 5]
          }
        })),
        label: { show: false }
      }]
    };

    chart.setOption(option);
  }

  function renderLineChart(byDay) {
    const container = document.getElementById('line-chart');
    if (!container) return;

    if (!byDay || byDay.length === 0) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8b949e;">No data</div>';
      return;
    }

    const chart = echarts.init(container);

    const option = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: byDay.map(d => d.date),
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { color: '#8b949e' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { color: '#8b949e', formatter: formatTokens },
        splitLine: { lineStyle: { color: '#30363d', type: 'dashed' } }
      },
      series: [{
        type: 'line',
        data: byDay.map(d => d.tokens),
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(35, 134, 54, 0.3)' },
            { offset: 1, color: 'rgba(35, 134, 54, 0)' }
          ])
        },
        lineStyle: { color: '#238636' },
        itemStyle: { color: '#238636' }
      }]
    };

    chart.setOption(option);
  }

  function renderHeatmap(byDay) {
    const container = document.getElementById('heatmap');
    if (!container) return;

    container.innerHTML = '';

    if (!byDay || byDay.length === 0) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8b949e;">No data</div>';
      return;
    }

    const maxTokens = Math.max(...byDay.map(d => d.tokens), 1);
    const grid = document.createElement('div');
    grid.style.cssText = 'display: flex; gap: 3px; overflow-x: auto; padding: 10px 0;';

    const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

    byDay.forEach(day => {
      const cell = document.createElement('div');
      const normalized = day.tokens / maxTokens;
      let level = 0;
      if (normalized > 0) level = 1;
      if (normalized > 0.25) level = 2;
      if (normalized > 0.5) level = 3;
      if (normalized > 0.75) level = 4;

      cell.style.cssText = `
        width: 14px; height: 14px; border-radius: 2px;
        background: ${colors[level]};
        flex-shrink: 0;
        cursor: pointer;
      `;
      cell.title = `${day.date}: ${formatTokens(day.tokens)} · $${day.cost.toFixed(2)}`;

      grid.appendChild(cell);
    });

    container.appendChild(grid);
  }

  function renderDailyBreakdown(byDayDetail) {
    const container = document.getElementById('daily-breakdown');
    if (!container) return;

    const filtered = byDayDetail.filter(d => d.total_tokens > 0);
    const grouped = {};
    filtered.forEach(d => {
      if (!grouped[d.date]) grouped[d.date] = [];
      grouped[d.date].push(d);
    });

    if (Object.keys(grouped).length === 0) {
      container.innerHTML = '<div style="color:#8b949e;">No data</div>';
      return;
    }

    container.innerHTML = Object.entries(grouped).map(([date, items]) => `
      <div class="day-group">
        <div class="day-header">
          <span class="day-date">${date}</span>
          <span class="day-total">${formatTokens(items.reduce((sum, i) => sum + i.total_tokens, 0))} · $${items.reduce((sum, i) => sum + i.cost, 0).toFixed(2)}</span>
        </div>
        <div class="day-items">
          ${items.map(item => `
            <div class="day-item">
              <div class="item-main">
                <span class="item-model">${item.displayName || item.model}</span>
                <span class="item-source">${item.sourceName || item.source}</span>
              </div>
              <div class="item-stats">
                <span class="item-tokens">${formatTokens(item.total_tokens)}</span>
                <span class="item-cost">$${item.cost.toFixed(4)}</span>
              </div>
              <div class="item-project">${item.project}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  async function loadDashboard() {
    const stats = await loadStats();
    if (!stats) return; // API key was invalid, modal shown

    // Safely update summary
    const totalTokensEl = document.getElementById('total-tokens');
    const totalCostEl = document.getElementById('total-cost');
    const daysActiveEl = document.getElementById('days-active');
    const modelCountEl = document.getElementById('model-count');

    if (totalTokensEl) totalTokensEl.textContent = formatTokens(stats?.total?.total_tokens);
    if (totalCostEl) totalCostEl.textContent = formatCost(stats?.total?.total_cost);
    if (daysActiveEl) daysActiveEl.textContent = stats?.total?.days_active || 0;
    if (modelCountEl) {
      const nonZeroModels = (stats?.byModel || []).filter(m => m.total_tokens > 0);
      modelCountEl.textContent = nonZeroModels.length || 0;
    }

    // Render charts
    renderPieChart(stats?.byModel || []);
    renderLineChart(stats?.byDay || []);
    renderHeatmap(stats?.byDay || []);
    renderModelList(stats?.byModel || []);
    renderDailyBreakdown(stats?.byDayDetail || []);
  }

  // Initialize
  async function init() {
    API_KEY = getApiKey();

    if (!API_KEY) {
      showApiKeyModal();
      return;
    }

    try {
      await loadDashboard();
    } catch (error) {
      console.error('Dashboard error:', error);
      showError('Failed to load dashboard. Please try again.');
    }
  }

  init();
})();
