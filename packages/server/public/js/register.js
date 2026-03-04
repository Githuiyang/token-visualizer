// Registration page JavaScript

// Get API key from localStorage
function getApiKey() {
  return localStorage.getItem('tokenviz_api_key');
}

// Check if user is logged in and update UI accordingly
function checkLoginState() {
  const apiKey = getApiKey();
  const signInPrompt = document.getElementById('sign-in-prompt');
  const userWelcome = document.getElementById('user-welcome');
  const registerSection = document.getElementById('register-form');
  const loggedInSection = document.getElementById('logged-in-section');
  const userApiKeyDisplay = document.getElementById('user-api-key');
  const referenceSection = document.getElementById('reference-section');

  if (apiKey) {
    // User is logged in
    signInPrompt.style.display = 'none';
    userWelcome.style.display = 'flex';
    registerSection.style.display = 'none';
    loggedInSection.style.display = 'block';
    userApiKeyDisplay.textContent = apiKey;

    // Hide CLI reference when logged in (already shown in upload section)
    if (referenceSection) {
      referenceSection.style.display = 'none';
    }

    // Replace API key placeholders in code examples
    replaceApiKeyPlaceholders(apiKey);
  } else {
    // User is not logged in
    signInPrompt.style.display = 'block';
    userWelcome.style.display = 'none';
    registerSection.style.display = 'block';
    loggedInSection.style.display = 'none';

    // Show CLI reference when not logged in
    if (referenceSection) {
      referenceSection.style.display = 'block';
    }

    // Reset code examples to placeholder
    resetApiKeyPlaceholders();
  }
}

// Replace YOUR_API_KEY with actual key in code examples
function replaceApiKeyPlaceholders(apiKey) {
  const serverUrl = window.location.origin;

  // Update two-step upload command - install CLI and push data
  const uploadCommandEl = document.getElementById('upload-command');
  if (uploadCommandEl) {
    // One-command install and push with server URL
    const command = `npm install -g token-viz-cli && token-viz push --key ${apiKey} --server ${serverUrl}`;
    uploadCommandEl.textContent = command;

    const copyBtn = document.getElementById('copy-upload-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        copyToClipboard(command, copyBtn);
      };
    }
  }

  // Handle main guide section codes
  const guideCodes = document.querySelectorAll('code[data-replace-key]');
  guideCodes.forEach(el => {
    el.textContent = el.textContent.replace('YOUR_API_KEY', apiKey);
    // Make it clickable to copy the full command
    el.style.cursor = 'pointer';
    el.title = 'Click to copy';
    el.addEventListener('click', () => copyToClipboard(el.textContent, el));
  });

  // Handle CLI commands reference section
  const templateCodes = document.querySelectorAll('code[data-replace-key-template]');
  templateCodes.forEach(el => {
    el.textContent = el.textContent.replace('YOUR_API_KEY', apiKey);
    el.style.cursor = 'pointer';
    el.title = 'Click to copy';
    el.addEventListener('click', () => copyToClipboard(el.textContent, el));
  });
}

// Reset code examples to show placeholder
function resetApiKeyPlaceholders() {
  // Reset main guide section codes
  const guideCodes = document.querySelectorAll('code[data-replace-key]');
  guideCodes.forEach(el => {
    const text = el.textContent;
    if (text.includes('--key ') && !text.includes('YOUR_API_KEY')) {
      const parts = text.split('--key ');
      el.textContent = parts[0] + '--key YOUR_API_KEY';
    }
    el.style.cursor = '';
    el.title = '';
    el.onclick = null;
  });

  // Reset CLI commands reference section
  const templateCodes = document.querySelectorAll('code[data-replace-key-template]');
  templateCodes.forEach(el => {
    const template = el.getAttribute('data-replace-key-template');
    if (template) {
      el.textContent = `token-viz ${template} --key YOUR_API_KEY`;
    }
    el.style.cursor = '';
    el.title = '';
    el.onclick = null;
  });
}

// Sign out
function signOut() {
  localStorage.removeItem('tokenviz_api_key');
  checkLoginState();
}

// DOM elements
const form = document.getElementById('registration-form');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');

// Sign In Modal
const signInBtn = document.getElementById('sign-in-btn');
const signInModal = document.getElementById('signin-modal');
const signInClose = document.getElementById('signin-close');
const signInForm = document.getElementById('signin-form');
const signInError = document.getElementById('signin-error');
const signOutBtn = document.getElementById('sign-out-btn');

// Copy API key button (for logged in section)
const copyApiKeyBtn = document.getElementById('copy-api-key-btn');

// Show sign in modal
signInBtn.addEventListener('click', () => {
  signInModal.style.display = 'flex';
  signInError.classList.remove('show');
});

// Sign out
signOutBtn.addEventListener('click', signOut);

// Close sign in modal
signInClose.addEventListener('click', () => {
  signInModal.style.display = 'none';
});

