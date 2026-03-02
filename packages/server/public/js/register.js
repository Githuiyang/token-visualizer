// Registration page JavaScript

const form = document.getElementById('registration-form');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');
const registerSection = document.getElementById('register-form');
const successSection = document.getElementById('success-section');
const apiKeyDisplay = document.getElementById('api-key');
const setupCommand = document.getElementById('setup-command');
const copyKeyBtn = document.getElementById('copy-key-btn');
const copyCommandBtn = document.getElementById('copy-command-btn');

// Sign In Modal
const signInBtn = document.getElementById('sign-in-btn');
const signInModal = document.getElementById('signin-modal');
const signInClose = document.getElementById('signin-close');
const signInForm = document.getElementById('signin-form');
const signInError = document.getElementById('signin-error');

// Show sign in modal
signInBtn.addEventListener('click', () => {
  signInModal.style.display = 'flex';
  signInError.classList.remove('show');
});

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
      // Save to localStorage and redirect
      localStorage.setItem('tokenviz_api_key', apiKey);
      window.location.href = '/dashboard';
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

    showSuccess(data.apiKey, data.existing);
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
});

function showSuccess(apiKey, existing) {
  // Save API key to localStorage for auto-login
  localStorage.setItem('tokenviz_api_key', apiKey);

  apiKeyDisplay.textContent = apiKey;
  setupCommand.textContent = `token-viz config --set-key ${apiKey}`;

  registerSection.style.display = 'none';
  successSection.style.display = 'block';
  setLoading(false);

  if (existing) {
    const successTitle = successSection.querySelector('h2');
    successTitle.textContent = 'Welcome Back!';
  }
}

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
      const btnText = submitBtn.querySelector('.btn-text') || document.createTextNode(submitBtn.textContent);
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
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 3L4 7L8 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17L12 13L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${button.classList.contains('btn-copy-command') ? '' : '<span class="copy-text">Copied!</span>'}
    `;

    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalHTML;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

copyKeyBtn.addEventListener('click', () => {
  copyToClipboard(apiKeyDisplay.textContent, copyKeyBtn);
});

copyCommandBtn.addEventListener('click', () => {
  copyToClipboard(setupCommand.textContent, copyCommandBtn);
});

// Input validation
const emailInput = document.getElementById('email');
const nicknameInput = document.getElementById('nickname');

emailInput.addEventListener('blur', () => {
  if (emailInput.value && !emailInput.value.includes('@')) {
    emailInput.style.borderColor = 'var(--error)';
  } else {
    emailInput.style.borderColor = '';
  }
});

nicknameInput.addEventListener('input', () => {
  const remaining = 30 - nicknameInput.value.length;
  const helpText = nicknameInput.parentElement.querySelector('.help-text');
  if (remaining < 10) {
    helpText.textContent = `${remaining} characters remaining`;
  } else {
    helpText.textContent = 'Shown on leaderboards (max 30 characters)';
  }
});
