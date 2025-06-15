// Background script for ADO to GitHub Redirector
chrome.tabs.onActivated.addListener(function (tabId) {
    chrome.tabs.query({"active": true}, function (tab) {
        checkAndSetBadge(tab[0]);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    if (info.status === 'complete') {
        checkAndSetBadge(tab);
    }
});

function checkAndSetBadge(tab) {
    if (tab.url && tab.url.match(/dev\.azure\.com.*\/_git\//)) {
        // Send message to content script to check if repo is disabled
        chrome.tabs.sendMessage(tab.id, {action: 'checkRepoStatus'}, (response) => {
            if (chrome.runtime.lastError) {
                // Content script not ready, don't show badge
                chrome.action.setBadgeText({text: "", tabId: tab.id});
                return;
            }
            
            if (response && response.isDisabled) {
                chrome.action.setBadgeText({text: "ADO", tabId: tab.id});
                chrome.action.setBadgeBackgroundColor({ color: [255, 51, 51, 255], tabId: tab.id});
            } else {
                chrome.action.setBadgeText({text: "", tabId: tab.id});
            }
        });
    } else {
        chrome.action.setBadgeText({text: "", tabId: tab.id});
    }
}

// Note: chrome.action.onClicked is not used when default_popup is set in manifest
// The popup will handle both settings and redirection logic

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

// Extension startup handler
chrome.runtime.onInstalled.addListener(function () {
  // Check current active tab immediately
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      checkAndSetBadge(tabs[0]);
    }
  });
  
  // Create context menu
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'redirectToGitHub',
      title: 'Redirect to GitHub',
      contexts: ['page'],
      documentUrlPatterns: ['https://dev.azure.com/*']
    });
  }
});

if (chrome.contextMenus) {
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
}