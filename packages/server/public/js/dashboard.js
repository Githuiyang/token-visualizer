// Check for API key in localStorage or query param
let API_KEY = localStorage.getItem('tokenVizApiKey');
const urlParams = new URLSearchParams(window.location.search);
if (!API_KEY && urlParams.has('key')) {
  API_KEY = urlParams.get('key');
  localStorage.setItem('tokenVizApiKey', API_KEY);
}

// Show input modal if no API key
if (!API_KEY) {
  const modal = document.createElement('div');
  modal.id = 'api-key-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:#161b22;padding:32px;border-radius:12px;border:1px solid #30363d;min-width:320px;">
        <h2 style="margin:0 0 16px 0;color:#c9d1d9;">Enter API Key</h2>
        <input type="text" id="api-key-input" placeholder="tv_xxxxx..." style="width:100%;padding:12px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:14px;box-sizing:border-box;">
        <button id="api-key-submit" style="margin-top:16px;width:100%;padding:12px;background:#238636;border:none;border-radius:6px;color:white;font-size:14px;font-weight:600;cursor:pointer;">Submit</button>
        <p style="margin-top:16px;font-size:12px;color:#8b949e;">Run <code style="background:#0d1117;padding:2px 6px;border-radius:4px;">token-viz config --show</code> to get your key</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('api-key-submit').addEventListener('click', () => {
    const input = document.getElementById('api-key-input').value.trim();
    if (input) {
      localStorage.setItem('tokenVizApiKey', input);
      API_KEY = input;
      document.getElementById('api-key-modal').remove();
      init();
    }
  });

  document.getElementById('api-key-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('api-key-submit').click();
    }
  });

  document.getElementById('api-key-input').focus();
} else {
  init();
}

async function loadStats() {
  const response = await fetch('/api/stats', {
    headers: { 'X-API-Key': API_KEY }
  });

  if (!response.ok) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;">
        <p style="color:#f85149;">Failed to load stats. Invalid API key.</p>
        <button onclick="localStorage.removeItem('tokenVizApiKey');location.reload()" style="padding:12px 24px;background:#238636;border:none;border-radius:6px;color:white;cursor:pointer;">Reset Key</button>
      </div>
    `;
    return;
  }

  const { data } = await response.json();
  return data;
}

function formatTokens(tokens) {
  if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
  if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
  return tokens?.toString() || '0';
}

function formatCost(cost) {
  return '$' + (cost || 0).toFixed(2);
}

function formatPrice(price) {
  if (!price) return 'N/A';
  const parts = [];
  if (price.input) parts.push(`In: $${price.input}/M`);
  if (price.output) parts.push(`Out: $${price.output}/M`);
  if (price.cached) parts.push(`Cached: $${price.cached}/M`);
  return parts.join(', ');
}

function renderModelList(byModel) {
  const container = document.getElementById('model-list');
  if (!container) return;

  // Filter out models with 0 tokens
  const filtered = byModel.filter(m => m.total_tokens > 0);

  const html = filtered.map(m => `
    <div class="model-item">
      <div class="model-name">${m.displayName || m.model}</div>
      <div class="model-stats">
        <span>${formatTokens(m.total_tokens)}</span>
        <span>${formatCost(m.cost)}</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

function renderPieChart(byModel) {
  const chart = echarts.init(document.getElementById('pie-chart'));

  // Filter out models with 0 tokens
  const filtered = (byModel || []).filter(m => m.total_tokens > 0);

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
  const chart = echarts.init(document.getElementById('line-chart'));

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: (byDay || []).map(d => d.date),
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
      data: (byDay || []).map(d => d.tokens),
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
  container.innerHTML = ''; // Clear previous content

  const maxTokens = Math.max(...(byDay || []).map(d => d.tokens), 1);

  const grid = document.createElement('div');
  grid.style.cssText = 'display: flex; gap: 3px; overflow-x: auto; padding: 10px 0;';

  const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

  (byDay || []).forEach(day => {
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

  // Filter out items with 0 tokens and group by date
  const filtered = byDayDetail.filter(d => d.total_tokens > 0);
  const grouped = {};
  filtered.forEach(d => {
    if (!grouped[d.date]) {
      grouped[d.date] = [];
    }
    grouped[d.date].push(d);
  });

  const html = Object.entries(grouped).map(([date, items]) => `
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

  container.innerHTML = html;
}

async function init() {
  const stats = await loadStats();

  // Update summary - use model count from non-zero models only
  const nonZeroModels = (stats?.byModel || []).filter(m => m.total_tokens > 0);

  document.getElementById('total-tokens').textContent = formatTokens(stats?.total?.total_tokens);
  document.getElementById('total-cost').textContent = formatCost(stats?.total?.total_cost);
  document.getElementById('days-active').textContent = stats?.total?.days_active || 0;
  document.getElementById('model-count').textContent = nonZeroModels.length || 0;

  // Render charts
  renderPieChart(stats?.byModel);
  renderLineChart(stats?.byDay);
  renderHeatmap(stats?.byDay);

  // Render model list and daily breakdown
  renderModelList(stats?.byModel);
  renderDailyBreakdown(stats?.byDayDetail);
}
