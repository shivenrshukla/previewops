/**
 * DashboardView.jsx
 * Root layout component. Owns no state directly — delegates to useDeployments.
 * Renders the page chrome (header, footer) and composes child components.
 */

import { Terminal, Zap, RefreshCw, CheckCircle2 } from "lucide-react";
import MetricsHeader  from "@/components/MetricsHeader";
import DeploymentGrid from "@/components/DeploymentGrid";
import PreviewsTable  from "@/components/PreviewsTable";
import { useDeployments } from "@/hooks/useDeployments";

export default function DashboardView() {
  const { deployments, handleTeardown, handleRefresh, lastSync } =
    useDeployments();

  const liveCount        = deployments.filter((d) => d.status === "Live").length;
  const provisioningCount = deployments.filter(
    (d) => d.status === "Provisioning"
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Dot-grid texture */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none" />

      {/* Top accent bar */}
      <div
        className="fixed top-0 left-0 right-0 h-px z-50 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, #6366f1 40%, #818cf8 60%, transparent)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-8">

        {/* ── Page Header ─────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div>
            {/* Logo + title */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center
                  shadow-lg shadow-indigo-600/30"
                style={{ background: "#6366f1" }}
              >
                <Terminal size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">
                  PreviewOps Control Center
                </h1>
                <p className="text-zinc-600 text-[11px] font-mono mt-0.5">
                  Kubernetes · Jenkins · GitHub PRs
                </p>
              </div>
            </div>

            {/* Live / provisioning indicators */}
            <div className="ml-12 flex items-center gap-3 flex-wrap">
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveCount} live
                </span>
              )}
              {provisioningCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400 text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {provisioningCount} provisioning
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-zinc-900 border border-zinc-700/50 text-[11px] font-mono text-zinc-400"
            >
              <Zap size={11} className="text-emerald-400" />
              Jenkins · Connected
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold
                text-white transition-all duration-200 shadow-md shadow-indigo-600/20
                active:scale-95 hover:brightness-110"
              style={{ background: "#6366f1" }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </header>

        {/* ── Metrics ─────────────────────────────────────────── */}
        <MetricsHeader deployments={deployments} />

        {/* ── Section title ────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            Pull Request Environments
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-mono">
            <span>{deployments.length} environments</span>
            <span className="text-zinc-700">·</span>
            <span>synced {lastSync}</span>
          </div>
        </div>

        {/* ── Cards ────────────────────────────────────────────── */}
        <DeploymentGrid deployments={deployments} onTeardown={handleTeardown} />

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-950 px-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Live GitHub Integration
            </span>
          </div>
        </div>

        {/* ── Deployment Previews (Bridge API) ─────────────────── */}
        <PreviewsTable />

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer
          className="mt-10 pt-5 border-t border-zinc-800/60
            flex flex-col sm:flex-row items-start sm:items-center
            justify-between gap-2 text-[11px] text-zinc-600 font-mono"
        >
          <div className="flex items-center gap-4">
            <span>PreviewOps v2.4.1</span>
            <span className="text-zinc-700">·</span>
            <span>Cluster: prod-k8s-us-east-1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>All systems operational</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
