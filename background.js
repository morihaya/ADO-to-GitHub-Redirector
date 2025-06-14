// Background script for handling badge and URL redirection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showBadge') {
    // Show badge on extension icon when on ADO URL
    chrome.action.setBadgeText({
      text: '→',
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#28a745',
      tabId: sender.tab.id
    });
    
    chrome.action.setTitle({
      title: 'Click to redirect to GitHub',
      tabId: sender.tab.id
    });
  }
});

// Clear badge when navigating away from ADO URLs and show badge when on ADO URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isADOUrl(tab.url)) {
      // Show badge when on ADO URL
      chrome.action.setBadgeText({
        text: '→',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#28a745',
        tabId: tabId
      });
      
      chrome.action.setTitle({
        title: 'Click to redirect to GitHub',
        tabId: tabId
      });
    } else {
      // Clear badge when not on ADO URL
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
      
      chrome.action.setTitle({
        title: 'ADO to GitHub Redirector',
        tabId: tabId
      });
    }
  }
});

// Handle extension icon click for direct redirection
chrome.action.onClicked.addListener(async (tab) => {
  if (isADOUrl(tab.url)) {
    const settings = await chrome.storage.sync.get(['adoOrg', 'githubOrg']);
    
    if (!settings.adoOrg || !settings.githubOrg) {
      // Open popup if settings not configured
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      return;
    }
    
    const githubUrl = convertToGitHubUrl(tab.url, settings.adoOrg, settings.githubOrg);
    if (githubUrl) {
      chrome.tabs.update(tab.id, { url: githubUrl });
    }
  } else {
    // Show popup for settings when not on ADO URL
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});

function isADOUrl(url) {
  return url && url.includes('dev.azure.com') && url.includes('/_git/');
}

function convertToGitHubUrl(adoUrl, adoOrg, githubOrg) {
  const urlPattern = /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/;
  const match = adoUrl.match(urlPattern);
  
  if (!match) return null;
  
  const [, urlAdoOrg, projectName, repoName] = match;
  
  // Check if it's a pull request URL
  if (adoUrl.includes('/pullrequest/')) {
    // Redirect to GitHub pulls list
    return `https://github.com/${githubOrg}/${projectName}-${repoName}/pulls`;
  }
  
  // For other URLs, redirect to the repository
  return `https://github.com/${githubOrg}/${projectName}-${repoName}`;
}

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'redirectToGitHub',
    title: 'Redirect to GitHub',
    contexts: ['page'],
    documentUrlPatterns: ['https://dev.azure.com/*']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'redirectToGitHub') {
    const settings = await chrome.storage.sync.get(['adoOrg', 'githubOrg']);
    
    if (!settings.adoOrg || !settings.githubOrg) {
      // Open popup if settings not configured
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      return;
    }
    
    const githubUrl = convertToGitHubUrl(tab.url, settings.adoOrg, settings.githubOrg);
    if (githubUrl) {
      chrome.tabs.update(tab.id, { url: githubUrl });
    }
  }
});