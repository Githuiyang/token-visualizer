// Leaderboard JavaScript

let currentSort = 'totalTokens';
let currentPeriod = 'all';
let currentUserId = null;

// Check for user's API key in localStorage
function getUserApiKey() {
  return localStorage.getItem('tokenviz_api_key');
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

// Format cost
function formatCost(cost) {
  return '$' + cost.toFixed(2);
}

// Render leaderboard
function renderLeaderboard(data) {
  const tbody = document.getElementById('leaderboard-body');
  const emptyState = document.getElementById('empty-state');

  if (!data.leaderboard || data.leaderboard.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = data.leaderboard.map((entry, index) => {
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    const displayName = entry.nickname || entry.email || 'Anonymous';
    const showEmail = !entry.nickname && entry.email;

    return `
      <tr>
        <td class="rank-cell ${rankClass}">${entry.rank}</td>
        <td class="user-cell">
          <div class="user-avatar">${displayName.charAt(0).toUpperCase()}</div>
          <div class="user-info">
            ${entry.nickname ? `<span class="user-nickname">${escapeHtml(entry.nickname)}</span>` : ''}
            ${showEmail ? `<span class="user-email">${escapeHtml(entry.email)}</span>` : ''}
          </div>
        </td>
        <td class="value-cell tokens-value">${formatNumber(entry.totalTokens)}</td>
        <td class="value-cell cost-value">${formatCost(entry.totalCost)}</td>
        <td class="value-cell days-value">${entry.daysActive}</td>
      </tr>
    `;
  }).join('');
}

// Render current user rank
function renderUserRank(currentUser) {
  const rankCard = document.getElementById('user-rank-card');

  if (!currentUser || currentUser.totalTokens === 0) {
    rankCard.style.display = 'none';
    return;
  }

  rankCard.style.display = 'flex';
  document.getElementById('user-rank-badge').textContent = currentUser.rank > 999 ? '999+' : currentUser.rank;
  document.getElementById('user-rank-value').textContent = '#' + currentUser.rank;
  document.getElementById('user-tokens-value').textContent = formatNumber(currentUser.totalTokens);
  document.getElementById('user-cost-value').textContent = formatCost(currentUser.totalCost);
}

// Fetch leaderboard data
async function fetchLeaderboard() {
  const apiKey = getUserApiKey();
  const userId = apiKey ? getUserIdFromApiKey(apiKey) : null;
  const url = new URL('/api/leaderboard', window.location.origin);
  url.searchParams.set('sortBy', currentSort);
  url.searchParams.set('period', currentPeriod);
  if (userId) {
    url.searchParams.set('userId', userId);
  }

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      renderLeaderboard(result.data);
      renderUserRank(result.data.currentUser);
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

// Get user ID from API key (need to fetch from stats endpoint)
async function getUserIdFromApiKey(apiKey) {
  if (currentUserId) return currentUserId;

  try {
    const response = await fetch('/api/stats', {
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (response.ok) {
      // User is valid, but we don't get user ID from stats
      // We'll need to modify the approach or backend
      return 'current';
    }
  } catch (error) {
    console.error('Failed to validate API key:', error);
  }

  return null;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Setup filter buttons
function setupFilters() {
  // Sort buttons
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      fetchLeaderboard();
    });
  });

  // Period buttons
  document.querySelectorAll('.btn-period').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      fetchLeaderboard();
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  fetchLeaderboard();

  // Check if user has API key and update dashboard link
  const apiKey = getUserApiKey();
  const dashboardLink = document.getElementById('nav-dashboard');
  if (apiKey) {
    dashboardLink.href = `/dashboard?key=${apiKey}`;
  }
});
