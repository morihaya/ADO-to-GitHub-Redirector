// Background service worker for ADO to GitHub Redirector
importScripts('shared.js');

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!chrome.runtime.lastError && tab) {
      checkAndSetBadge(tab);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete') {
    checkAndSetBadge(tab);
  }
});

function checkAndSetBadge(tab) {
  if (!tab.id) return;

  if (!isADORepoUrl(tab.url)) {
    chrome.action.setBadgeText({ text: '', tabId: tab.id });
    return;
  }

  // Ask the content script whether the repository is disabled
  chrome.tabs.sendMessage(tab.id, { action: 'checkRepoStatus' }, (response) => {
    if (chrome.runtime.lastError || !response || !response.isDisabled) {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
      return;
    }
    chrome.action.setBadgeText({ text: 'ADO', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: [255, 51, 51, 255], tabId: tab.id });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      checkAndSetBadge(tabs[0]);
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'redirectToGitHub',
      title: 'Redirect to GitHub',
      contexts: ['page'],
      documentUrlPatterns: ['https://dev.azure.com/*']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'redirectToGitHub') return;

  const settings = await getSettings();
  if (!settings.adoOrg || !settings.githubOrg) {
    // Open the settings page if not configured yet
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    return;
  }

  const githubUrl = convertToGitHubUrl(tab.url, settings);
  if (githubUrl) {
    chrome.tabs.update(tab.id, { url: githubUrl });
  }
});
