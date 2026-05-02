/**
 * DashboardView.jsx — Premium Redesign
 * Deep-space ops terminal: layered glass surfaces, luminous glows,
 * animated scan lines, silky micro-interactions, IBM Plex Mono.
 */

import { useState, useEffect, useRef } from "react";
import { useDeployments } from "@/hooks/useDeployments";

/* ─── Inline Google Font ─────────────────────────────────────────────────── */
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap"
    rel="stylesheet"
  />
);

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  // Backgrounds — Deep Red / Maroon theme
  bg0:      "#0d0202",   // abyssal red
  bg1:      "#1a0505",   // dark maroon
  bg2:      "#260808",   // card base
  bg3:      "#330b0b",   // card elevated
  bg4:      "#400d0d",   // hover surface

  // Borders
  border0:  "#1a0505",   // hairline
  border1:  "#400d0d",   // default
  border2:  "#661515",   // emphasis
  border3:  "#8c1c1c",   // active

  // Accents — White for visibility
  cyan:     "#ffffff",   // white text
  cyanMid:  "#f0f0f0",
  cyanDim:  "#400000",   // deep red backing
  cyanGlow: "#ffffff20",

  emerald:  "#ff6b6b",   // soft red
  amber:    "#ffca3a",   // keeping amber for warnings
  amberDim: "#2a1a00",
  red:      "#ff4c4c",   // error red
  redDim:   "#2a0000",
  violet:   "#ff8080",   // light red
  violetDim:"#400000",

  // Text — White focus
  text0:    "#ffffff",   // primary white
  text1:    "#ffb3b3",   // secondary (light pinkish red)
  text2:    "#8c4040",   // muted red
  text3:    "#4d0a0a",   // decorative dark red

  font:     `'IBM Plex Mono', 'Courier New', monospace`,
};

/* ─── Global styles ──────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: ${T.bg0}; }
    a { text-decoration: none; }
    button { font-family: ${T.font}; }
    input::placeholder { color: ${T.text3}; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: ${T.bg0}; }
    ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 4px; }

    @keyframes ping {
      0%   { transform: scale(1);   opacity: 0.5; }
      70%  { transform: scale(2.5); opacity: 0; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes blink-cursor {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 8px ${T.cyan}40; }
      50%       { box-shadow: 0 0 20px ${T.cyan}70; }
    }
    @keyframes rotate-ring {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .card-enter {
      animation: fadeSlideUp 0.3s ease forwards;
    }
    .metric-glow {
      animation: glow-pulse 3s ease-in-out infinite;
    }
  `}</style>
);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const statusMeta = {
  Live:         { color: T.cyan,   bg: T.cyanDim,   glow: T.cyan,   label: "LIVE",         dot: true  },
  Provisioning: { color: T.amber,  bg: T.amberDim,  glow: T.amber,  label: "BUILDING",     dot: true  },
  Failed:       { color: T.red,    bg: T.redDim,    glow: T.red,    label: "FAILED",       dot: false },
  Idle:         { color: T.text2,  bg: T.bg4,       glow: "none",   label: "IDLE",         dot: false },
};

const checkMeta = {
  pass:    { color: T.cyan,    char: "✓", label: "PASS" },
  warn:    { color: T.amber,   char: "!", label: "WARN" },
  fail:    { color: T.red,     char: "✗", label: "FAIL" },
  running: { color: T.violet,  char: "◌", label: "RUN"  },
  pending: { color: T.text2,   char: "·", label: "WAIT" },
};

/* ─── Pulse dot ─────────────────────────────────────────────────────────── */
function PulseDot({ color, size = 6 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.4,
        animation: "ping 1.8s ease-out infinite",
      }} />
      <span style={{
        position: "relative", width: size, height: size,
        borderRadius: "50%", background: color, display: "inline-block",
        boxShadow: `0 0 6px ${color}`,
      }} />
    </span>
  );
}

/* ─── Status badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.Idle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 8, fontWeight: 600, letterSpacing: "0.16em",
      color: m.color,
      background: m.bg,
      border: `1px solid ${m.color}30`,
      borderRadius: 2,
      padding: "2px 8px",
      boxShadow: m.dot ? `inset 0 0 8px ${m.color}10, 0 0 10px ${m.color}15` : "none",
    }}>
      {m.dot && <PulseDot color={m.color} size={4} />}
      {m.label}
    </span>
  );
}

/* ─── Check pill ────────────────────────────────────────────────────────── */
function CheckPill({ label, state }) {
  const m = checkMeta[state] || checkMeta.pending;
  return (
    <span title={`${label}: ${state}`} style={{
      fontSize: 9, color: m.color,
      background: `${m.color}08`,
      border: `1px solid ${m.color}25`,
      borderRadius: 2,
      padding: "2px 7px",
      display: "inline-flex", alignItems: "center", gap: 4,
      letterSpacing: "0.04em",
    }}>
      <span style={{ fontSize: 8 }}>{m.char}</span>
      <span style={{ color: T.text1, fontSize: 8, letterSpacing: "0.1em" }}>{label}</span>
    </span>
  );
}

