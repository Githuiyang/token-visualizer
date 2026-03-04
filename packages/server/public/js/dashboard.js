// Dashboard JavaScript

// State
let charts = {};
let currentLang = localStorage.getItem('tokenviz_lang') || 'en';

// Translations
const i18n = {
  en: {
    brand: 'Token Visualizer',
    home: 'Home',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    usageDashboard: 'Usage Dashboard',
    totalTokens: 'Total Tokens',
    totalCost: 'Total Cost',
    daysActive: 'Days Active',
    models: 'Models',
    costByModel: 'Cost by Model',
    tokensByDevice: 'Tokens by Device',
    dailyTokenUsage: 'Daily Token Usage',
    activityHeatmap: 'Activity Heatmap',
    dailyBreakdown: 'Daily Breakdown',
    yourRanking: 'Your Ranking',
    viewLeaderboard: 'View Leaderboard →',
    profileSettings: 'Profile Settings',
    nickname: 'Nickname',
    showNickname: 'Show nickname',
    showEmail: 'Show email',
    showOnLeaderboard: 'Show on leaderboard',
    saveProfile: 'Save Profile',
    joinGroup: 'Join Group',
    groupName: 'Group Name',
    noGroups: 'No groups yet. Join one to compare with friends!',
    leave: '×',
    share: 'Share',
    shareImage: 'Share Image',
    download: 'Download',
    selectPeriod: 'Select Period',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    allTime: 'All Time'
  },
  zh: {
    brand: 'Token Visualizer',
    home: '首页',
    leaderboard: '排行榜',
    settings: '设置',
    usageDashboard: '使用情况',
    totalTokens: '总 Tokens',
    totalCost: '总成本',
    daysActive: '活跃天数',
    models: '模型',
    costByModel: '按模型成本',
    tokensByDevice: '按设备消耗',
    dailyTokenUsage: '每日 Token 使用',
    activityHeatmap: '活动热力图',
    dailyBreakdown: '每日详情',
    yourRanking: '你的排名',
    viewLeaderboard: '查看排行榜 →',
    profileSettings: '个人资料设置',
    nickname: '昵称',
    showNickname: '显示昵称',
    showEmail: '显示邮箱',
    showOnLeaderboard: '在排行榜显示',
    saveProfile: '保存资料',
    joinGroup: '加入群组',
    groupName: '群组名称',
    noGroups: '还没有群组，加入一个和朋友一起比较！',
    leave: '×',
    share: '分享',
    shareImage: '分享图片',
    download: '下载',
    selectPeriod: '选择时间段',
    last7Days: '近 7 日',
    last30Days: '近 30 日',
    allTime: '全部'
  }
};

// Update all text based on current language
function updateLanguage() {
  const t = i18n[currentLang];
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = currentLang === 'en' ? 'EN' : '中';

  // Navbar
  document.querySelector('.nav-brand').textContent = t.brand;
  document.querySelector('a[href="/"]').textContent = t.home;
  document.querySelector('a[href="/leaderboard"]').textContent = t.leaderboard;
  document.getElementById('settings-btn').textContent = t.settings;

  // Rank banner
  const rankLabel = document.querySelector('.rank-label');
  const rankLink = document.querySelector('.rank-link');
  if (rankLabel) rankLabel.textContent = t.yourRanking;
  if (rankLink) rankLink.textContent = t.viewLeaderboard;

  // Header
  document.querySelector('header h1').textContent = t.usageDashboard;
  document.querySelectorAll('.stat .label').forEach((el, i) => {
    const labels = [t.totalTokens, t.totalCost, t.daysActive, t.models];
    if (labels[i]) el.textContent = labels[i];
  });

  // Chart sections
  const chartSections = document.querySelectorAll('.chart-section h2');
  chartSections.forEach(h2 => {
    const text = h2.textContent;
    if (text.includes('Cost by Model') || text.includes('按模型成本')) h2.textContent = t.costByModel;
    else if (text.includes('Tokens by Device') || text.includes('按设备消耗')) h2.textContent = t.tokensByDevice;
    else if (text.includes('Daily Token Usage') || text.includes('每日')) h2.textContent = t.dailyTokenUsage;
    else if (text.includes('Activity Heatmap') || text.includes('活动热力图')) h2.textContent = t.activityHeatmap;
    else if (text.includes('Daily Breakdown') || text.includes('每日详情')) h2.textContent = t.dailyBreakdown;
  });

  // Modal
  const modalTitle = document.querySelector('.modal-header h2');
  if (modalTitle) modalTitle.textContent = t.profileSettings;
  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) saveBtn.textContent = t.saveProfile;
  const addGroupBtn = document.getElementById('btn-add-group');
  if (addGroupBtn) addGroupBtn.textContent = t.joinGroup;

  // Share tabs
  const shareTabs = document.querySelectorAll('.share-tab');
  shareTabs.forEach(tab => {
    const period = tab.dataset.period;
    if (period === 'week') tab.textContent = t.last7Days;
    else if (period === 'month') tab.textContent = t.last30Days;
    else if (period === 'all') tab.textContent = t.allTime;
  });
}

// Toggle language
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('tokenviz_lang', currentLang);
  updateLanguage();
  // Re-render charts with new language
  loadDashboard();
}

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
    renderDeviceChart(stats.byDevice);
    renderLineChart(stats.byDay);
    renderHeatmap(stats.byDay);
    renderDailyBreakdown(stats.byDayDetail);

    // Update language for dynamic content
    updateLanguage();

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

