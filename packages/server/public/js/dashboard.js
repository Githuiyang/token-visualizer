const API_KEY = localStorage.getItem('tokenVizApiKey') || prompt('Enter your API key:');
if (API_KEY) localStorage.setItem('tokenVizApiKey', API_KEY);

async function loadStats() {
  const response = await fetch('/api/stats', {
    headers: { 'X-API-Key': API_KEY }
  });

  if (!response.ok) {
    alert('Failed to load stats. Check your API key.');
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

function renderPieChart(byModel) {
  const chart = echarts.init(document.getElementById('pie-chart'));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: '{b}: ${c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '55%'],
      data: (byModel || []).map((m, i) => ({
        value: m.cost,
        name: m.model,
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

async function init() {
  const stats = await loadStats();

  // Update summary
  document.getElementById('total-tokens').textContent = formatTokens(stats?.total?.total_tokens);
  document.getElementById('total-cost').textContent = formatCost(stats?.total?.total_cost);
  document.getElementById('days-active').textContent = stats?.total?.days_active || 0;
  document.getElementById('model-count').textContent = stats?.total?.model_count || 0;

  // Render charts
  renderPieChart(stats?.byModel);
  renderLineChart(stats?.byDay);
  renderHeatmap(stats?.byDay);
}

init();
