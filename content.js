// Content script to detect ADO URLs and communicate with background script
(function() {
  'use strict';

  function isADORepoUrl(url) {
    return url.includes('dev.azure.com') && url.includes('/_git/');
  }

  function checkCurrentUrl() {
    const currentUrl = window.location.href;
    
    if (isADORepoUrl(currentUrl)) {
      // Send message to background script to show badge
      chrome.runtime.sendMessage({
        action: 'showBadge',
        url: currentUrl
      });
      
      // Check if repository is disabled
      checkIfRepoDisabled();
    }
  }

  function checkIfRepoDisabled() {
    // Look for common indicators that the repo is disabled
    const indicators = [
      'This repository has been disabled',
      'Repository not found',
      'Access denied',
      'disabled',
      'not available'
    ];
    
    const bodyText = document.body.textContent.toLowerCase();
    const isDisabled = indicators.some(indicator => 
      bodyText.includes(indicator.toLowerCase())
    );
    
    if (isDisabled) {
      showRedirectSuggestion();
    }
  }

  function showRedirectSuggestion() {
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
        <span style="margin: 0 15px;">Click the ADO to GitHub Redirector extension icon to redirect to the corresponding GitHub repository.</span>
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

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentUrl') {
      sendResponse({ url: window.location.href });
    }
  });

})();