// Render device breakdown pie chart
function renderDeviceChart(byDevice) {
  const container = document.getElementById('device-chart');
  if (!container) return;

  if (!byDevice || byDevice.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6a6a6a;">No data</div>';
    return;
  }

  const filtered = byDevice.filter(d => d.cost > 0);

  if (filtered.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6a6a6a;">No device data</div>';
    return;
  }

  if (charts.device) charts.device.dispose();
  charts.device = echarts.init(container);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const d = filtered[params.dataIndex];
        return `${d.device}: ${formatCost(d.cost)} (${params.percent}%)<br/>${formatTokens(d.total_tokens)} tokens`;
      }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '55%'],
      data: filtered.map((d, i) => ({
        value: d.cost,
        name: d.device,
        itemStyle: {
          color: [
            '#4a90d9', // 蓝
            '#50c878', // 绿
            '#d4a056', // 金
            '#9b59b6', // 紫
            '#e67e22', // 橙
          ][i % 5]
        }
      })),
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}',
        fontSize: 10,
        color: '#6a6a6a'
      }
    }]
  };

  charts.device.setOption(option);
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

// ============================================================================
// Groups Management
// ============================================================================

// Load user's profile including groups
async function loadProfile() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const response = await fetch('/api/profile', {
      headers: { 'X-API-Key': apiKey }
    });

    if (response.ok) {
      const result = await response.json();
      const profile = result.data;

      // Update profile form
      if (profile.nickname) {
        document.getElementById('profile-nickname').value = profile.nickname;
      }
      if (profile.show_nickname) {
        document.getElementById('show-nickname').checked = profile.show_nickname === 1;
      }
      if (profile.show_email) {
        document.getElementById('show-email').checked = profile.show_email === 1;
      }
      if (profile.show_on_leaderboard) {
        document.getElementById('show-on-leaderboard').checked = profile.show_on_leaderboard === 1;
      }

      // Display API key
      document.getElementById('profile-api-key').textContent = apiKey;

      // Load groups
      await loadGroups();
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

// Load user's groups
async function loadGroups() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  try {
    const response = await fetch('/api/groups', {
      headers: { 'X-API-Key': apiKey }
    });

    if (response.ok) {
      const result = await response.json();
      const groups = result.data?.groups || [];
      renderGroups(groups);
    }
  } catch (error) {
    console.error('Failed to load groups:', error);
  }
}

// Render groups list
function renderGroups(groups) {
  const container = document.getElementById('groups-list');
  if (!container) return;

  if (groups.length === 0) {
    container.innerHTML = '<span class="empty-groups">No groups yet. Join one to compare with friends!</span>';
    return;
  }

  container.innerHTML = groups.map(group => `
    <div class="group-item">
      <span class="group-name">${escapeHtml(group)}</span>
      <button class="btn-leave-group" data-group="${escapeHtml(group)}" title="Leave group">×</button>
    </div>
  `).join('');

  // Add leave handlers
  container.querySelectorAll('.btn-leave-group').forEach(btn => {
    btn.addEventListener('click', () => leaveGroup(btn.dataset.group));
  });
}

// Join a group
async function joinGroup(groupName) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  if (!groupName || !groupName.trim()) {
    alert('Please enter a group name');
    return;
  }

  const group = groupName.trim();

  try {
    const response = await fetch('/api/groups/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ group_name: group })
    });

    const result = await response.json();

    if (response.ok) {
      // Clear input
      document.getElementById('new-group-name').value = '';
      // Reload groups
      await loadGroups();
    } else {
      alert(result.error || 'Failed to join group');
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    alert('Failed to join group');
  }
}

// Leave a group
async function leaveGroup(groupName) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  if (!confirm(`Leave group "${groupName}"?`)) return;

  try {
    const response = await fetch('/api/groups/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ group_name: groupName })
    });

    const result = await response.json();

    if (response.ok) {
      await loadGroups();
    } else {
      alert(result.error || 'Failed to leave group');
    }
  } catch (error) {
    console.error('Failed to leave group:', error);
    alert('Failed to leave group');
  }
}

// Save profile settings
async function saveProfile() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const nickname = document.getElementById('profile-nickname').value;
  const showNickname = document.getElementById('show-nickname').checked;
  const showEmail = document.getElementById('show-email').checked;
  const showOnLeaderboard = document.getElementById('show-on-leaderboard').checked;

  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        nickname,
        show_nickname: showNickname,
        show_email: showEmail,
        show_on_leaderboard: showOnLeaderboard
      })
    });

    if (response.ok) {
      alert('Profile saved!');
      closeModal();
    } else {
      const result = await response.json();
      alert(result.error || 'Failed to save profile');
    }
  } catch (error) {
    console.error('Failed to save profile:', error);
    alert('Failed to save profile');
  }
}

// Open profile modal
function openProfileModal() {
  document.getElementById('settings-modal').style.display = 'flex';
  loadProfile();
}

// Close profile modal
function closeModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Setup profile modal handlers
function setupProfileModal() {
  // Language toggle button
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openProfileModal);
  }

  // Close button
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Close on overlay click
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Join group button
  const addGroupBtn = document.getElementById('btn-add-group');
  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', () => {
      const input = document.getElementById('new-group-name');
      if (input) {
        joinGroup(input.value);
      }
    });
  }

  // Enter key on group input
  const groupInput = document.getElementById('new-group-name');
  if (groupInput) {
    groupInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinGroup(groupInput.value);
      }
    });
  }
}

// ============================================================================
// Initialize
// ============================================================================

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateLanguage();
  loadDashboard();
  setupProfileModal();
});

// Handle window resize
window.addEventListener('resize', () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.resize();
  });
});