// Close modal on overlay click
signInModal.addEventListener('click', (e) => {
  if (e.target === signInModal) {
    signInModal.style.display = 'none';
  }
});

// Handle sign in form submission
signInForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const apiKey = document.getElementById('signin-api-key').value.trim();

  if (!apiKey) {
    showSignInError('Please enter your API key');
    return;
  }

  // Validate API key by fetching profile
  try {
    const response = await fetch('/api/profile', {
      headers: { 'X-API-Key': apiKey }
    });

    if (response.ok) {
      // Save to localStorage and update UI
      localStorage.setItem('tokenviz_api_key', apiKey);
      signInModal.style.display = 'none';
      checkLoginState();
    } else {
      showSignInError('Invalid API key. Please check and try again.');
    }
  } catch (error) {
    showSignInError('Failed to verify API key. Please try again.');
  }
});

function showSignInError(message) {
  signInError.textContent = message;
  signInError.classList.add('show');
}

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const nickname = document.getElementById('nickname').value;
  const showOnLeaderboard = document.getElementById('show-on-leaderboard').checked;

  // Reset error state
  hideError();
  setLoading(true);

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        nickname,
        show_on_leaderboard: showOnLeaderboard
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Save API key and update UI
    localStorage.setItem('tokenviz_api_key', data.apiKey);
    checkLoginState();
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function hideError() {
  errorMessage.classList.remove('show');
}

function setLoading(loading) {
  if (loading) {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    if (!submitBtn.querySelector('.spinner')) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      const btnText = submitBtn.querySelector('.btn-text');
      const textContent = btnText ? btnText.textContent : submitBtn.textContent;
      submitBtn.textContent = '';
      const textSpan = document.createElement('span');
      textSpan.className = 'btn-text';
      textSpan.textContent = 'Generate API Key';
      submitBtn.appendChild(spinner);
      submitBtn.appendChild(textSpan);
    }
  } else {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    const spinner = submitBtn.querySelector('.spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    if (spinner && btnText) {
      submitBtn.textContent = btnText.textContent;
    }
  }
}

// Copy functionality
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.classList.add('copied');
    button.textContent = 'Copied!';

    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalHTML;
      button.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

if (copyApiKeyBtn) {
  copyApiKeyBtn.addEventListener('click', () => {
    const apiKey = getApiKey();
    if (apiKey) {
      copyToClipboard(apiKey, copyApiKeyBtn);
    }
  });
}

// Input validation
const emailInput = document.getElementById('email');
const nicknameInput = document.getElementById('nickname');
let emailCheckTimeout = null;

// Email auto-check for existing users
if (emailInput) {
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();

    // Clear previous timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // Basic validation
    if (email && !email.includes('@')) {
      emailInput.style.borderColor = 'var(--error)';
      return;
    } else {
      emailInput.style.borderColor = '';
    }

    // Check email after user stops typing (debounce)
    if (email && email.includes('@') && email.includes('.')) {
      emailCheckTimeout = setTimeout(() => checkExistingEmail(email), 500);
    }
  });
}

// Check if email is already registered
async function checkExistingEmail(email) {
  try {
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.exists) {
      // Auto-fill nickname
      if (data.nickname && nicknameInput) {
        nicknameInput.value = data.nickname;
        // Show a hint that the account exists
        const helpText = nicknameInput.parentElement.querySelector('.help-text');
        if (helpText) {
          helpText.textContent = 'Welcome back! Your account already exists';
          helpText.style.color = 'var(--success)';
          setTimeout(() => {
            helpText.textContent = 'Shown on leaderboards (max 30 characters)';
            helpText.style.color = '';
          }, 3000);
        }
      }

      // Auto-check leaderboard option if user had it enabled
      if (data.show_on_leaderboard) {
        const checkbox = document.getElementById('show-on-leaderboard');
        if (checkbox) checkbox.checked = true;
      }
    }
  } catch (err) {
    // Silent fail - user can still register manually
    console.error('Email check failed:', err);
  }
}

if (emailInput) {
  emailInput.addEventListener('blur', () => {
    if (emailInput.value && !emailInput.value.includes('@')) {
      emailInput.style.borderColor = 'var(--error)';
    } else {
      emailInput.style.borderColor = '';
    }
  });
}

if (nicknameInput) {
  nicknameInput.addEventListener('input', () => {
    const remaining = 30 - nicknameInput.value.length;
    const helpText = nicknameInput.parentElement.querySelector('.help-text');
    if (remaining < 10) {
      helpText.textContent = `${remaining} characters remaining`;
    } else {
      helpText.textContent = 'Shown on leaderboards (max 30 characters)';
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkLoginState();

  // Set up all copy buttons with data-copy attribute
  document.querySelectorAll('.btn-copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      copyToClipboard(text, btn);
    });
  });
});
