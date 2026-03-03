// Dashboard JavaScript

// State
let charts = {};

// Check for API key
function getApiKey() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('key') || localStorage.getItem('tokenviz_api_key');
}

// Format tokens
function formatTokens(tokens) {
  if (!tokens) return '0';
  if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
  return tokens.toLocaleString();
}

// Format cost
function formatCost(cost) {
  return '$' + (cost || 0).toFixed(2);
}

// Load dashboard data
async function loadDashboard() {
  const apiKey = getApiKey();
  if (!apiKey) {
    window.location.href = '/';
    return;
  }

  // Save API key to localStorage
  localStorage.setItem('tokenviz_api_key', apiKey);

  try {
    const response = await fetch('/api/stats', {
      headers: { 'X-API-Key': apiKey }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('tokenviz_api_key');
        window.location.href = '/';
      }
      throw new Error('Failed to load data');
    }

    const result = await response.json();
    const stats = result.data;

    // Update summary stats
    renderSummary(stats);

    // Render charts
    renderModelChart(stats.byModel);
    renderLineChart(stats.byDay);
    renderHeatmap(stats.byDay);
    renderDailyBreakdown(stats.byDayDetail);

  } catch (error) {
    console.error('Failed to load dashboard:', error);
    alert('Failed to load data. Please check your API key.');
  }
}

// Render summary stats
function renderSummary(stats) {
  const total = stats.total || stats;
  document.getElementById('total-tokens').textContent = formatTokens(total.total_tokens);
  document.getElementById('total-cost').textContent = formatCost(total.total_cost);
  document.getElementById('days-active').textContent = total.days_active || '-';
  document.getElementById('model-count').textContent = total.model_count || (stats.byModel ? stats.byModel.length : 0);
}

// Render model cost pie chart
function renderModelChart(byModel) {
  const container = document.getElementById('pie-chart');
  if (!container) return;

  if (!byModel || byModel.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6a6a6a;">No data</div>';
    return;
  }

  // Filter out zero-cost models and take top 8
  const filtered = byModel.filter(m => m.cost > 0).slice(0, 8);

  if (filtered.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6a6a6a;">No cost data</div>';
    return;
  }

  // 为每个模型生成显示名称
  filtered.forEach(m => {
    m.displayName = m.model
      .replace('claude-3-5-sonnet', 'Claude 3.5 Sonnet')
      .replace('claude-3-opus', 'Claude 3 Opus')
      .replace('claude-3-haiku', 'Claude 3 Haiku')
      .replace('claude-sonnet-4', 'Claude Sonnet 4')
      .replace('claude-opus-4', 'Claude Opus 4')
      .replace('gpt-4o', 'GPT-4o')
      .replace('gpt-4o-mini', 'GPT-4o Mini')
      .replace('gemini-2.5-pro', 'Gemini 2.5 Pro');
  });

  if (charts.model) charts.model.dispose();
  charts.model = echarts.init(container);

  const option = {
    tooltip: {
      trigger: 'item',
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
          color: [
            '#d4a056', // 金色
            '#c96852', // 玫瑰红
            '#4a90d9', // 蓝
            '#50c878', // 绿
            '#9b59b6', // 紫
            '#e67e22', // 橙
            '#1abc9c', // 青
            '#e74c3c'  // 红
          ][i % 8]
        }
      })),
      label: { show: false }
    }]
  };

  charts.model.setOption(option);

  // Render legend
  const legend = document.getElementById('model-list');
  if (legend) {
    legend.innerHTML = filtered.map((m, i) => {
      const colors = ['#d4a056', '#c96852', '#4a90d9', '#50c878', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c'];
      return `
        <div class="model-item">
          <div class="model-left">
            <div class="model-dot" style="background:${colors[i % 8]}"></div>
            <span class="model-name">${m.displayName || m.model}</span>
          </div>
          <span class="model-cost">${formatCost(m.cost)}</span>
        </div>
      `;
    }).join('');
  }
}

