/**
 * usePreviews.js
 * Fetches live GitHub PR + Kubernetes namespace data from the Bridge API.
 *
 * Responsibilities:
 *  - Initial fetch on mount
 *  - Auto-poll every POLL_INTERVAL_MS (30s by default)
 *  - Expose manual refresh, loading, and error states
 *  - Build the dynamic preview URL from the PR number
 *
 * To swap the API base URL per environment, set:
 *   VITE_BRIDGE_API_URL=http://bridge-api.preview.svc.cluster.local:4000
 * in your .env.local file.
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Detects the Bridge API base URL dynamically based on the current window location.
 * This solves the "Localhost Trap" in EKS by deriving the API host from the dashboard host.
 *
 * Example:
 *  - Dashboard: http://env-123.previewops.local -> API: http://api-env-123.previewops.local
 *  - Dashboard: http://localhost:3000       -> API: http://localhost:4000
 */
const getDynamicApiBase = () => {
  if (typeof window === "undefined") return "";

  const { hostname } = window.location;
  const envVar = import.meta.env.VITE_BRIDGE_API_URL;

  // 1. Manual override takes precedence if it's a valid full URL
  // We check for "${" to avoid using un-evaluated templates from .env
  if (envVar && envVar.startsWith("http") && !envVar.includes("${")) {
    return envVar;
  }

  // 2. Always use same-origin (empty string) — the Express server serves both
  //    the React frontend AND the /api/* routes on the same host and port.
  //    This works for both local dev (Vite proxy handles /api → :3000)
  //    and production EKS (env-{branch}.previewops.local serves everything).
  return "";
};

const BRIDGE_API_BASE = getDynamicApiBase();

const POLL_INTERVAL_MS = 30_000;

/**
 * Constructs the dynamic preview URL for a given branch name.
 * Matches your NGINX Ingress rule: http://env-{branch}.previewops.local
 *
 * @param {string} branch
 * @returns {string}
 */
export function buildPreviewUrl(branch) {
  const base =
    import.meta.env.VITE_PREVIEW_BASE_URL ?? "http://env-{branch}.previewops.local";
  return base.replace("{branch}", branch);
}

/**
 * @typedef {Object} PreviewEntry
 * @property {number}   prNumber   - GitHub PR number
 * @property {string}   title      - PR title
 * @property {string}   author     - GitHub username
 * @property {string}   branch     - Head branch name
 * @property {string}   status     - "Live" | "Building" | "Pending"
 * @property {string}   previewUrl - Constructed preview URL
 * @property {string}   namespace  - Kubernetes namespace (e.g. preview-pr-42)
 * @property {boolean}  hasK8s     - Whether namespace was found in the cluster
 * @property {string}   updatedAt  - ISO timestamp of last PR activity
 * @property {string}   prUrl      - Link to the PR on GitHub
 */

/**
 * @returns {{
 *   previews:      PreviewEntry[],
 *   loading:       boolean,
 *   error:         string | null,
 *   lastFetched:   Date | null,
 *   refresh:       () => void,
 * }}
 */
export function usePreviews() {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Stable ref so the interval callback always sees the latest fetch fn
  const fetchRef = useRef(null);

  const fetchPreviews = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${BRIDGE_API_BASE}/api/previews`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      /** @type {PreviewEntry[]} */
      const data = await res.json();

      // Detect current branch from hostname (e.g. env-master.previewops.local -> master)
      const host = window.location.hostname;
      const match = host.match(/^env-(.+)\.previewops\.local$/);
      const currentBranch = match ? match[1] : null;

      // Filter and enrich
      const enriched = data
        .filter((p) => {
          // If we can't detect a branch (e.g. localhost), show everything
          if (!currentBranch) return true;

          // If this is a PR card (it has a target), only show it on the target dashboard
          if (p.targetBranch) {
            return p.targetBranch === currentBranch;
          }

          // Otherwise, it's a standalone branch environment; only show it on its own dashboard
          return p.branch === currentBranch;
        })
        .map((p) => ({
          ...p,
          previewUrl: p.previewUrl ?? buildPreviewUrl(p.branch),
        }));

      setPreviews(enriched);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message ?? "Failed to fetch previews");
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep ref in sync
  fetchRef.current = fetchPreviews;

  // Mount fetch + polling interval
  useEffect(() => {
    fetchRef.current();

    const interval = setInterval(() => {
      fetchRef.current();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []); // empty deps — intentional; polling is self-managed via ref

  return {
    previews,
    loading,
    error,
    lastFetched,
    refresh: fetchPreviews,
  };
}
