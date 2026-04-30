/**
 * PreviewsTable.jsx
 *
 * Renders active GitHub PRs cross-referenced with live Kubernetes namespaces.
 * Drops into DashboardView below the existing DeploymentGrid section.
 *
 * Layout:
 *  - Desktop: full-width table with sortable columns
 *  - Mobile:  stacked cards (table becomes unreadable below md breakpoint)
 */

import { useState } from "react";
import {
  ExternalLink, GitPullRequest, RefreshCw,
  AlertCircle, Loader2, Github, Clock,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Globe, Server,
} from "lucide-react";
import { usePreviews } from "@/hooks/usePreviews";

/* ── Status badge config (mirrors STATUS_CONFIG pattern) ──────────────────── */
const PREVIEW_STATUS = {
  Live: {
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    dot:   "bg-emerald-400",
    pulse: false,
  },
  Building: {
    badge: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    dot:   "bg-amber-400",
    pulse: true,
  },
  Pending: {
    badge: "bg-zinc-800/60 text-zinc-500 border border-zinc-700/40",
    dot:   "bg-zinc-600",
    pulse: false,
  },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function timeAgo(isoString) {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function PreviewBadge({ status }) {
  const cfg = PREVIEW_STATUS[status] ?? PREVIEW_STATUS.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-[11px] font-medium tracking-wide ${cfg.badge}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}
          ${cfg.pulse ? "animate-pulse" : ""}`}
      />
      {status}
    </span>
  );
}

function SortIcon({ column, sortKey, dir }) {
  if (sortKey !== column)
    return <ChevronsUpDown size={11} className="text-zinc-700" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-indigo-400" />
    : <ChevronDown size={11} className="text-indigo-400" />;
}

function LoadingRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <tr key={i} className="border-t border-zinc-800/50">
      {[40, 28, 16, 12, 12].map((w, j) => (
        <td key={j} className="px-4 py-3.5">
          <div
            className="h-3 rounded bg-zinc-800 animate-pulse"
            style={{ width: `${w}%` }}
          />
        </td>
      ))}
    </tr>
  ));
}

function EmptyRow() {
  return (
    <tr className="border-t border-zinc-800/50">
      <td colSpan={5} className="px-4 py-10 text-center">
        <div className="flex flex-col items-center gap-2">
          <GitPullRequest size={20} className="text-zinc-700" />
          <p className="text-zinc-500 text-sm">No open pull requests found</p>
          <p className="text-zinc-600 text-[11px] font-mono">
            Open a PR on shivenrshukla/previewops to trigger a preview build
          </p>
        </div>
      </td>
    </tr>
  );
}

/* ── Mobile card (< md breakpoint) ───────────────────────────────────────── */
function MobileCard({ preview }) {
  const isLive = preview.status === "Live";
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-800/70
        bg-zinc-900/70 animate-slide-up"
      style={{
        borderLeft: `2px solid ${isLive ? "#10b981" : preview.status === "Building" ? "#f59e0b" : "#3f3f46"}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitPullRequest size={14} className="text-indigo-400 flex-shrink-0" />
          <span className="text-white font-bold text-sm font-mono">
            #{preview.prNumber}
          </span>
          <PreviewBadge status={preview.status} />
        </div>
        <a
          href={preview.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          aria-label="Open PR on GitHub"
        >
          <Github size={14} />
        </a>
      </div>

      <p className="text-zinc-300 text-xs font-medium truncate">{preview.title}</p>

      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
        <span className="truncate">@{preview.author}</span>
        <span className="text-zinc-700">·</span>
        <span className="truncate">{preview.branch}</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600">
        <Server size={10} className="flex-shrink-0" />
        <span className="truncate">{preview.namespace}</span>
        {preview.hasK8s && (
          <span className="text-emerald-600 ml-auto">✓ cluster</span>
        )}
      </div>

      {isLive ? (
        <a
          href={preview.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border
            bg-indigo-950/30 border-indigo-500/20 text-indigo-400 text-xs font-semibold
            hover:bg-indigo-950/60 hover:border-indigo-500/40 hover:text-indigo-300
            transition-all duration-200 group"
        >
          <Globe size={12} className="group-hover:scale-110 transition-transform" />
          View Deployment
          <ExternalLink size={10} />
        </a>
      ) : (
        <div
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border
            border-zinc-700/30 bg-zinc-800/20 text-zinc-600 text-xs"
        >
          <Loader2 size={11} className="animate-spin" />
          Waiting for environment…
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

/**
 * @param {{ className?: string }} props
 */
export default function PreviewsTable({ className = "" }) {
  const { previews, loading, error, lastFetched, refresh } = usePreviews();

  // Sorting state
  const [sortKey, setSortKey] = useState("prNumber");
  const [sortDir, setSortDir] = useState("desc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...previews].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp =
      typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const liveCount     = previews.filter((p) => p.status === "Live").length;
  const buildingCount = previews.filter((p) => p.status === "Building").length;

  const columns = [
    { key: "prNumber",  label: "Live Preview & Changes",  width: "w-[38%]" },
    { key: "status",    label: "Status",         width: "w-[15%]" },
    { key: "namespace", label: "Namespace",      width: "w-[22%]" },
    { key: "updatedAt", label: "Last Activity",  width: "w-[15%]" },
    { key: null,        label: "Preview",         width: "w-[10%]" },
  ];

  return (
    <section className={className}>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            Deployment Previews
          </h2>
          {/* Live indicator pills */}
          {!loading && (
            <div className="flex items-center gap-2">
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {liveCount} live
                </span>
              )}
              {buildingCount > 0 && (
                <span className="flex items-center gap-1 text-amber-400 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {buildingCount} building
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-zinc-600 text-[11px] font-mono hidden sm:inline">
              synced {timeAgo(lastFetched.toISOString())}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px]
              bg-zinc-900 border-zinc-700/50 text-zinc-400 hover:text-zinc-200
              hover:border-zinc-600 transition-all duration-200 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl
          bg-red-950/30 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Bridge API error</p>
            <p className="text-red-500/70 text-[11px] font-mono truncate">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="ml-auto text-[11px] underline hover:no-underline flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Mobile cards (< md) ── */}
      <div className="md:hidden flex flex-col gap-4">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-zinc-900/70 border border-zinc-800/70 animate-pulse" />
            ))
          : sorted.length === 0
          ? (
            <div className="flex flex-col items-center gap-2 py-12 rounded-xl border border-dashed border-zinc-800 text-center">
              <GitPullRequest size={20} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">No open pull requests</p>
            </div>
          )
          : sorted.map((p) => <MobileCard key={p.prNumber} preview={p} />)
        }
      </div>

      {/* ── Desktop table (≥ md) ── */}
      <div className="hidden md:block rounded-xl border border-zinc-800/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800/70">
              {columns.map((col) => (
                <th
                  key={col.label}
                  className={`px-4 py-3 text-left ${col.width}`}
                >
                  {col.key ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold
                        text-zinc-500 uppercase tracking-widest hover:text-zinc-300
                        transition-colors group"
                    >
                      {col.label}
                      <SortIcon column={col.key} sortKey={sortKey} dir={sortDir} />
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                      {col.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-zinc-900/40 divide-y divide-zinc-800/50">
            {loading ? (
              <LoadingRows />
            ) : sorted.length === 0 ? (
              <EmptyRow />
            ) : (
              sorted.map((preview) => (
                <TableRow key={preview.prNumber} preview={preview} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Repo attribution footer ── */}
      {!loading && previews.length > 0 && (
        <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-600 font-mono">
          <Github size={11} />
          <span>shivenrshukla/previewops</span>
          <span className="text-zinc-700">·</span>
          <span>{previews.length} open PR{previews.length !== 1 ? "s" : ""}</span>
        </div>
      )}
    </section>
  );
}

/* ── TableRow ─────────────────────────────────────────────────────────────── */
function TableRow({ preview }) {
  const isLive = preview.status === "Live";

  return (
    <tr className="group hover:bg-zinc-800/30 transition-colors duration-150 animate-fade-in">
      {/* PR identity */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/50
            flex items-center justify-center flex-shrink-0">
            <GitPullRequest size={12} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xs font-mono">
                #{preview.prNumber}
              </span>
              <a
                href={preview.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-400 transition-colors opacity-0
                  group-hover:opacity-100"
                aria-label="Open on GitHub"
              >
                <Github size={11} />
              </a>
            </div>
            <a
              href={preview.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-zinc-400 text-[11px] truncate max-w-[220px] transition-colors
                ${isLive ? "hover:text-indigo-400 underline decoration-indigo-500/30" : "cursor-default"}`}
            >
              {preview.title}
            </a>
            <p className="text-zinc-600 text-[10px] font-mono">
              @{preview.author} · {preview.branch}
            </p>
          </div>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3.5">
        <PreviewBadge status={preview.status} />
      </td>

      {/* Namespace */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Server size={11} className="text-zinc-600 flex-shrink-0" />
          <span className="text-zinc-400 text-[11px] font-mono truncate">
            {preview.namespace}
          </span>
          {preview.hasK8s && (
            <span
              className="flex-shrink-0 text-[9px] font-mono text-emerald-600
                bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded"
            >
              k8s ✓
            </span>
          )}
        </div>
      </td>

      {/* Last activity */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-mono">
          <Clock size={11} className="flex-shrink-0" />
          {timeAgo(preview.updatedAt)}
        </div>
      </td>

      {/* Action button */}
      <td className="px-4 py-3.5">
        {isLive ? (
          <a
            href={preview.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px]
              font-semibold bg-indigo-950/30 border-indigo-500/20 text-indigo-400
              hover:bg-indigo-950/60 hover:border-indigo-500/40 hover:text-indigo-300
              transition-all duration-200 active:scale-95 group whitespace-nowrap"
          >
            <Globe size={11} className="group-hover:scale-110 transition-transform" />
            View Website
            <ExternalLink size={9} />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            border border-zinc-700/30 bg-zinc-800/20 text-zinc-600 text-[11px] whitespace-nowrap">
            <Loader2 size={10} className="animate-spin" />
            Pending
          </span>
        )}
      </td>
    </tr>
  );
}