// Render line chart
function renderLineChart(byDay) {
  const container = document.getElementById('line-chart');
  if (!container) return;

  if (!byDay || byDay.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6a6a6a;">No data</div>';
    return;
  }

  const sorted = [...byDay].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (charts.line) charts.line.dispose();
  charts.line = echarts.init(container);

  const option = {
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: sorted.map(d => d.date.slice(5)), // MM-DD format
      axisLine: { lineStyle: { color: '#3a3a3a' } },
      axisLabel: { color: '#6a6a6a', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1a1a1a' } },
      axisLabel: {
        color: '#6a6a6a',
        fontSize: 10,
        formatter: (val) => formatTokens(val)
      }
    },
    series: [{
      type: 'line',
      data: sorted.map(d => d.tokens),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#d4a056',
        width: 2
      },
      itemStyle: {
        color: '#d4a056'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(212, 160, 86, 0.3)' },
            { offset: 1, color: 'rgba(212, 160, 86, 0)' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const idx = params[0].dataIndex;
        const d = sorted[idx];
        return `${d.date}<br/>Tokens: ${formatTokens(d.tokens)}<br/>Cost: ${formatCost(d.cost)}`;
      }
    }
  };

  charts.line.setOption(option);
}

// Render GitHub-style heatmap by calendar year
function renderHeatmap(byDay) {
  const container = document.getElementById('heatmap');
  if (!container) return;

  container.innerHTML = '';

  if (!byDay || byDay.length === 0) {
    container.innerHTML = '<div style="color:#6a6a6a;">No data</div>';
    return;
  }

  const maxTokens = Math.max(...byDay.map(d => d.tokens), 1);
  const colors = ['#1a1a1a', '#3d2a1a', '#5a4528', '#8a6a3d', '#d4a056'];
  const cellSize = 13;
  const cellGap = 3;

  // 日期映射
  const dataMap = {};
  byDay.forEach(d => dataMap[d.date] = d);

  // 获取数据年份范围
  const years = [...new Set(byDay.map(d => new Date(d.date).getFullYear()))].sort();

  // 如果没有数据，使用当前年份
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }

  // 年份切换控件
  const yearNav = document.createElement('div');
  yearNav.style.cssText = `
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #2a2a2a;
  `;

  const yearLabel = document.createElement('span');
  yearLabel.id = 'heatmap-year-label';
  yearLabel.style.cssText = 'font-size: 14px; font-weight: 500; color: #f5f5f5;';
  yearLabel.textContent = years[years.length - 1];

  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '‹';
  prevBtn.style.cssText = `
    background: transparent; border: 1px solid #3a3a3a;
    color: #a8a8a8; cursor: pointer; padding: 4px 10px;
    border-radius: 4px; font-size: 16px; transition: all 0.2s;
  `;
  prevBtn.onmouseenter = () => { prevBtn.style.borderColor = '#d4a056'; prevBtn.style.color = '#d4a056'; };
  prevBtn.onmouseleave = () => { prevBtn.style.borderColor = '#3a3a3a'; prevBtn.style.color = '#a8a8a8'; };

  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '›';
  nextBtn.style.cssText = `
    background: transparent; border: 1px solid #3a3a3a;
    color: #a8a8a8; cursor: pointer; padding: 4px 10px;
    border-radius: 4px; font-size: 16px; transition: all 0.2s;
  `;
  nextBtn.onmouseenter = () => { nextBtn.style.borderColor = '#d4a056'; nextBtn.style.color = '#d4a056'; };
  nextBtn.onmouseleave = () => { nextBtn.style.borderColor = '#3a3a3a'; nextBtn.style.color = '#a8a8a8'; };

  yearNav.appendChild(prevBtn);
  yearNav.appendChild(yearLabel);
  yearNav.appendChild(nextBtn);
  container.appendChild(yearNav);

  // 热力图容器
  const heatmapWrapper = document.createElement('div');
  heatmapWrapper.id = 'heatmap-content';
  container.appendChild(heatmapWrapper);

  // 渲染指定年份的热力图
  function renderYear(year) {
    yearLabel.textContent = year;

    // 计算该年份的第一天和最后一天
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // 找到该年1月1日是星期几 (0=Sunday, 1=Monday...)
    const firstDayOfWeek = yearStart.getDay();

    // 外层容器
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';

    // 左侧：星期标签
    const weekdays = document.createElement('div');
    weekdays.style.cssText = `
      display: grid; grid-template-rows: repeat(7, ${cellSize}px); gap: ${cellGap}px;
      padding-top: 2px; font-size: 10px; color: #6a6a6a;
    `;
    ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(label => {
      const el = document.createElement('div');
      el.style.cssText = 'height: 13px; line-height: 13px; display: flex; align-items: center;';
      el.textContent = label;
      weekdays.appendChild(el);
    });
    wrapper.appendChild(weekdays);

    // 网格容器
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: flex; gap: ${cellGap}px;
    `;

    // 计算需要多少周（53周确保覆盖整年）
    const weekCount = 53;
    let currentDate = new Date(yearStart);

    // 调整到第一个周日前
    currentDate.setDate(currentDate.getDate() - firstDayOfWeek);

    for (let week = 0; week < weekCount; week++) {
      const column = document.createElement('div');
      column.style.cssText = `
        display: flex; flex-direction: column; gap: ${cellGap}px;
      `;

      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const currentYear = currentDate.getFullYear();
        const isCurrentYear = currentYear === year;

        const cell = document.createElement('div');
        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize}px;
          border-radius: 2px;
          background: ${isCurrentYear ? '#1a1a1a' : 'transparent'};
          cursor: ${isCurrentYear ? 'pointer' : 'default'};
        `;

        if (isCurrentYear) {
          const d = dataMap[dateStr];

          let level = 0;
          if (d) {
            const normalized = d.tokens / maxTokens;
            if (d.tokens > 0) level = 1;
            if (normalized > 0.25) level = 2;
            if (normalized > 0.5) level = 3;
            if (normalized > 0.75) level = 4;
            cell.title = `${d.date}: ${formatTokens(d.tokens)} · ${formatCost(d.cost)}`;
            cell.style.background = colors[level];
          } else {
            cell.title = `${dateStr}: No usage`;
          }

          // 悬停效果
          cell.onmouseenter = () => {
            cell.style.outline = '2px solid #d4a056';
            cell.style.outlineOffset = '1px';
          };
          cell.onmouseleave = () => {
            cell.style.outline = 'none';
          };
        }

        column.appendChild(cell);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      grid.appendChild(column);
    }

    wrapper.appendChild(grid);
    heatmapWrapper.innerHTML = '';
    heatmapWrapper.appendChild(wrapper);

    // 图例
    const legend = document.createElement('div');
    legend.style.cssText = `
      display: flex; align-items: center; justify-content: flex-end;
      gap: 4px; margin-top: 12px; font-size: 10px; color: #6a6a6a;
    `;
    legend.innerHTML = `
      <span>Less</span>
      ${colors.map(c => `<div style="width:13px;height:13px;border-radius:2px;background:${c};"></div>`).join('')}
      <span>More</span>
    `;
    heatmapWrapper.appendChild(legend);
  }

  // 当前显示的年份索引
  let currentYearIndex = years.length - 1;
  let currentDisplayYear = years[currentYearIndex];

  // 初始化显示最新年份
  renderYear(currentDisplayYear);

  // 按钮事件
  prevBtn.addEventListener('click', () => {
    currentDisplayYear--;
    renderYear(currentDisplayYear);
  });

  nextBtn.addEventListener('click', () => {
    currentDisplayYear++;
    renderYear(currentDisplayYear);
  });
}

// Render daily breakdown
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
    container.innerHTML = '<div style="color:#6a6a6a;">No data</div>';
    return;
  }

  container.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="day-group">
      <div class="day-header">
        <span class="day-date">${date}</span>
        <span class="day-total">${formatTokens(items.reduce((sum, i) => sum + i.total_tokens, 0))} · ${formatCost(items.reduce((sum, i) => sum + i.cost, 0))}</span>
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
              <span class="item-cost">${formatCost(item.cost)}</span>
            </div>
            <div class="item-project">${item.project}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', loadDashboard);

// Handle window resize
window.addEventListener('resize', () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.resize();
  });
});
