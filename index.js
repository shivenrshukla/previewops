import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { listPreviewNamespaces, getNamespaceStatus } from './bridge-api/k8s-client.js';
import { fetchOpenPRs } from './bridge-api/github-client.js';

const app  = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

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
 *
 * Response shape matches the PreviewEntry typedef in usePreviews.js.
 */
app.get('/api/previews', async (_req, res) => {
  try {
    // Run K8s + GitHub lookups in parallel
    const [namespaces, prMap] = await Promise.all([
      listPreviewNamespaces(),
      fetchOpenPRs(),
    ]);

    // Resolve status for each namespace (also in parallel)
    const entries = await Promise.all(
      namespaces.map(async ({ namespace, buildNumber, createdAt }) => {
        const status = await getNamespaceStatus(namespace);

        // GitHub enrichment (optional — falls back to defaults if token not set)
        const gh = prMap.get(buildNumber) ?? null;

        // Preview URL matches the Ingress host pattern: env-{BUILD_NUMBER}.previewops.local
        const previewUrl = `http://env-${buildNumber}.previewops.local`;

        return {
          prNumber:   buildNumber,
          title:      gh?.title     ?? `Preview #${buildNumber}`,
          displayName: gh?.title    ?? `Internal Environment ${buildNumber}`,
          previewLabel: `View Website Changes`,
          author:     gh?.author    ?? 'unknown',
          branch:     gh?.branch    ?? `preview-env-${buildNumber}`,
          status,
          previewUrl: status === 'Live' ? previewUrl : null,
          namespace,
          hasK8s:     true,
          updatedAt:  gh?.updatedAt ?? createdAt,
          prUrl:      gh?.prUrl     ?? null,
        };
      })
    );

    // Sort: Live first, then Provisioning, then others
    const ORDER = { Live: 0, Provisioning: 1, 'Tearing Down...': 2, Destroyed: 3 };
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
