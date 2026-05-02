/**
 * DeploymentGrid.jsx
 * Pure layout wrapper — maps deployments → DeploymentCard grid.
 * Handles the empty state when no deployments exist.
 */

import DeploymentCard from "@/components/DeploymentCard";
import { Server } from "lucide-react";

/**
 * @param {{
 *   deployments: import('@/constants/statusConfig').Deployment[],
 *   onTeardown:  (prNumber: number) => void,
 * }} props
 */
export default function DeploymentGrid({ deployments, onTeardown }) {
  if (deployments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {deployments.map((dep) => (
        <DeploymentCard
          key={dep.branch}
          deployment={dep}
          onTeardown={onTeardown}
        />
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-xl
      border border-dashed border-zinc-800 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/40
        flex items-center justify-center mb-4">
        <Server size={20} className="text-zinc-600" />
      </div>
      <p className="text-zinc-400 font-medium text-sm mb-1">No environments found</p>
      <p className="text-zinc-600 text-xs font-mono">
        Open a GitHub pull request to provision a preview environment.
      </p>
    </div>
  );
}
