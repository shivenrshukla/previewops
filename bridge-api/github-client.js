/**
 * github-client.js
 * Optional GitHub PR enrichment for the Bridge API.
 *
 * Set these environment variables to enable GitHub integration:
 *   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
 *   GITHUB_REPO=my-org/my-app
 *
 * If either variable is missing, all functions return empty Maps
 * and the dashboard falls back to namespace-only data gracefully.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_REPO;

const GITHUB_API   = 'https://api.github.com';

/**
 * Makes an authenticated request to the GitHub REST API.
 * @param {string} path - API path, e.g. '/repos/org/repo/pulls'
 * @returns {Promise<Object|null>}
 */
async function githubFetch(path) {
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
 * Fetches all open PRs for the configured repo and returns them
 * indexed by PR number for O(1) lookup when enriching namespace data.
 *
 * @returns {Promise<Map<number, {
 *   prNumber: number,
 *   title:    string,
 *   author:   string,
 *   branch:   string,
 *   prUrl:    string,
 *   updatedAt:string,
 * }>>}
 */
export async function fetchOpenPRs() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    if (!GITHUB_TOKEN) console.warn('[github-client] GITHUB_TOKEN not set — skipping PR enrichment.');
    if (!GITHUB_REPO)  console.warn('[github-client] GITHUB_REPO not set — skipping PR enrichment.');
    return new Map();
  }

  const prs = await githubFetch(`/repos/${GITHUB_REPO}/pulls?state=open&per_page=100`);
  if (!prs) return new Map();

  return new Map(
    prs.map((pr) => [
      pr.number,
      {
        prNumber:  pr.number,
        title:     pr.title,
        author:    pr.user.login,
        branch:    pr.head.ref,
        prUrl:     pr.html_url,
        updatedAt: pr.updated_at,
      },
    ])
  );
}
