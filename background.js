// Background script - exact pattern matching Azure Quick Jump
console.log('Background script loaded and ready');

chrome.tabs.onActivated.addListener(function (tabId) {
    console.log('Tab activated:', tabId);
    chrome.tabs.query({"active": true}, function (tab) {
        console.log('Active tab URL:', tab[0].url);
        if (tab[0].url && tab[0].url.match(/dev\.azure\.com.*\/_git\//)) {
            console.log('Setting ADO badge');
            chrome.action.setBadgeText({text:"ADO"});
            chrome.action.setBadgeBackgroundColor({ color: [255, 51, 51, 255]});
        } else {
            console.log('Clearing badge');
            chrome.action.setBadgeText({text:""});
        }
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    console.log('Tab updated:', tabId, 'URL:', tab.url);
    if (tab.url && tab.url.match(/dev\.azure\.com.*\/_git\//)) {
        console.log('Setting ADO badge on update');
        chrome.action.setBadgeText({text:"ADO"});
        chrome.action.setBadgeBackgroundColor({ color: [255, 51, 51, 255]});
    } else {
        console.log('Clearing badge on update');
        chrome.action.setBadgeText({text:""});
    }
});

// Note: chrome.action.onClicked is not used when default_popup is set in manifest
// The popup will handle both settings and redirection logic

// Extension startup handler
chrome.runtime.onInstalled.addListener(function () {
  console.log('Extension installed/reloaded');
  
  // Check current active tab immediately
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url && tabs[0].url.match(/dev\.azure\.com.*\/_git\//)) {
      console.log('Extension startup - ADO URL detected:', tabs[0].url);
      chrome.action.setBadgeText({text:"ADO"});
      chrome.action.setBadgeBackgroundColor({ color: [255, 51, 51, 255]});
    }
  });
});

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