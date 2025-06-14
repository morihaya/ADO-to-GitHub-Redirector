// Background script for handling badge and URL redirection
console.log('Background script loaded and ready');

// Simplified approach - only use tabs.onUpdated for better Edge compatibility
// Remove message listener to avoid Service Worker issues

// Listen for tab updates (similar to Azure Quick Jump pattern)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('Tab updated:', tabId, 'Status:', changeInfo.status, 'URL:', tab.url);
  
  if (tab.url && isADOUrl(tab.url)) {
    console.log('Setting ADO badge for tab:', tabId);
    try {
      chrome.action.setBadgeText({ text: "ADO", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ff3333', tabId: tabId });
      chrome.action.setTitle({ 
        title: '🚀 Click to redirect to GitHub - ADO URL detected!',
        tabId: tabId 
      });
      console.log('Badge set successfully for tab:', tabId);
    } catch (error) {
      console.error('Error setting badge for tab:', tabId, error);
    }
  } else {
    console.log('Clearing badge for tab:', tabId);
    try {
      chrome.action.setBadgeText({ text: "", tabId: tabId });
      chrome.action.setTitle({ 
        title: 'ADO to GitHub Redirector',
        tabId: tabId 
      });
      console.log('Badge cleared for tab:', tabId);
    } catch (error) {
      console.error('Error clearing badge for tab:', tabId, error);
    }
  }
});

// Listen for tab activation (similar to Azure Quick Jump pattern)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log('Tab activated:', activeInfo.tabId);
  
  chrome.tabs.query({ "active": true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      console.log('Active tab URL:', tabs[0].url);
      
      if (isADOUrl(tabs[0].url)) {
        console.log('Setting ADO badge for active tab:', activeInfo.tabId);
        try {
          chrome.action.setBadgeText({ text: "ADO", tabId: activeInfo.tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#ff3333', tabId: activeInfo.tabId });
          chrome.action.setTitle({ 
            title: '🚀 Click to redirect to GitHub - ADO URL detected!',
            tabId: activeInfo.tabId 
          });
        } catch (error) {
          console.error('Error setting badge for active tab:', activeInfo.tabId, error);
        }
      } else {
        console.log('Clearing badge for active tab:', activeInfo.tabId);
        try {
          chrome.action.setBadgeText({ text: "", tabId: activeInfo.tabId });
          chrome.action.setTitle({ 
            title: 'ADO to GitHub Redirector',
            tabId: activeInfo.tabId 
          });
        } catch (error) {
          console.error('Error clearing badge for active tab:', activeInfo.tabId, error);
        }
      }
    }
  });
});

// Note: chrome.action.onClicked is not used when default_popup is set in manifest
// The popup will handle both settings and redirection logic

// Extension startup handler
chrome.runtime.onInstalled.addListener(function () {
  console.log('Extension installed/reloaded');
  
  // Check current active tab immediately
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url && isADOUrl(tabs[0].url)) {
      console.log('Extension startup - ADO URL detected:', tabs[0].url);
      try {
        chrome.action.setBadgeText({ text: "ADO", tabId: tabs[0].id });
        chrome.action.setBadgeBackgroundColor({ color: '#ff3333', tabId: tabs[0].id });
        console.log('Startup badge set for tab:', tabs[0].id);
      } catch (error) {
        console.error('Error setting startup badge:', error);
      }
    }
  });
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