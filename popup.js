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
});