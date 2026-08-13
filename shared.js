// Shared logic for ADO to GitHub Redirector.
// Loaded by the service worker (importScripts), the popup (script tag),
// and the content script (listed before content.js in the manifest).

const DEFAULT_SETTINGS = {
  adoOrg: '',
  githubOrg: '',
  // Comma-separated prefixes stripped from the ADO repository name when
  // building the GitHub URL (repos are often renamed e.g. "hoge" -> "moved_hoge"
  // after migration instead of being archived).
  excludeKeywords: 'moved_'
};

const ADO_REPO_URL_PATTERN = /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/?#]+)/;

function getSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

function isADORepoUrl(url) {
  return typeof url === 'string' && ADO_REPO_URL_PATTERN.test(url);
}

function parseAdoUrl(adoUrl) {
  const match = adoUrl.match(ADO_REPO_URL_PATTERN);
  if (!match) return null;

  const [, adoOrg, projectName, repoName] = match;
  return {
    adoOrg,
    projectName,
    repoName,
    isPullRequest: adoUrl.includes('/pullrequest/')
  };
}

// Strips the first matching excluded prefix from a repository name.
// `excludeKeywords` is a comma-separated list, e.g. "moved_, archived_".
function stripExcludedKeywords(repoName, excludeKeywords) {
  const keywords = (excludeKeywords || '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  for (const keyword of keywords) {
    if (repoName.startsWith(keyword)) {
      return repoName.slice(keyword.length);
    }
  }
  return repoName;
}

function convertToGitHubUrl(adoUrl, settings) {
  const parsed = parseAdoUrl(adoUrl);
  if (!parsed || !settings.githubOrg) return null;

  const repoName = stripExcludedKeywords(parsed.repoName, settings.excludeKeywords);
  const repoUrl = `https://github.com/${settings.githubOrg}/${parsed.projectName}-${repoName}`;

  if (parsed.isPullRequest) {
    // Migrated PRs are typically closed on GitHub, so link to the closed PR list.
    return `${repoUrl}/pulls?q=is%3Aclosed+is%3Apr`;
  }
  return repoUrl;
}
