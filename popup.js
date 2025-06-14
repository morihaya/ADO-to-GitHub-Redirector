document.addEventListener('DOMContentLoaded', async function() {
  const adoOrgInput = document.getElementById('adoOrg');
  const githubOrgInput = document.getElementById('githubOrg');
  const saveBtn = document.getElementById('saveBtn');
  const redirectBtn = document.getElementById('redirectBtn');
  const status = document.getElementById('status');
  const currentUrlDiv = document.getElementById('currentUrl');
  const urlDisplay = document.getElementById('urlDisplay');

  // Load saved settings
  const result = await chrome.storage.sync.get(['adoOrg', 'githubOrg']);
  if (result.adoOrg) adoOrgInput.value = result.adoOrg;
  if (result.githubOrg) githubOrgInput.value = result.githubOrg;

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab.url;
  
  if (isADOUrl(currentUrl)) {
    currentUrlDiv.style.display = 'block';
    urlDisplay.textContent = currentUrl;
    redirectBtn.style.display = 'inline-block';
    
    // Auto-redirect if settings are already configured
    if (result.adoOrg && result.githubOrg) {
      const githubUrl = await convertToGitHubUrl(currentUrl, result.adoOrg, result.githubOrg);
      if (githubUrl) {
        // Show a countdown before auto-redirect
        showAutoRedirectCountdown(githubUrl, tab.id);
      }
    }
  }

  // Save settings
  saveBtn.addEventListener('click', async function() {
    const adoOrg = adoOrgInput.value.trim();
    const githubOrg = githubOrgInput.value.trim();
    
    if (!adoOrg || !githubOrg) {
      showStatus('Please fill in both organization names.', 'error');
      return;
    }
    
    await chrome.storage.sync.set({ adoOrg, githubOrg });
    showStatus('Settings saved successfully!', 'success');
  });

  // Redirect to GitHub
  redirectBtn.addEventListener('click', async function() {
    const settings = await chrome.storage.sync.get(['adoOrg', 'githubOrg']);
    
    if (!settings.adoOrg || !settings.githubOrg) {
      showStatus('Please configure organization settings first.', 'error');
      return;
    }
    
    const githubUrl = await convertToGitHubUrl(currentUrl, settings.adoOrg, settings.githubOrg);
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

  function isADOUrl(url) {
    return url && url.includes('dev.azure.com') && url.includes('/_git/');
  }

  async function convertToGitHubUrl(adoUrl, adoOrg, githubOrg) {
    const urlPattern = /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/;
    const match = adoUrl.match(urlPattern);
    
    if (!match) return null;
    
    const [, urlAdoOrg, projectName, repoName] = match;
    
    // Check if the ADO org matches the configured one
    if (urlAdoOrg !== adoOrg) {
      console.warn(`URL ADO org (${urlAdoOrg}) doesn't match configured org (${adoOrg})`);
    }
    
    // Check if it's a pull request URL
    if (adoUrl.includes('/pullrequest/')) {
      const prMatch = adoUrl.match(/\/pullrequest\/(\d+)/);
      if (prMatch) {
        const prId = prMatch[1];
        
        // Try to get PR title from ADO API for better GitHub search
        try {
          const prTitle = await getPRTitle(urlAdoOrg, projectName, repoName, prId);
          if (prTitle) {
            const encodedTitle = encodeURIComponent(prTitle);
            return `https://github.com/${githubOrg}/${projectName}-${repoName}/pulls?q=is%3Apr+${encodedTitle}`;
          }
        } catch (error) {
          console.log('Could not fetch PR title, using pulls list instead');
        }
      }
      
      // Fallback to pulls list
      return `https://github.com/${githubOrg}/${projectName}-${repoName}/pulls`;
    }
    
    // For other URLs, redirect to the repository
    return `https://github.com/${githubOrg}/${projectName}-${repoName}`;
  }

  async function getPRTitle(adoOrg, project, repo, prId) {
    try {
      // This would require authentication to ADO API
      // For now, we'll skip this and just redirect to pulls list
      return null;
    } catch (error) {
      console.error('Error fetching PR title:', error);
      return null;
    }
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

    // Redirect now button
    document.getElementById('redirectNow').addEventListener('click', () => {
      clearInterval(timer);
      chrome.tabs.update(tabId, { url: githubUrl });
      window.close();
    });

    // Cancel button
    document.getElementById('cancelRedirect').addEventListener('click', () => {
      clearInterval(timer);
      overlay.remove();
    });
  }
});