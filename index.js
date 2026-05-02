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

    // Create a set of all branches we know about
    const nsMap = new Map(namespaces.map(ns => [ns.branch, ns]));
    const allBranches = new Set([...nsMap.keys(), ...prMap.keys()]);

    const entries = await Promise.all(
      Array.from(allBranches).map(async (branch) => {
        const ns = nsMap.get(branch);
        const gh = prMap.get(branch);
        
        // If we have a namespace, get its status. Otherwise, it's "Pending" or "Destroyed"
        let status = 'Pending';
        if (ns) {
          status = await getNamespaceStatus(ns.namespace);
        } else if (gh) {
          status = 'Pending'; // PR exists but no K8s namespace yet
        }

        // Preview URL matches the Ingress host pattern: defaults to env-{branch}.previewops.local
        const template   = process.env.PREVIEW_URL_TEMPLATE || 'http://env-{branch}.previewops.local';
        const previewUrl = template.replace('{branch}', branch);

        return {
          prNumber:   gh?.prNumber  ?? null,
          title:      gh?.title     ?? `Branch: ${branch}`,
          displayName: gh?.title    ?? `Internal Environment: ${branch}`,
          previewLabel: `View Website Changes`,
          author:     gh?.author    ?? 'unknown',
          branch:     branch,
          status,
          previewUrl: status === 'Live' ? previewUrl : null,
          namespace:  ns?.namespace  ?? `preview-env-${branch}`,
          hasK8s:     !!ns,
          updatedAt:  gh?.updatedAt ?? ns?.createdAt ?? new Date().toISOString(),
          prUrl:      gh?.prUrl     ?? null,
        };
      })
    );

    // Sort: Live first, then Provisioning, then Pending, then others
    const ORDER = { Live: 0, Provisioning: 1, Pending: 2, 'Tearing Down...': 3, Destroyed: 4 };
    entries.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));

    res.json(entries);
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
