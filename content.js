// Content script to detect ADO URLs and communicate with background script
(function() {
  'use strict';

  function isADORepoUrl(url) {
    return url.includes('dev.azure.com') && url.includes('/_git/');
  }

  function convertToGitHubUrl(adoUrl, adoOrg, githubOrg) {
    const urlPattern = /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/;
    const match = adoUrl.match(urlPattern);
    
    if (!match) return null;
    
    const [, urlAdoOrg, projectName, repoName] = match;
    
    // Check if it's a pull request URL
    if (adoUrl.includes('/pullrequest/')) {
      // Redirect to GitHub closed pulls list
      return `https://github.com/${githubOrg}/${projectName}-${repoName}/pulls?q=is%3Aclosed+is%3Apr`;
    }
    
    // For other URLs, redirect to the repository
    return `https://github.com/${githubOrg}/${projectName}-${repoName}`;
  }

  function checkCurrentUrl() {
    const currentUrl = window.location.href;
    
    if (isADORepoUrl(currentUrl)) {
      // Check if repository is disabled
      checkIfRepoDisabled();
    }
  }

  function checkIfRepoDisabled() {
    // Look for specific disabled repository messages
    const bodyText = document.body.textContent;
    
    // Check for specific Azure DevOps disabled repository messages
    const disabledIndicators = [
      'is disabled',
      'This repository has been disabled',
      'contact your project administrator to re-enable it'
    ];
    
    const isDisabled = disabledIndicators.some(indicator => 
      bodyText.includes(indicator)
    );
    
    if (isDisabled) {
      showRedirectSuggestion();
    }
  }

  async function showRedirectSuggestion() {
    // Create a notification banner suggesting to use the extension
    const banner = document.createElement('div');
    banner.id = 'ado-github-redirect-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #007acc, #0066cc);
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border-bottom: 3px solid #005aa3;
      ">
        <strong>📍 Repository Moved to GitHub?</strong>
        <span style="margin: 0 15px;">This repository appears to be disabled or moved.</span>
        <button id="redirect-to-github" style="
          background: #28a745;
          border: 1px solid #1e7e34;
          color: white;
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin: 0 8px;
          font-weight: bold;
        ">🔗 Redirect to GitHub</button>
        <button id="dismiss-banner" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        ">✕ Dismiss</button>
      </div>
    `;
    
    // Remove existing banner if present
    const existingBanner = document.getElementById('ado-github-redirect-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Add redirect functionality
    document.getElementById('redirect-to-github').addEventListener('click', async function() {
      try {
        const settings = await chrome.storage.sync.get(['adoOrg', 'githubOrg']);
        
        if (!settings.adoOrg || !settings.githubOrg) {
          // Show settings prompt
          alert('Please configure your organization settings in the extension popup first.');
          return;
        }
        
        const githubUrl = convertToGitHubUrl(window.location.href, settings.adoOrg, settings.githubOrg);
        if (githubUrl) {
          window.location.href = githubUrl;
        } else {
          alert('Unable to convert this URL to GitHub format.');
        }
      } catch (error) {
        console.error('Error redirecting to GitHub:', error);
        alert('Error occurred while redirecting. Please try using the extension icon.');
      }
    });
    
    // Add dismiss functionality
    document.getElementById('dismiss-banner').addEventListener('click', function() {
      banner.remove();
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.getElementById('ado-github-redirect-banner')) {
        banner.remove();
      }
    }, 10000);
    
    // Adjust body padding to account for banner
    document.body.style.paddingTop = '60px';
    
    // Remove padding when banner is removed
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach(function(node) {
            if (node.id === 'ado-github-redirect-banner') {
              document.body.style.paddingTop = '';
              observer.disconnect();
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true });
  }

  // Check URL on page load
  checkCurrentUrl();

  // Listen for URL changes (for SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      checkCurrentUrl();
    }
  }).observe(document, { subtree: true, childList: true });


  function createVisualIndicator() {
    // Create a small visual indicator on the page if badge fails
    const indicator = document.createElement('div');
    indicator.id = 'ado-github-indicator';
    indicator.innerHTML = '🔗 ADO → GitHub';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff3333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    
    // Remove existing indicator
    const existing = document.getElementById('ado-github-indicator');
    if (existing) existing.remove();
    
    document.body.appendChild(indicator);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.getElementById('ado-github-indicator')) {
        indicator.remove();
      }
    }, 5000);
  }

  function isRepoDisabled() {
    // Look for specific disabled repository messages
    const bodyText = document.body.textContent;
    
    // Check for specific Azure DevOps disabled repository messages
    const disabledIndicators = [
      'is disabled',
      'This repository has been disabled',
      'contact your project administrator to re-enable it'
    ];
    
    return disabledIndicators.some(indicator => 
      bodyText.includes(indicator)
    );
  }

  // Listen for messages from popup and background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentUrl') {
      sendResponse({ url: window.location.href });
    } else if (request.action === 'checkRepoStatus') {
      const isDisabled = isRepoDisabled();
      sendResponse({ isDisabled: isDisabled });
    }
  });

})();