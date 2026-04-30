/**
 * DeploymentCard.jsx
 * Displays all metadata for a single ephemeral preview environment.
 * Handles teardown UI state: idle → loading spinner → destroyed (disabled).
 */

import { GitPullRequest, ExternalLink, Trash2, Clock, User, GitBranch, DollarSign, Loader2, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { STATUS_CONFIG, DISABLED_STATUSES } from "@/constants/statusConfig";

/**
 * @param {{
 *   deployment: import('@/constants/statusConfig').Deployment,
 *   onTeardown:  (prNumber: number) => void,
 * }} props
 */
export default function DeploymentCard({ deployment, onTeardown }) {
  const { prNumber, author, branch, status, liveUrl, uptime, costEstimate } =
    deployment;

  const cfg         = STATUS_CONFIG[status] ?? STATUS_CONFIG["Destroyed"];
  const isDestroyed = status === "Destroyed";
  const isTearingDown  = status === "Tearing Down...";
  const isProvisioning = status === "Provisioning";
  const isDisabled     = DISABLED_STATUSES.has(status);

  return (
    <article
      className={`
        flex flex-col gap-4 rounded-xl p-5 animate-slide-up
        border border-zinc-800/70 bg-zinc-900/70
        transition-all duration-300
        ${!isDestroyed
          ? "hover:border-zinc-700/80 hover:bg-zinc-900"
          : "opacity-55"}
      `}
      style={{ borderLeft: `2px solid ${cfg.leftBorder}` }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        {/* PR identity */}
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 min-w-0 group transition-all
            ${liveUrl ? "hover:translate-x-1" : "cursor-default opacity-80"}`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
              ${isDestroyed
                ? "bg-zinc-800/60"
                : "bg-zinc-800 border border-zinc-700/50 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/20"}`}
          >
            <Globe
              size={15}
              className={isDestroyed ? "text-zinc-600" : "text-indigo-400 group-hover:text-indigo-300"}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm font-mono group-hover:text-indigo-300">
                Live Preview
              </span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User size={10} className="text-zinc-600" />
              <span className="text-zinc-500 text-[11px] font-mono truncate">{author}</span>
            </div>
          </div>
        </a>

        {/* Teardown button */}
        <TeardownButton
          isDestroyed={isDestroyed}
          isTearingDown={isTearingDown}
          isDisabled={isDisabled}
          onClick={() => onTeardown(prNumber)}
        />
      </div>

      {/* ── Branch name ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
        <GitBranch size={12} className="text-zinc-500 flex-shrink-0" />
        <span className="text-zinc-300 text-[11px] font-mono truncate">{branch}</span>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Clock} label="Uptime" value={uptime} />
        <Stat
          icon={DollarSign}
          label="Cost"
          value={costEstimate}
          valueClass={isDestroyed ? "text-emerald-400" : "text-zinc-200"}
        />
      </div>

      {/* ── Live URL / status placeholder ───────────────────── */}
      <UrlRow
        liveUrl={liveUrl}
        isDestroyed={isDestroyed}
        isProvisioning={isProvisioning}
      />
    </article>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function TeardownButton({ isDestroyed, isTearingDown, isDisabled, onClick }) {
  const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 flex-shrink-0";

  const variant = isDestroyed
    ? "bg-transparent border-zinc-700/30 text-zinc-600 cursor-not-allowed"
    : isTearingDown
    ? "bg-orange-950/40 border-orange-500/30 text-orange-400 cursor-not-allowed"
    : "bg-red-950/40 border-red-500/20 text-red-400 hover:bg-red-950/70 hover:border-red-500/40 hover:text-red-300 active:scale-95 cursor-pointer";

  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={`${base} ${variant}`}
      aria-label={
        isDestroyed ? "Environment destroyed" : "Tear down environment"
      }
    >
      {isTearingDown ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isDestroyed ? (
        <XCircle size={11} />
      ) : (
        <Trash2 size={11} />
      )}
      {isTearingDown ? "Tearing Down" : isDestroyed ? "Destroyed" : "Teardown"}
    </button>
  );
}

function Stat({ icon: Icon, label, value, valueClass = "text-zinc-200" }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-zinc-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="data-label mb-0.5">{label}</p>
        <p className={`text-sm font-mono font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function UrlRow({ liveUrl, isDestroyed, isProvisioning }) {
  if (liveUrl) {
    return (
      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-lg border
          bg-indigo-950/30 border-indigo-500/20 text-indigo-400
          hover:bg-indigo-950/60 hover:border-indigo-500/40 hover:text-indigo-300
          transition-all duration-200 group"
      >
        <Globe
          size={11}
          className="flex-shrink-0 group-hover:scale-110 transition-transform"
        />
        <span className="text-[11px] font-mono truncate">Open Live Changes</span>
        <ExternalLink size={10} className="ml-auto opacity-50" />
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700/30 bg-zinc-800/20 text-[11px] font-mono">
      {isProvisioning ? (
        <>
          <Loader2 size={11} className="animate-spin text-amber-500/70 flex-shrink-0" />
          <span className="text-amber-600/80">Generating preview URL…</span>
        </>
      ) : (
        <>
          <XCircle size={11} className="text-zinc-600 flex-shrink-0" />
          <span className="text-zinc-600">No URL — environment inactive</span>
        </>
      )}
    </div>
  );
}
