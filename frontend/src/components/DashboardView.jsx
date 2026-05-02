/**
 * DashboardView.jsx — Redesigned
 * Mission-control terminal aesthetic: IBM Plex Mono throughout,
 * electric-cyan on deep-navy, data-dense cards, animated indicators.
 *
 * Drop-in replacement. Preserves useDeployments hook interface.
 * Mock data is embedded so the file renders standalone in Storybook / previews.
 */

import { useState, useEffect, useRef } from "react";

/* ─── Inline Google Font ─────────────────────────────────────────────────── */
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
    rel="stylesheet"
  />
);

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg0:     "#060b14",   // deepest background
  bg1:     "#0b1220",   // card background
  bg2:     "#111827",   // slightly lifted surface
  bg3:     "#1a2234",   // hover / selected surface
  border:  "#1e2d44",   // default border
  border2: "#2a3d5a",   // emphasis border
  cyan:    "#06d6a0",   // primary accent (emerald-cyan)
  cyanDim: "#064e3b",   // accent fill dim
  amber:   "#f59e0b",   // warning / provisioning
  amberDim:"#451a03",
  red:     "#ef4444",   // error / failed
  redDim:  "#450a0a",
  violet:  "#818cf8",   // info accent
  violetDim:"#1e1b4b",
  text0:   "#e2e8f0",   // primary text
  text1:   "#94a3b8",   // secondary text
  text2:   "#475569",   // muted text
  text3:   "#2d3f55",   // very muted / decorative
  font:    `'IBM Plex Mono', 'Courier New', monospace`,
};

/* ─── Mock data (mirrors useDeployments shape) ────────────────────────────── */
const MOCK = [
  {
    id: "pr-1847",
    pr: 1847,
    title: "feat: redesign metrics pipeline with streaming support",
    author: "kira-chen",
    branch: "feat/metrics-streaming",
    status: "Live",
    age: "2h 14m",
    cpu: 38,
    mem: 512,
    namespace: "preview-pr-1847",
    commit: "a3f9c12",
    url: "https://pr-1847.preview.acme.dev",
    checks: { build: "pass", lint: "pass", test: "pass" },
  },
  {
    id: "pr-1851",
    pr: 1851,
    title: "fix: resolve race condition in auth token refresh",
    author: "dev-marcos",
    branch: "fix/auth-race",
    status: "Live",
    age: "47m",
    cpu: 12,
    mem: 256,
    namespace: "preview-pr-1851",
    commit: "9bc21fe",
    url: "https://pr-1851.preview.acme.dev",
    checks: { build: "pass", lint: "pass", test: "pass" },
  },
  {
    id: "pr-1854",
    pr: 1854,
    title: "chore: upgrade Postgres driver to v5.0.1",
    author: "ops-nadia",
    branch: "chore/pg-upgrade",
    status: "Provisioning",
    age: "3m",
    cpu: 0,
    mem: 0,
    namespace: "preview-pr-1854",
    commit: "f77d348",
    url: null,
    checks: { build: "running", lint: "pass", test: "pending" },
  },
  {
    id: "pr-1843",
    pr: 1843,
    title: "refactor: extract billing module into micro-service",
    author: "kira-chen",
    branch: "refactor/billing-svc",
    status: "Live",
    age: "6h 02m",
    cpu: 71,
    mem: 768,
    namespace: "preview-pr-1843",
    commit: "22ea115",
    url: "https://pr-1843.preview.acme.dev",
    checks: { build: "pass", lint: "warn", test: "pass" },
  },
  {
    id: "pr-1837",
    pr: 1837,
    title: "feat: add Slack alert integration for SLO breaches",
    author: "dev-marcos",
    branch: "feat/slack-slo",
    status: "Failed",
    age: "1h 30m",
    cpu: 0,
    mem: 0,
    namespace: "preview-pr-1837",
    commit: "08c3a90",
    url: null,
    checks: { build: "fail", lint: "pass", test: "pending" },
  },
  {
    id: "pr-1858",
    pr: 1858,
    title: "docs: update OpenAPI spec for v3 endpoints",
    author: "ops-nadia",
    branch: "docs/openapi-v3",
    status: "Provisioning",
    age: "1m",
    cpu: 0,
    mem: 0,
    namespace: "preview-pr-1858",
    commit: "b15f002",
    url: null,
    checks: { build: "running", lint: "running", test: "pending" },
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const statusMeta = {
  Live:         { color: T.cyan,   bg: T.cyanDim,   label: "LIVE",         dot: true  },
  Provisioning: { color: T.amber,  bg: T.amberDim,  label: "PROVISIONING", dot: true  },
  Failed:       { color: T.red,    bg: T.redDim,    label: "FAILED",       dot: false },
  Idle:         { color: T.text2,  bg: T.bg3,       label: "IDLE",         dot: false },
};

const checkMeta = {
  pass:    { color: T.cyan,   char: "✓" },
  warn:    { color: T.amber,  char: "!" },
  fail:    { color: T.red,    char: "✗" },
  running: { color: T.violet, char: "◌" },
  pending: { color: T.text2,  char: "·" },
};

function UsageBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = pct > 80 ? T.red : pct > 60 ? T.amber : color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          background: T.border,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: T.text1, minWidth: 26, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function PulseDot({ color, size = 6 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: color,
          opacity: 0.4,
          animation: "ping 1.6s ease-out infinite",
        }}
      />
      <span
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
    </span>
  );
}

