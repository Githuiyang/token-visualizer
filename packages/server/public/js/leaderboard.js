// Leaderboard JavaScript

let currentSort = 'totalTokens';
let currentPeriod = 'all';
let currentView = 'global'; // 'global' or 'group'
let currentUserId = null;
let userGroups = [];
let selectedGroup = null;
let isDropdownOpen = false;

// Check for user's API key in localStorage
function getUserApiKey() {
  return localStorage.getItem('tokenviz_api_key');
}

// Format large numbers
function formatNumber(num) {
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

  const leaderboard = Array.isArray(data) ? data : (data.leaderboard || []);

  if (leaderboard.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = leaderboard.map((entry, index) => {
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
  if (document.getElementById('user-rank-badge')) {
    document.getElementById('user-rank-badge').textContent = currentUser.rank > 999 ? '999+' : currentUser.rank;
  }
  if (document.getElementById('user-rank-value')) {
    document.getElementById('user-rank-value').textContent = '#' + currentUser.rank;
  }
  if (document.getElementById('user-tokens-value')) {
    document.getElementById('user-tokens-value').textContent = formatNumber(currentUser.totalTokens);
  }
  if (document.getElementById('user-cost-value')) {
    document.getElementById('user-cost-value').textContent = formatCost(currentUser.totalCost);
  }
}

// Fetch leaderboard data
async function fetchLeaderboard() {
  const apiKey = getUserApiKey();
  const userId = apiKey ? getUserIdFromApiKey(apiKey) : null;
  const url = new URL('/api/leaderboard', window.location.origin);
  url.searchParams.set('sortBy', currentSort);
  url.searchParams.set('period', currentPeriod);

  // Add group filter if in group view
  if (currentView === 'group' && selectedGroup) {
    url.searchParams.set('group', selectedGroup);
  }

  if (userId) {
    url.searchParams.set('userId', userId);
  }

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (response.ok && result.data) {
      renderLeaderboard(result.data);
      if (result.data.currentUser) {
        renderUserRank(result.data.currentUser);
      }
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

// Fetch user's groups from profile API
async function fetchUserGroups() {
  const apiKey = getUserApiKey();
  if (!apiKey) {
    userGroups = [];
    updateViewToggle();
    return;
  }

  try {
    const response = await fetch('/api/groups', {
      headers: { 'X-API-Key': apiKey }
    });

    if (response.ok) {
      const result = await response.json();
      userGroups = result.data?.groups || [];
      updateViewToggle();
    }
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    userGroups = [];
    updateViewToggle();
  }
}

// Update view dropdown with groups
function updateViewToggle() {
  const dropdownText = document.getElementById('view-dropdown-text');
  const dropdownOptions = document.getElementById('view-dropdown-options');
  const dropdownSearch = document.getElementById('view-dropdown-search');

  if (!dropdownText || !dropdownOptions) return;

  // Update button text
  if (currentView === 'global') {
    dropdownText.textContent = 'Global';
  } else if (selectedGroup) {
    dropdownText.textContent = selectedGroup;
  }

  // Show search if more than 10 groups
  if (dropdownSearch) {
    dropdownSearch.style.display = userGroups.length > 10 ? 'block' : 'none';
  }

  // Rebuild options
  dropdownOptions.innerHTML = '';

  // Global option
  const globalOption = document.createElement('button');
  globalOption.className = 'view-dropdown-option';
  if (currentView === 'global') {
    globalOption.classList.add('active');
  }
  globalOption.textContent = 'Global';
  globalOption.dataset.view = 'global';
  globalOption.dataset.value = '';
  globalOption.onclick = () => selectView('global', null);
  dropdownOptions.appendChild(globalOption);

  // Group options
  userGroups.forEach(group => {
    const option = document.createElement('button');
    option.className = 'view-dropdown-option';
    if (selectedGroup === group) {
      option.classList.add('active');
    }
    option.textContent = group;
    option.dataset.view = 'group';
    option.dataset.value = group;
    option.onclick = () => selectView('group', group);
    dropdownOptions.appendChild(option);
  });
}

// Select a view (global or group)
function selectView(view, group) {
  currentView = view;
  selectedGroup = group;

  // Update active states
  document.querySelectorAll('.view-dropdown-option').forEach(opt => {
    opt.classList.remove('active');
    if ((view === 'global' && opt.dataset.view === 'global') ||
        (view === 'group' && opt.dataset.value === group)) {
      opt.classList.add('active');
    }
  });

  // Update button text
  const dropdownText = document.getElementById('view-dropdown-text');
  if (dropdownText) {
    dropdownText.textContent = view === 'global' ? 'Global' : group;
  }

  // Close dropdown
  closeDropdown();

  // Fetch new leaderboard
  fetchLeaderboard();
}

// Toggle dropdown open/closed
function toggleDropdown() {
  const dropdown = document.getElementById('view-dropdown');
  if (isDropdownOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

// Open dropdown
function openDropdown() {
  const dropdown = document.getElementById('view-dropdown');
  if (dropdown) {
    dropdown.classList.add('open');
    isDropdownOpen = true;
  }
}

// Close dropdown
function closeDropdown() {
  const dropdown = document.getElementById('view-dropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
    isDropdownOpen = false;
  }
}

// Filter groups by search
function filterGroups(searchTerm) {
  const dropdownOptions = document.getElementById('view-dropdown-options');
  if (!dropdownOptions) return;

  const term = searchTerm.toLowerCase().trim();
  const options = dropdownOptions.querySelectorAll('.view-dropdown-option');
  let hasVisible = false;

  options.forEach(option => {
    const text = option.textContent.toLowerCase();
    const isGlobal = option.dataset.view === 'global';

    // Always show Global option when searching, or show all if no search
    if (isGlobal || !term || text.includes(term)) {
      option.style.display = 'block';
      hasVisible = true;
    } else {
      option.style.display = 'none';
    }
  });

  // Show "no results" if no groups match
  if (!hasVisible && term) {
    let noResults = dropdownOptions.querySelector('.no-results');
    if (!noResults) {
      noResults = document.createElement('button');
      noResults.className = 'view-dropdown-option no-results';
      noResults.textContent = 'No groups found';
      noResults.disabled = true;
      dropdownOptions.appendChild(noResults);
    }
    noResults.style.display = 'block';
  } else {
    const noResults = dropdownOptions.querySelector('.no-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
  }
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

  // View dropdown toggle
  const dropdownBtn = document.getElementById('view-dropdown-btn');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  // Search input for groups
  const searchInput = document.getElementById('view-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterGroups(e.target.value);
    });
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (isDropdownOpen && !e.target.closest('.view-dropdown')) {
      closeDropdown();
    }
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownOpen) {
      closeDropdown();
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  fetchUserGroups();
  fetchLeaderboard();
});
