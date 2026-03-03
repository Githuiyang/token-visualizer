// Profile Settings Modal JavaScript

(() => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const profileForm = document.getElementById('profile-form');
  const copyApiKeyBtn = document.getElementById('copy-api-key');
  const btnAddGroup = document.getElementById('btn-add-group');
  const newGroupInput = document.getElementById('new-group-name');

  let userGroups = [];

  // Get API key from localStorage
  function getApiKey() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');
    if (urlKey) {
      localStorage.setItem('tokenviz_api_key', urlKey);
      return urlKey;
    }
    return localStorage.getItem('tokenviz_api_key');
  }

  // Open modal
  function openModal() {
    settingsModal.style.display = 'flex';
    loadProfile();
    loadGroups();
  }

  // Close modal
  function closeModal() {
    settingsModal.style.display = 'none';
  }

  // Load user profile
  async function loadProfile() {
    const apiKey = getApiKey();
    if (!apiKey) return;

    // Set API key display
    document.getElementById('profile-api-key').textContent = apiKey;

    try {
      const response = await fetch('/api/profile', {
        headers: { 'X-API-Key': apiKey }
      });

      if (response.ok) {
        const result = await response.json();
        const profile = result.data;

        // Fill form fields
        document.getElementById('profile-nickname').value = profile.nickname || '';
        document.getElementById('show-nickname').checked = profile.show_nickname === 1;
        document.getElementById('show-email').checked = profile.show_email === 1;
        document.getElementById('show-on-leaderboard').checked = profile.show_on_leaderboard === 1;

        // Update rank banner (async, but we don't need to wait for it)
        updateRankBanner(profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  // Load user groups
  async function loadGroups() {
    const apiKey = getApiKey();
    if (!apiKey) {
      renderGroups([]);
      return;
    }

    try {
      const response = await fetch('/api/groups', {
        headers: { 'X-API-Key': apiKey }
      });

      if (response.ok) {
        const result = await response.json();
        userGroups = result.data?.groups || [];
        renderGroups(userGroups);
      } else {
        renderGroups([]);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      renderGroups([]);
    }
  }

  // Render groups list
  function renderGroups(groups) {
    const groupsList = document.getElementById('groups-list');

    if (!groups || groups.length === 0) {
      groupsList.innerHTML = '<span class="empty-groups">No groups yet. Join a group to see rankings with friends!</span>';
      return;
    }

    groupsList.innerHTML = groups.map(group => `
      <div class="group-tag-item" data-group="${escapeHtml(group)}">
        <span class="group-name">${escapeHtml(group)}</span>
        <button type="button" class="btn-remove-group" title="Leave group">×</button>
      </div>
    `).join('');

    // Add remove event listeners
    groupsList.querySelectorAll('.btn-remove-group').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const groupItem = e.target.closest('.group-tag-item');
        const groupName = groupItem.dataset.group;
        leaveGroup(groupName);
      });
    });
  }

  // Join a group
  async function joinGroup(groupName) {
    const apiKey = getApiKey();
    if (!apiKey) return;

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      alert('Please enter a group name');
      return;
    }

    // Validate group name (max 50 chars, alphanumeric + spaces + dash)
    if (trimmedName.length > 50) {
      alert('Group name must be 50 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmedName)) {
      alert('Group name can only contain letters, numbers, spaces and hyphens');
      return;
    }

    if (userGroups.includes(trimmedName)) {
      alert('You are already a member of this group');
      return;
    }

    btnAddGroup.disabled = true;
    btnAddGroup.textContent = 'Joining...';

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ group_name: trimmedName })
      });

      if (response.ok) {
        userGroups.push(trimmedName);
        userGroups.sort();
        renderGroups(userGroups);
        newGroupInput.value = '';
      } else {
        const error = await response.json();
        alert('Failed to join group: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group. Please try again.');
    } finally {
      btnAddGroup.disabled = false;
      btnAddGroup.textContent = 'Join';
    }
  }

  // Leave a group
  async function leaveGroup(groupName) {
    const apiKey = getApiKey();
    if (!apiKey) return;

    if (!confirm(`Leave group "${groupName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ group_name: groupName })
      });

      if (response.ok) {
        userGroups = userGroups.filter(g => g !== groupName);
        renderGroups(userGroups);
      } else {
        const error = await response.json();
        alert('Failed to leave group: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Failed to leave group. Please try again.');
    }
  }

  // Update rank banner
  async function updateRankBanner(profile) {
    const rankBanner = document.getElementById('rank-banner');
    const userRank = document.getElementById('user-rank');
    const rankTokens = document.getElementById('rank-tokens');

    if (!rankBanner) return;
    if (!profile || !profile.nickname) {
      rankBanner.style.display = 'none';
      return;
    }

    // Fetch stats to get rank and tokens
    try {
      const response = await fetch('/api/stats', {
        headers: { 'X-API-Key': getApiKey() }
      });

      if (response.ok) {
        const result = await response.json();
        const stats = result.data;

        // Calculate rank from leaderboard
        const rankResponse = await fetch('/api/leaderboard');
        if (rankResponse.ok) {
          const rankResult = await rankResponse.json();
          const leaderboard = rankResult.data || [];
          const userEntry = leaderboard.find(e => e && e.nickname === profile.nickname);
          const rank = userEntry ? userEntry.rank : null;

          if (stats && stats.total && stats.total.total_tokens > 0) {
            rankBanner.style.display = 'flex';
            userRank.textContent = rank ? '#' + (rank > 999 ? '999+' : rank) : '-';
            rankTokens.textContent = formatTokens(stats.total.total_tokens) + ' tokens';
          } else {
            rankBanner.style.display = 'none';
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch rank:', error);
      rankBanner.style.display = 'none';
    }
  }

  // Format tokens
  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Save profile
  async function saveProfile(e) {
    e.preventDefault();

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('No API key found. Please log in again.');
      return;
    }

    const saveBtn = document.getElementById('modal-save');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    const formData = {
      nickname: document.getElementById('profile-nickname').value,
      show_nickname: document.getElementById('show-nickname').checked,
      show_email: document.getElementById('show-email').checked,
      show_on_leaderboard: document.getElementById('show-on-leaderboard').checked
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        const profile = result.data;
        await updateRankBanner(profile);
        closeModal();
      } else {
        const error = await response.json();
        alert('Failed to save profile: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  }

  // Copy API key
  function copyApiKey() {
    const apiKey = getApiKey();
    if (apiKey) {
      navigator.clipboard.writeText(apiKey).then(() => {
        const btn = copyApiKeyBtn;
        btn.style.color = 'var(--green)';
        setTimeout(() => {
          btn.style.color = '';
        }, 1500);
      });
    }
  }

  // Event listeners
  settingsBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  profileForm.addEventListener('submit', saveProfile);
  copyApiKeyBtn.addEventListener('click', copyApiKey);

  // Add group button
  btnAddGroup.addEventListener('click', () => {
    const groupName = newGroupInput.value;
    joinGroup(groupName);
  });

  // Add group on Enter key
  newGroupInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      joinGroup(newGroupInput.value);
    }
  });

  // Close modal on overlay click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
      closeModal();
    }
  });

  // Load rank data when page loads
  document.addEventListener('DOMContentLoaded', () => {
    const apiKey = getApiKey();
    if (apiKey) {
      loadProfile();
    }
  });
})();