function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.Idle;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.12em",
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.color}22`,
        borderRadius: 3,
        padding: "2px 7px",
      }}
    >
      {m.dot && <PulseDot color={m.color} size={5} />}
      {m.label}
    </span>
  );
}

function CheckPill({ label, state }) {
  const m = checkMeta[state] || checkMeta.pending;
  return (
    <span
      title={`${label}: ${state}`}
      style={{
        fontSize: 10,
        color: m.color,
        border: `1px solid ${m.color}33`,
        borderRadius: 3,
        padding: "1px 6px",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span>{m.char}</span>
      <span style={{ color: T.text2 }}>{label}</span>
    </span>
  );
}

/* ─── Metric tile ─────────────────────────────────────────────────────────── */
function MetricTile({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: T.bg1,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        padding: "12px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent || T.border2,
          opacity: 0.6,
        }}
      />
      <div style={{ fontSize: 9, letterSpacing: "0.14em", color: T.text2, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: accent || T.text0, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: T.text2, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

/* ─── Deployment card ─────────────────────────────────────────────────────── */
function DeploymentCard({ d, onTeardown }) {
  const [hovered, setHovered] = useState(false);
  const sm = statusMeta[d.status] || statusMeta.Idle;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.bg2 : T.bg1,
        border: `1px solid ${hovered ? T.border2 : T.border}`,
        borderLeft: `3px solid ${sm.color}`,
        borderRadius: 6,
        padding: "14px 16px",
        transition: "background 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Row 1: PR number + status + age */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: sm.color, fontWeight: 600 }}>#{d.pr}</span>
          <StatusBadge status={d.status} />
        </div>
        <span style={{ fontSize: 9, color: T.text2 }}>{d.age}</span>
      </div>

      {/* Row 2: Title */}
      <div
        title={d.title}
        style={{
          fontSize: 11,
          color: T.text0,
          lineHeight: 1.45,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {d.title}
      </div>

      {/* Row 3: Author / Branch / Commit */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: T.text2 }}>
          <span style={{ color: T.text1 }}>{d.author}</span>
        </span>
        <span style={{ fontSize: 9, color: T.text3 }}>·</span>
        <span style={{ fontSize: 9, color: T.violet }}>{d.branch}</span>
        <span style={{ fontSize: 9, color: T.text3 }}>·</span>
        <span style={{ fontSize: 9, color: T.text2 }}>
          <span style={{ color: T.text2 }}>@</span>
          {d.commit}
        </span>
      </div>

      {/* Row 4: CI checks */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <CheckPill label="build" state={d.checks.build} />
        <CheckPill label="lint"  state={d.checks.lint}  />
        <CheckPill label="test"  state={d.checks.test}  />
      </div>

      {/* Row 5: Resource bars (only when live) */}
      {d.status === "Live" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: T.text2, width: 28 }}>CPU</span>
            <div style={{ flex: 1 }}>
              <UsageBar value={d.cpu} max={100} color={T.cyan} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: T.text2, width: 28 }}>MEM</span>
            <div style={{ flex: 1 }}>
              <UsageBar value={d.mem} max={1024} color={T.violet} />
            </div>
          </div>
        </div>
      )}

      {/* Row 6: Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", paddingTop: 2 }}>
        {d.url && (
          <a
            href={d.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 9,
              color: T.cyan,
              letterSpacing: "0.08em",
              border: `1px solid ${T.cyan}33`,
              borderRadius: 3,
              padding: "3px 8px",
              textDecoration: "none",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.target.style.background = T.cyanDim)}
            onMouseLeave={e => (e.target.style.background = "transparent")}
          >
            OPEN PREVIEW ↗
          </a>
        )}
        <button
          onClick={() => onTeardown(d.id)}
          style={{
            fontSize: 9,
            color: T.red,
            letterSpacing: "0.08em",
            background: "transparent",
            border: `1px solid ${T.red}33`,
            borderRadius: 3,
            padding: "3px 8px",
            cursor: "pointer",
            transition: "background 0.12s",
            fontFamily: T.font,
          }}
          onMouseEnter={e => (e.target.style.background = T.redDim)}
          onMouseLeave={e => (e.target.style.background = "transparent")}
        >
          TEARDOWN
        </button>
      </div>
    </div>
  );
}

/* ─── Top navigation bar ─────────────────────────────────────────────────── */
function TopBar({ liveCount, provCount, failedCount, lastSync, onRefresh }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const blink = tick % 2 === 0;

  return (
    <header
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.bg0,
        position: "sticky",
        top: 0,
        zIndex: 40,
        padding: "0 24px",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(to right, transparent, ${T.cyan}88, transparent)`,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        {/* Left: logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 2,
                background: T.cyan,
                boxShadow: `0 0 8px ${T.cyan}`,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", color: T.text0 }}>
              PREVIEWOPS
            </span>
            <span style={{ fontSize: 10, color: T.text3 }}>v2.4.1</span>
          </div>

          <span style={{ color: T.border2, fontSize: 12 }}>|</span>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {liveCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: T.cyan }}>
                <PulseDot color={T.cyan} size={5} />
                {liveCount} live
              </span>
            )}
            {provCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: T.amber }}>
                <PulseDot color={T.amber} size={5} />
                {provCount} building
              </span>
            )}
            {failedCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: T.red }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, display: "inline-block" }} />
                {failedCount} failed
              </span>
            )}
          </div>
        </div>

        {/* Right: cluster info + controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 9, color: T.text2, letterSpacing: "0.06em" }}>
            <span style={{ color: T.text3 }}>cluster</span>{" "}
            <span style={{ color: T.text1 }}>prod-k8s-us-east-1</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 9,
              color: T.cyan,
              border: `1px solid ${T.cyan}33`,
              borderRadius: 3,
              padding: "3px 8px",
            }}
          >
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: T.cyan,
                display: "inline-block",
              }}
            />
            Jenkins
          </div>

          <span style={{ fontSize: 9, color: T.text2 }}>
            {lastSync}
            <span
              style={{
                display: "inline-block",
                width: 6,
                marginLeft: 2,
                opacity: blink ? 1 : 0,
                color: T.cyan,
              }}
            >
              ▌
            </span>
          </span>

          <button
            onClick={onRefresh}
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: T.bg0,
              background: T.cyan,
              border: "none",
              borderRadius: 3,
              padding: "5px 12px",
              cursor: "pointer",
              fontFamily: T.font,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.target.style.opacity = "0.85")}
            onMouseLeave={e => (e.target.style.opacity = "1")}
          >
            ↺ REFRESH
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Filter bar ─────────────────────────────────────────────────────────── */
function FilterBar({ query, onQuery, filter, onFilter, total }) {
  const opts = ["ALL", "LIVE", "PROVISIONING", "FAILED"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <input
        value={query}
        onChange={e => onQuery(e.target.value)}
        placeholder="filter by pr / author / branch…"
        style={{
          flex: 1,
          fontSize: 10,
          background: T.bg1,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: "7px 12px",
          color: T.text0,
          fontFamily: T.font,
          outline: "none",
        }}
        onFocus={e => (e.target.style.borderColor = T.cyan + "88")}
        onBlur={e => (e.target.style.borderColor = T.border)}
      />
      <div style={{ display: "flex", gap: 3 }}>
        {opts.map(o => (
          <button
            key={o}
            onClick={() => onFilter(o)}
            style={{
              fontSize: 9,
              letterSpacing: "0.1em",
              padding: "5px 10px",
              borderRadius: 3,
              border: `1px solid ${filter === o ? T.cyan + "55" : T.border}`,
              background: filter === o ? T.cyanDim : "transparent",
              color: filter === o ? T.cyan : T.text2,
              cursor: "pointer",
              fontFamily: T.font,
              transition: "all 0.12s",
            }}
          >
            {o}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 9, color: T.text2, whiteSpace: "nowrap" }}>
        {total} env{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */
export default function DashboardView() {
  // — In production, replace these with: useDeployments()
  const [deployments, setDeployments] = useState(MOCK);
  const [lastSync, setLastSync] = useState("just now");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  const handleTeardown = (id) =>
    setDeployments(prev => prev.filter(d => d.id !== id));

  const handleRefresh = () => {
    setLastSync("just now");
  };

  const liveCount     = deployments.filter(d => d.status === "Live").length;
  const provCount     = deployments.filter(d => d.status === "Provisioning").length;
  const failedCount   = deployments.filter(d => d.status === "Failed").length;
  const totalCpu      = deployments.filter(d => d.status === "Live").reduce((a, d) => a + d.cpu, 0);
  const totalMem      = deployments.filter(d => d.status === "Live").reduce((a, d) => a + d.mem, 0);

  const filtered = deployments.filter(d => {
    const q = query.toLowerCase();
    const matchesQ = !q || [d.pr.toString(), d.author, d.branch, d.title].some(s => s.toLowerCase().includes(q));
    const matchesF = filter === "ALL" || d.status.toUpperCase() === filter;
    return matchesQ && matchesF;
  });

  return (
    <>
      <FontLink />
      <style>{`
        * { box-sizing: border-box; }
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 0.4; }
          75%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${T.bg0}; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 2px; }
        a { text-decoration: none; }
        button { font-family: inherit; }
        input::placeholder { color: ${T.text3}; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: T.bg0,
          fontFamily: T.font,
          color: T.text0,
          position: "relative",
        }}
      >
        {/* Subtle dot-grid overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(circle, ${T.border}55 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.4,
          }}
        />

        <TopBar
          liveCount={liveCount}
          provCount={provCount}
          failedCount={failedCount}
          lastSync={lastSync}
          onRefresh={handleRefresh}
        />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

          {/* ── Metrics row ─────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 28,
            }}
          >
            <MetricTile
              label="LIVE ENVIRONMENTS"
              value={liveCount}
              sub={`of ${deployments.length} total`}
              accent={T.cyan}
            />
            <MetricTile
              label="PROVISIONING"
              value={provCount}
              accent={T.amber}
            />
            <MetricTile
              label="FAILED"
              value={failedCount}
              accent={failedCount > 0 ? T.red : T.text2}
            />
            <MetricTile
              label="AVG CPU LOAD"
              value={liveCount ? `${Math.round(totalCpu / liveCount)}%` : "—"}
              sub="across live pods"
              accent={T.violet}
            />
            <MetricTile
              label="TOTAL MEMORY"
              value={totalMem ? `${totalMem} MB` : "—"}
              sub="live pods"
              accent={T.violet}
            />
          </div>

          {/* ── Section header ──────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: T.text2,
                fontWeight: 600,
              }}
            >
              PULL REQUEST ENVIRONMENTS
            </div>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <div style={{ fontSize: 9, color: T.text3 }}>
              kubernetes · jenkins · github
            </div>
          </div>

          {/* ── Filter bar ──────────────────────────────────── */}
          <FilterBar
            query={query}
            onQuery={setQuery}
            filter={filter}
            onFilter={setFilter}
            total={filtered.length}
          />

          {/* ── Cards grid ──────────────────────────────────── */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 10,
              }}
            >
              {filtered.map(d => (
                <DeploymentCard key={d.id} d={d} onTeardown={handleTeardown} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
                color: T.text2,
                fontSize: 11,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>□</div>
              no environments match your filter
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────── */}
          <footer
            style={{
              marginTop: 40,
              paddingTop: 16,
              borderTop: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 9,
              color: T.text2,
              letterSpacing: "0.08em",
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              <span>PreviewOps <span style={{ color: T.text3 }}>v2.4.1</span></span>
              <span style={{ color: T.text3 }}>·</span>
              <span>prod-k8s-us-east-1</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.cyan }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.cyan, display: "inline-block" }} />
              all systems operational
            </div>
          </footer>

        </main>
      </div>
    </>
  );
}