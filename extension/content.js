// Content script for BOG Cloud Extension

let credentials = null;
let activeInputs = {
  username: null,
  password: null
};

// Detect login forms on page
function detectLoginForms() {
  const forms = document.querySelectorAll('form');
  const loginForms = [];

  forms.forEach(form => {
    const hasPassword = form.querySelector('input[type="password"]');
    const hasUsername = form.querySelector('input[type="email"]') || 
                        form.querySelector('input[name="username"]') ||
                        form.querySelector('input[name="user"]') ||
                        form.querySelector('input[type="text"]');

    if (hasPassword && hasUsername) {
      loginForms.push(form);
    }
  });

  return loginForms;
}

// Get credentials from background
async function getCredentialsForSite() {
  const url = window.location.href;
  const response = await chrome.runtime.sendMessage({
    action: 'getCredentials',
    url: url
  });

  if (response && response.data && response.data.credentials) {
    credentials = response.data.credentials;
    return credentials;
  }
  return null;
}

// Auto-fill login form
async function autoFill() {
  const creds = await getCredentialsForSite();
  if (!creds || creds.length === 0) return;

  const loginForms = detectLoginForms();
  if (loginForms.length === 0) return;

  // Fill the first login form
  const form = loginForms[0];
  const cred = creds[0];

  const usernameInput = form.querySelector('input[type="email"]') || 
                        form.querySelector('input[name="username"]') ||
                        form.querySelector('input[name="user"]') ||
                        form.querySelector('input[type="text"]');

  const passwordInput = form.querySelector('input[type="password"]');

  if (usernameInput && cred.username) {
    usernameInput.value = cred.username;
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (passwordInput) {
    passwordInput.value = cred.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Show notification
  showNotification(`✅ Auto-filled for ${cred.siteName}`);
}

// Show notification on page
function showNotification(message) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4F46E5;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.3s';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

// Add auto-fill button next to login form
function addAutoFillButton() {
  const loginForms = detectLoginForms();
  if (loginForms.length === 0) return;

  loginForms.forEach(form => {
    const existingButton = form.querySelector('.bog-auto-fill-btn');
    if (existingButton) return;

    const button = document.createElement('button');
    button.className = 'bog-auto-fill-btn';
    button.textContent = '🔑 Auto-fill';
    button.style.cssText = `
      background: #4F46E5;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin: 4px 0;
    `;
    button.onclick = autoFill;
    form.prepend(button);
  });
}

// Listen for page load
window.addEventListener('load', () => {
  setTimeout(() => {
    addAutoFillButton();
    // Auto-fill if enabled in settings
    chrome.storage.local.get(['autoFillEnabled'], (result) => {
      if (result.autoFillEnabled !== false) {
        autoFill();
      }
    });
  }, 500);
});

// Listen for URL changes (SPA support)
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(() => {
      addAutoFillButton();
    }, 500);
  }
}, 1000);