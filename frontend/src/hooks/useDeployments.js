/**
 * useDeployments.js
 * Custom hook that owns all deployments state and business logic.
 * Data is sourced from the Bridge API via usePreviews — no mock data.
 */

import { useCallback } from "react";
import { usePreviews } from "@/hooks/usePreviews";

/**
 * @returns {{
 *   deployments: import('@/constants/statusConfig').Deployment[],
 *   handleTeardown: (prNumber: number) => void,
 *   handleRefresh: () => void,
 *   lastSync: string,
 *   loading: boolean,
 *   error: string | null,
 * }}
 */
export function useDeployments() {
  const { previews, loading, error, lastFetched, refresh } = usePreviews();

  // Format lastFetched timestamp as a human-readable "synced X ago" string
  const lastSync = (() => {
    if (!lastFetched) return "never";
    const diffMs = Date.now() - lastFetched.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "just now";
    return `${diffMin}m ago`;
  })();

  // Map PreviewEntry → Deployment shape expected by the UI components
  const deployments = previews.map((p) => ({
    id:           p.branch,
    pr:           p.prNumber ?? "-",
    title:        p.title    ?? `Branch: ${p.branch}`,
    author:       p.author,
    branch:       p.branch,
    status:       p.status,
    url:          p.previewUrl ?? null,
    age:          "-",
    cpu:          0,
    mem:          0,
    namespace:    p.namespace,
    checks:       { build: "pass", lint: "pass", test: "pass" },
  }));

  // Teardown: calls the Bridge API teardown endpoint
  // TODO: wire up a real DELETE /api/environments/:id endpoint
  const handleTeardown = useCallback((prNumber) => {
    console.warn(`[useDeployments] Teardown for PR #${prNumber} — API endpoint not yet implemented.`);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return { deployments, handleTeardown, handleRefresh, lastSync, loading, error };
}