/* ─── Usage bar ─────────────────────────────────────────────────────────── */
function UsageBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = pct > 80 ? T.red : pct > 60 ? T.amber : color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 2,
        background: T.border0,
        borderRadius: 2, overflow: "hidden",
        position: "relative",
      }}>
        {/* Track glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: `${barColor}10`,
        }} />
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(to right, ${barColor}aa, ${barColor})`,
          boxShadow: `2px 0 8px ${barColor}80`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <span style={{
        fontSize: 9, color: pct > 80 ? barColor : T.text1,
        minWidth: 28, textAlign: "right", letterSpacing: "0.04em",
        transition: "color 0.3s",
      }}>
        {pct}%
      </span>
    </div>
  );
}

/* ─── Metric tile ────────────────────────────────────────────────────────── */
function MetricTile({ label, value, sub, accent, index = 0 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${T.bg3}, ${T.bg4})`
          : `linear-gradient(135deg, ${T.bg2}, ${T.bg3})`,
        border: `1px solid ${hovered ? (accent || T.border2) + "55" : T.border1}`,
        borderRadius: 6,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.2s, background 0.2s",
        animation: `fadeSlideUp 0.4s ease ${index * 0.06}s both`,
      }}
    >
      {/* Corner accent pip */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 28, height: 28,
        background: `radial-gradient(circle at top right, ${(accent || T.border2)}30, transparent 70%)`,
      }} />

      {/* Bottom edge accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
        background: hovered
          ? `linear-gradient(to right, transparent, ${accent || T.border2}88, transparent)`
          : `linear-gradient(to right, transparent, ${accent || T.border2}30, transparent)`,
        transition: "background 0.3s",
      }} />

      <div style={{
        fontSize: 8, letterSpacing: "0.18em", color: T.text2,
        marginBottom: 10, fontWeight: 500,
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 28, fontWeight: 600, lineHeight: 1,
        color: hovered ? (accent || T.text0) : (accent || T.text0),
        textShadow: hovered && accent ? `0 0 20px ${accent}60` : "none",
        transition: "text-shadow 0.3s",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          fontSize: 9, color: T.text2, marginTop: 6,
          letterSpacing: "0.06em",
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Deployment card ────────────────────────────────────────────────────── */
function DeploymentCard({ d, onTeardown, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [tearHovered, setTearHovered] = useState(false);
  const [previewHovered, setPreviewHovered] = useState(false);
  const sm = statusMeta[d.status] || statusMeta.Idle;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(160deg, ${T.bg3} 0%, ${T.bg4} 100%)`
          : `linear-gradient(160deg, ${T.bg2} 0%, ${T.bg3} 100%)`,
        border: `1px solid ${hovered ? T.border2 : T.border1}`,
        borderLeft: `2px solid ${hovered ? sm.color : sm.color + "66"}`,
        borderRadius: 6,
        padding: "18px 18px 14px",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
        boxShadow: hovered
          ? `0 4px 32px ${sm.color}12, 0 0 0 1px ${sm.color}10, inset 0 1px 0 ${T.border2}40`
          : `0 2px 8px #00000040, inset 0 1px 0 ${T.border1}40`,
        position: "relative",
        overflow: "hidden",
        animation: `fadeSlideUp 0.4s ease ${index * 0.05}s both`,
        cursor: "default",
      }}
    >
      {/* Top-right glow for live */}
      {d.status === "Live" && (
        <div style={{
          position: "absolute", top: -20, right: -20,
          width: 80, height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${T.cyan}18, transparent 70%)`,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0.5,
          transition: "opacity 0.3s",
        }} />
      )}

      {/* Row 1: PR + status + age */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10, color: sm.color, fontWeight: 600,
            letterSpacing: "0.06em",
            textShadow: `0 0 10px ${sm.color}60`,
          }}>
            #{d.pr}
          </span>
          <StatusBadge status={d.status} />
        </div>
        <span style={{
          fontSize: 8, color: T.text2, letterSpacing: "0.1em",
          fontStyle: "italic",
        }}>
          {d.age}
        </span>
      </div>

      {/* Row 2: Title */}
      <div
        title={d.title}
        style={{
          fontSize: 11, color: T.text0, lineHeight: 1.55,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          letterSpacing: "0.01em",
        }}
      >
        {d.title}
      </div>

      {/* Row 3: Meta line */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        paddingBottom: 10,
        borderBottom: `1px solid ${T.border0}`,
      }}>
        <span style={{ fontSize: 9, color: T.text1 }}>{d.author}</span>
        <span style={{ color: T.text3, fontSize: 10 }}>·</span>
        <span style={{ fontSize: 9, color: T.violet, letterSpacing: "0.04em" }}>{d.branch}</span>
        <span style={{ color: T.text3, fontSize: 10 }}>·</span>
        <span style={{ fontSize: 9, color: T.text2 }}>
          <span style={{ opacity: 0.5 }}>@</span>{d.commit}
        </span>
      </div>

      {/* Row 4: Checks */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <CheckPill label="build" state={d.checks.build} />
        <CheckPill label="lint"  state={d.checks.lint}  />
        <CheckPill label="test"  state={d.checks.test}  />
      </div>

      {/* Row 5: Resource bars (live only) */}
      {d.status === "Live" && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          padding: "10px 12px",
          background: `${T.bg0}60`,
          border: `1px solid ${T.border0}`,
          borderRadius: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, color: T.text2, width: 24, letterSpacing: "0.12em" }}>CPU</span>
            <div style={{ flex: 1 }}><UsageBar value={d.cpu} max={100} color={T.cyan} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, color: T.text2, width: 24, letterSpacing: "0.12em" }}>MEM</span>
            <div style={{ flex: 1 }}><UsageBar value={d.mem} max={1024} color={T.violet} /></div>
          </div>
        </div>
      )}

      {/* Row 6: Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {d.url && (
          <a
            href={d.url}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => setPreviewHovered(true)}
            onMouseLeave={() => setPreviewHovered(false)}
            style={{
              fontSize: 8, letterSpacing: "0.12em",
              color: previewHovered ? T.bg0 : T.cyan,
              background: previewHovered ? T.cyan : "transparent",
              border: `1px solid ${T.cyan}40`,
              borderRadius: 2,
              padding: "4px 10px",
              transition: "all 0.15s",
              boxShadow: previewHovered ? `0 0 12px ${T.cyan}50` : "none",
            }}
          >
            OPEN PREVIEW ↗
          </a>
        )}
        <button
          onClick={() => onTeardown(d.id)}
          onMouseEnter={() => setTearHovered(true)}
          onMouseLeave={() => setTearHovered(false)}
          style={{
            fontSize: 8, letterSpacing: "0.12em",
            color: tearHovered ? T.bg0 : T.red,
            background: tearHovered ? T.red : "transparent",
            border: `1px solid ${T.red}35`,
            borderRadius: 2,
            padding: "4px 10px",
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: tearHovered ? `0 0 12px ${T.red}50` : "none",
          }}
        >
          TEARDOWN
        </button>
      </div>
    </div>
  );
}

/* ─── Top bar ────────────────────────────────────────────────────────────── */
function TopBar({ liveCount, provCount, failedCount, lastSync, onRefresh }) {
  const [tick, setTick] = useState(0);
  const [refreshHovered, setRefreshHovered] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      background: `linear-gradient(180deg, ${T.bg1}f0 0%, ${T.bg0}e0 100%)`,
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${T.border1}`,
      position: "sticky", top: 0, zIndex: 50,
      padding: "0 28px",
    }}>
      {/* Top accent line — animated gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(to right, transparent 0%, ${T.cyan}60 30%, ${T.emerald}60 60%, transparent 100%)`,
      }} />

      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56,
      }}>
        {/* Left: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 22, height: 22 }}>
              <div style={{
                position: "absolute", inset: 0,
                border: `1px solid ${T.cyan}50`, borderRadius: 4,
                boxShadow: `0 0 12px ${T.cyan}30`,
              }} />
              <div style={{
                position: "absolute", inset: 4,
                background: T.cyan,
                borderRadius: 1,
                boxShadow: `0 0 8px ${T.cyan}`,
              }} />
            </div>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
                color: T.text0,
              }}>
                PREVIEWOPS
              </div>
              <div style={{
                fontSize: 7, letterSpacing: "0.16em", color: T.text2,
                marginTop: 1,
              }}>
                DEPLOYMENT CONTROL
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: T.border2 }} />

          {/* Live counters */}
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {liveCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: T.cyan }}>
                <PulseDot color={T.cyan} size={5} />
                <span><span style={{ fontWeight: 600 }}>{liveCount}</span> live</span>
              </div>
            )}
            {provCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: T.amber }}>
                <PulseDot color={T.amber} size={5} />
                <span><span style={{ fontWeight: 600 }}>{provCount}</span> building</span>
              </div>
            )}
            {failedCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: T.red }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.red, display: "inline-block", boxShadow: `0 0 5px ${T.red}` }} />
                <span><span style={{ fontWeight: 600 }}>{failedCount}</span> failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: cluster + sync + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Cluster badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 12px",
            background: T.bg2,
            border: `1px solid ${T.border1}`,
            borderRadius: 3,
          }}>
            <span style={{ fontSize: 7, letterSpacing: "0.14em", color: T.text2 }}>CLUSTER</span>
            <span style={{ fontSize: 9, color: T.text1, letterSpacing: "0.06em" }}>prod-k8s-us-east-1</span>
          </div>

          {/* Jenkins status dot */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 9,
            color: T.text1, letterSpacing: "0.08em",
          }}>
            <span style={{
              display: "inline-block", width: 5, height: 5,
              borderRadius: "50%", background: T.cyan,
              boxShadow: `0 0 8px ${T.cyan}`,
            }} />
            Jenkins
          </div>

          {/* Sync timestamp */}
          <span style={{ fontSize: 8, color: T.text2, letterSpacing: "0.08em" }}>
            {lastSync}
            <span style={{ animation: "blink-cursor 1s step-end infinite", color: T.cyan, marginLeft: 2 }}>▌</span>
          </span>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            onMouseEnter={() => setRefreshHovered(true)}
            onMouseLeave={() => setRefreshHovered(false)}
            style={{
              fontSize: 8, fontWeight: 600, letterSpacing: "0.16em",
              color: refreshHovered ? T.bg0 : T.cyan,
              background: refreshHovered
                ? `linear-gradient(135deg, ${T.cyan}, ${T.emerald})`
                : "transparent",
              border: `1px solid ${T.cyan}50`,
              borderRadius: 3, padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.18s",
              boxShadow: refreshHovered ? `0 0 16px ${T.cyan}50` : "none",
            }}
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
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
      <div style={{ position: "relative", flex: 1 }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 9, color: focused ? T.cyan : T.text2, transition: "color 0.15s",
          pointerEvents: "none",
        }}>
          ⌕
        </span>
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="filter by pr / author / branch…"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            fontSize: 10, letterSpacing: "0.04em",
            background: focused ? T.bg3 : T.bg2,
            border: `1px solid ${focused ? T.cyan + "55" : T.border1}`,
            borderRadius: 4, padding: "8px 12px 8px 26px",
            color: T.text0, fontFamily: T.font,
            outline: "none",
            transition: "border-color 0.15s, background 0.15s",
            boxShadow: focused ? `0 0 0 3px ${T.cyan}10` : "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 3 }}>
        {opts.map(o => {
          const active = filter === o;
          return (
            <button
              key={o}
              onClick={() => onFilter(o)}
              style={{
                fontSize: 8, letterSpacing: "0.14em", padding: "6px 12px",
                borderRadius: 3,
                border: `1px solid ${active ? T.cyan + "55" : T.border1}`,
                background: active ? T.cyanDim : "transparent",
                color: active ? T.cyan : T.text2,
                cursor: "pointer",
                transition: "all 0.12s",
                boxShadow: active ? `0 0 10px ${T.cyan}20` : "none",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>

      <span style={{ fontSize: 8, color: T.text2, letterSpacing: "0.12em", whiteSpace: "nowrap", minWidth: 52 }}>
        {total} <span style={{ color: T.text3 }}>env{total !== 1 ? "s" : ""}</span>
      </span>
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ label, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
      <div style={{
        fontSize: 7, letterSpacing: "0.26em", color: T.text2, fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        {label}
      </div>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(to right, ${T.border1}, transparent)`,
      }} />
      {right && (
        <div style={{ fontSize: 8, color: T.text3, letterSpacing: "0.1em" }}>{right}</div>
      )}
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */
export default function DashboardView() {
  const { deployments, handleTeardown, handleRefresh, lastSync } = useDeployments();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  const liveCount   = deployments.filter(d => d.status === "Live").length;
  const provCount   = deployments.filter(d => d.status === "Provisioning").length;
  const failedCount = deployments.filter(d => d.status === "Failed").length;
  const totalCpu    = deployments.filter(d => d.status === "Live").reduce((a, d) => a + d.cpu, 0);
  const totalMem    = deployments.filter(d => d.status === "Live").reduce((a, d) => a + d.mem, 0);

  const filtered = deployments.filter(d => {
    const q = query.toLowerCase();
    const prStr = d.pr != null ? d.pr.toString() : "";
    const matchesQ = !q || [prStr, d.author ?? "", d.branch ?? "", d.title ?? ""].some(s => s.toLowerCase().includes(q));
    const matchesF = filter === "ALL" || d.status.toUpperCase() === filter;
    return matchesQ && matchesF;
  });

  return (
    <>
      <FontLink />
      <GlobalStyles />

      <div style={{
        minHeight: "100vh",
        background: T.bg0,
        fontFamily: T.font,
        color: T.text0,
        position: "relative",
      }}>
        {/* ── Background: dot grid ─────────────────── */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `radial-gradient(circle, ${T.border1} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          opacity: 0.45,
        }} />

        {/* ── Background: radial gradient centre glow ── */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${T.cyan}08 0%, transparent 70%)`,
        }} />

        {/* ── Scanline sweep ─── */}
        <div style={{
          position: "fixed", left: 0, right: 0,
          height: "2px",
          background: `linear-gradient(to bottom, transparent, ${T.cyan}15, transparent)`,
          zIndex: 0, pointerEvents: "none",
          animation: "scanline 8s linear infinite",
          opacity: 0.6,
        }} />

        <TopBar
          liveCount={liveCount}
          provCount={provCount}
          failedCount={failedCount}
          lastSync={lastSync}
          onRefresh={handleRefresh}
        />

        <main style={{
          position: "relative", zIndex: 1,
          maxWidth: 1320, margin: "0 auto",
          padding: "32px 28px",
        }}>

          {/* ── Metrics ─────────────────────────────── */}
          <SectionHeader label="SYSTEM OVERVIEW" right={`${deployments.length} TOTAL ENVIRONMENTS`} />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(152px, 1fr))",
            gap: 8, marginBottom: 36,
          }}>
            <MetricTile label="LIVE ENVIRONMENTS" value={liveCount} sub={`of ${deployments.length} total`} accent={T.cyan}    index={0} />
            <MetricTile label="PROVISIONING"      value={provCount}                                        accent={T.amber}   index={1} />
            <MetricTile label="FAILED"            value={failedCount}                                      accent={failedCount > 0 ? T.red : T.text2} index={2} />
            <MetricTile label="AVG CPU LOAD"      value={liveCount ? `${Math.round(totalCpu / liveCount)}%` : "—"} sub="across live pods" accent={T.violet} index={3} />
            <MetricTile label="TOTAL MEMORY"      value={totalMem ? `${totalMem} MB` : "—"}               sub="live pods"     accent={T.violet}  index={4} />
          </div>

          {/* ── PR Environments ─────────────────────── */}
          <SectionHeader
            label="PULL REQUEST ENVIRONMENTS"
            right="kubernetes · jenkins · github"
          />

          <FilterBar
            query={query} onQuery={setQuery}
            filter={filter} onFilter={setFilter}
            total={filtered.length}
          />

          {/* ── Cards grid ──────────────────────────── */}
          {filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
              gap: 10,
            }}>
              {filtered.map((d, i) => (
                <DeploymentCard key={d.id} d={d} onTeardown={handleTeardown} index={i} />
              ))}
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "72px 0",
              color: T.text2,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 6,
                border: `1px solid ${T.border2}`, marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, opacity: 0.3,
              }}>
                □
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em" }}>
                no environments match your filter
              </div>
            </div>
          )}

          {/* ── Footer ──────────────────────────────── */}
          <footer style={{
            marginTop: 48, paddingTop: 18,
            borderTop: `1px solid ${T.border1}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 8, color: T.text2, letterSpacing: "0.1em",
          }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span>
                PreviewOps <span style={{ color: T.text3 }}>v2.4.1</span>
              </span>
              <span style={{ color: T.text3 }}>·</span>
              <span style={{ color: T.text2 }}>prod-k8s-us-east-1</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.cyan }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: T.cyan, display: "inline-block",
                boxShadow: `0 0 8px ${T.cyan}`,
              }} />
              all systems operational
            </div>
          </footer>

        </main>
      </div>
    </>
  );
}