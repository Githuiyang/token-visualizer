// Profile Settings Modal JavaScript

(() => {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const profileForm = document.getElementById('profile-form');
  const copyApiKeyBtn = document.getElementById('copy-api-key');

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

        // Update rank banner if data available
        if (profile.rank !== undefined) {
          updateRankBanner(profile);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  // Update rank banner
  function updateRankBanner(profile) {
    const rankBanner = document.getElementById('rank-banner');
    const userRank = document.getElementById('user-rank');
    const rankTokens = document.getElementById('rank-tokens');

    if (profile.totalTokens > 0) {
      rankBanner.style.display = 'flex';
      userRank.textContent = '#' + (profile.rank > 999 ? '999+' : profile.rank);
      rankTokens.textContent = formatTokens(profile.totalTokens) + ' tokens';
    }
  }

  // Format tokens
  function formatTokens(tokens) {
    if (!tokens) return '0';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K';
    return tokens.toString();
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
        updateRankBanner(profile);
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
