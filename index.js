import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Load environment variables from bridge-api/.env
dotenv.config({ path: join(__dirname, 'bridge-api', '.env') });

import express from 'express';
import cors from 'cors';
import { listPreviewNamespaces, getNamespaceStatus } from './bridge-api/k8s-client.js';
import { fetchOpenPRs } from './bridge-api/github-client.js';

const app  = express();
app.use(cors());
const port = 3000;

// ── Serve the built React dashboard ─────────────────────────────────────────
// Built by `npm run build` inside frontend/ → output lands in frontend/dist/
const DIST = join(__dirname, 'frontend', 'dist');
app.use(express.static(DIST));

// ── Existing health / status route ──────────────────────────────────────────
app.get('/status', (req, res) => {
  res.send('<h1>PreviewOps Environment is LIVE! 🚀</h1><br><h1>PreviewOps Webhooks are LIVE!</h1>');
});

// ── Bridge API ────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Simple liveness probe for the bridge API.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

/**
 * GET /api/debug
 * Shows raw K8s namespaces and GitHub PRs — use this to diagnose missing PR cards.
 */
app.get('/api/debug', async (_req, res) => {
  try {
    const [namespaces, { byHead, byBase }] = await Promise.all([
      listPreviewNamespaces(),
      fetchOpenPRs(),
    ]);
    res.json({
      k8s_namespaces: namespaces,
      github_prs_by_head: Object.fromEntries(byHead),
      github_prs_by_base: Object.fromEntries(
        [...byBase.entries()].map(([k, v]) => [k, v])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/previews
 * Returns all active preview environments enriched with optional GitHub PR data.
 */
app.get('/api/previews', async (_req, res) => {
  try {
    // Run K8s + GitHub lookups in parallel
    const [namespaces, prMap] = await Promise.all([
      listPreviewNamespaces(),
      fetchOpenPRs(),
    ]);

    // K8s namespaces are the source of truth.
    // Only show environments that have an active namespace.
    const nsMap = new Map(namespaces.map(ns => [ns.branch, ns]));

    // Destructure the two PR indexes returned by fetchOpenPRs
    const { byHead, byBase } = prMap;

    const template = process.env.PREVIEW_URL_TEMPLATE || 'http://env-{branch}.previewops.local';

    const allEntries = [];

    for (const [branch, ns] of nsMap) {
      const status     = await getNamespaceStatus(ns.namespace);
      const previewUrl = template.replace('{branch}', branch);

      // Check if any open PRs are TARGETING this branch (e.g. dev → master)
      const incomingPRs = byBase.get(branch) || [];

      if (incomingPRs.length > 0) {
        // Expand into one card per incoming PR (master shows all open PRs at a glance)
        for (const gh of incomingPRs) {
          allEntries.push({
            prNumber:    gh.prNumber,
            title:       gh.title,
            displayName: gh.title,
            previewLabel: `View on ${branch}`,
            author:      gh.author,
            branch:      gh.branch,      // the PR's source branch
            targetBranch: branch,        // the namespace branch (master)
            status,
            previewUrl:  status === 'Live' ? previewUrl : null,
            namespace:   ns.namespace,
            hasK8s:      true,
            updatedAt:   gh.updatedAt ?? ns.createdAt ?? new Date().toISOString(),
            prUrl:       gh.prUrl ?? null,
          });
        }
      } else {
        // Feature branch or standalone branch (no PRs targeting it)
        const gh = byHead.get(branch);
        allEntries.push({
          prNumber:    gh?.prNumber  ?? null,
          title:       gh?.title     ?? `Branch: ${branch}`,
          displayName: gh?.title     ?? `Internal Environment: ${branch}`,
          previewLabel: `View Website Changes`,
          author:      gh?.author    ?? 'unknown',
          branch,
          status,
          previewUrl:  status === 'Live' ? previewUrl : null,
          namespace:   ns.namespace,
          hasK8s:      true,
          updatedAt:   gh?.updatedAt ?? ns?.createdAt ?? new Date().toISOString(),
          prUrl:       gh?.prUrl     ?? null,
        });
      }
    }

    // Filter out Destroyed environments and sort
    const active = allEntries.filter(e => e.status !== 'Destroyed');
    const ORDER  = { Live: 0, Provisioning: 1, Pending: 2, 'Tearing Down...': 3 };
    active.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));

    res.json(active);
  } catch (err) {
    console.error('[/api/previews] Unexpected error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── SPA fallback — React Router catches unknown paths ───────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
