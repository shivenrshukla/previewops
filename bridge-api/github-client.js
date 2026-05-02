/**
 * github-client.js
 * Optional GitHub PR enrichment for the Bridge API.
 *
 * Set these environment variables to enable GitHub integration:
 *   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
 *   GITHUB_REPO=my-org/my-app
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Makes an authenticated request to the GitHub REST API.
 * @param {string} path - API path, e.g. '/repos/org/repo/pulls'
 * @returns {Promise<Object|null>}
 */
async function githubFetch(path) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  try {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers: {
        Authorization:        `Bearer ${GITHUB_TOKEN}`,
        Accept:               'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      console.error(`[github-client] GitHub API ${path} → ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[github-client] Request failed:', err.message);
    return null;
  }
}

/**
 * Fetches all open PRs for the configured repo and returns two indexes:
 *  - byHead: branch name of the PR source  → PR data  (for feature/dev branch cards)
 *  - byBase: branch name of the PR target  → PR[]      (for master/main branch cards)
 */
export async function fetchOpenPRs() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    if (!GITHUB_TOKEN) console.warn('[github-client] GITHUB_TOKEN not set — skipping PR enrichment.');
    if (!GITHUB_REPO)  console.warn('[github-client] GITHUB_REPO not set — skipping PR enrichment.');
    return { byHead: new Map(), byBase: new Map() };
  }

  const prs = await githubFetch(`/repos/${GITHUB_REPO}/pulls?state=open&per_page=100`);
  if (!prs) return { byHead: new Map(), byBase: new Map() };

  const byHead = new Map();
  const byBase = new Map();

  for (const pr of prs) {
    const entry = {
      prNumber:  pr.number,
      title:     pr.title,
      author:    pr.user.login,
      branch:    pr.head.ref,
      baseBranch: pr.base.ref,
      prUrl:     pr.html_url,
      updatedAt: pr.updated_at,
    };

    // Index by head branch (source) — used by feature/dev branch namespace cards
    byHead.set(pr.head.ref, entry);

    // Index by base branch (target) — used by master/main namespace cards
    if (!byBase.has(pr.base.ref)) {
      byBase.set(pr.base.ref, []);
    }
    byBase.get(pr.base.ref).push(entry);
  }

  return { byHead, byBase };
}
