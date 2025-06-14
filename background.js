// Background script for handling badge and URL redirection
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'showBadge') {
    // Show active icon and badge when on ADO URL
    try {
      await chrome.action.setIcon({
        tabId: sender.tab.id,
        path: {
          '16': 'active-icon16.png',
          '32': 'active-icon32.png',
          '48': 'active-icon48.png',
          '128': 'active-icon128.png'
        }
      });
      
      await chrome.action.setBadgeText({
        text: '→',
        tabId: sender.tab.id
      });
      
      await chrome.action.setBadgeBackgroundColor({
        color: '#28a745',
        tabId: sender.tab.id
      });
      
      await chrome.action.setTitle({
        title: 'Click to redirect to GitHub',
        tabId: sender.tab.id
      });
    } catch (error) {
      console.error('Error setting badge from content script:', error);
    }
  }
});

// Clear badge when navigating away from ADO URLs and show badge when on ADO URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isADOUrl(tab.url)) {
      // Show active icon and badge when on ADO URL
      try {
        await chrome.action.setIcon({
          tabId: tabId,
          path: {
            '16': 'active-icon16.png',
            '32': 'active-icon32.png',
            '48': 'active-icon48.png',
            '128': 'active-icon128.png'
          }
        });
        
        await chrome.action.setBadgeText({
          text: '→',
          tabId: tabId
        });
        
        await chrome.action.setBadgeBackgroundColor({
          color: '#28a745',
          tabId: tabId
        });
        
        await chrome.action.setTitle({
          title: 'Click to redirect to GitHub',
          tabId: tabId
        });
      } catch (error) {
        console.error('Error setting active icon:', error);
      }
    } else {
      // Reset to default icon and clear badge when not on ADO URL
      try {
        await chrome.action.setIcon({
          tabId: tabId,
          path: {
            '16': 'icon16.png',
            '32': 'icon32.png',
            '48': 'icon48.png',
            '128': 'icon128.png'
          }
        });
        
        await chrome.action.setBadgeText({
          text: '',
          tabId: tabId
        });
        
        await chrome.action.setTitle({
          title: 'ADO to GitHub Redirector',
          tabId: tabId
        });
      } catch (error) {
        console.error('Error setting default icon:', error);
      }
    }
  }
});

// Note: chrome.action.onClicked is not used when default_popup is set in manifest
// The popup will handle both settings and redirection logic

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