// Background script for BOG Cloud Extension

let currentUser = null;
let currentToken = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getCredentials':
      getCredentials(request.url).then(sendResponse);
      return true;
    case 'saveCredentials':
      saveCredentials(request.data).then(sendResponse);
      return true;
    case 'checkSite':
      checkSite(request.url).then(sendResponse);
      return true;
    case 'logout':
      logout();
      sendResponse({ success: true });
      return true;
    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

// Get credentials for current site
async function getCredentials(url) {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`http://localhost:5001/api/v1/extension/credentials?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get credentials error:', error);
    return { error: error.message };
  }
}

// Save credentials from extension
async function saveCredentials(data) {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch('http://localhost:5001/api/v1/extension/credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Save credentials error:', error);
    return { error: error.message };
  }
}

// Check if site has credentials
async function checkSite(url) {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`http://localhost:5001/api/v1/extension/check?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Check site error:', error);
    return { error: error.message };
  }
}

// Get stored token
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token);
    });
  });
}

// Logout
function logout() {
  chrome.storage.local.remove(['token', 'user']);
  currentUser = null;
  currentToken = null;
}

// Listen for login from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'login') {
    chrome.storage.local.set({
      token: request.token,
      user: request.user
    }, () => {
      currentToken = request.token;
      currentUser = request.user;
      sendResponse({ success: true });
    });
    return true;
  }
});