// Popup: settings management and manual/auto redirection.
// Shared helpers (getSettings, isADORepoUrl, convertToGitHubUrl) come from
// shared.js, loaded before this file in popup.html.
document.addEventListener('DOMContentLoaded', async function() {
  const adoOrgInput = document.getElementById('adoOrg');
  const githubOrgInput = document.getElementById('githubOrg');
  const excludeKeywordsInput = document.getElementById('excludeKeywords');
  const saveBtn = document.getElementById('saveBtn');
  const redirectBtn = document.getElementById('redirectBtn');
  const status = document.getElementById('status');
  const currentUrlDiv = document.getElementById('currentUrl');
  const urlDisplay = document.getElementById('urlDisplay');

  // Load saved settings
  const settings = await getSettings();
  adoOrgInput.value = settings.adoOrg;
  githubOrgInput.value = settings.githubOrg;
  excludeKeywordsInput.value = settings.excludeKeywords;

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab.url;

  if (isADORepoUrl(currentUrl)) {
    currentUrlDiv.style.display = 'block';
    urlDisplay.textContent = currentUrl;
    redirectBtn.style.display = 'inline-block';

    // Auto-redirect if settings are already configured
    if (settings.adoOrg && settings.githubOrg) {
      const githubUrl = convertToGitHubUrl(currentUrl, settings);
      if (githubUrl) {
        showAutoRedirectCountdown(githubUrl, tab.id);
      }
    }
  }

  saveBtn.addEventListener('click', async function() {
    const adoOrg = adoOrgInput.value.trim();
    const githubOrg = githubOrgInput.value.trim();
    const excludeKeywords = excludeKeywordsInput.value.trim();

    if (!adoOrg || !githubOrg) {
      showStatus('Please fill in both organization names.', 'error');
      return;
    }

    await chrome.storage.sync.set({ adoOrg, githubOrg, excludeKeywords });
    showStatus('Settings saved successfully!', 'success');
  });

  redirectBtn.addEventListener('click', async function() {
    const settings = await getSettings();

    if (!settings.adoOrg || !settings.githubOrg) {
      showStatus('Please configure organization settings first.', 'error');
      return;
    }

    const githubUrl = convertToGitHubUrl(currentUrl, settings);
    if (githubUrl) {
      chrome.tabs.update(tab.id, { url: githubUrl });
      window.close();
    } else {
      showStatus('Cannot convert this URL to GitHub format.', 'error');
    }
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  function showAutoRedirectCountdown(githubUrl, tabId) {
    // Create countdown overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 123, 204, 0.95);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
      ">
        <div style="text-align: center;">
          <h3 style="margin: 0 0 20px 0;">🚀 Auto-Redirecting to GitHub</h3>
          <div style="font-size: 48px; font-weight: bold; margin: 20px 0;" id="countdown">3</div>
          <div style="margin: 10px 0;">
            <button id="redirectNow" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Redirect Now</button>
            <button id="cancelRedirect" style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 5px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">Cancel</button>
          </div>
          <div style="font-size: 12px; opacity: 0.8; max-width: 300px; word-break: break-all;">
            Target: ${githubUrl}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let countdown = 3;
    const countdownElement = document.getElementById('countdown');

    const timer = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;

      if (countdown <= 0) {
        clearInterval(timer);
        chrome.tabs.update(tabId, { url: githubUrl });
        window.close();
      }
    }, 1000);

    document.getElementById('redirectNow').addEventListener('click', () => {
      clearInterval(timer);
      chrome.tabs.update(tabId, { url: githubUrl });
      window.close();
    });

    document.getElementById('cancelRedirect').addEventListener('click', () => {
      clearInterval(timer);
      overlay.remove();
    });
  }
});
