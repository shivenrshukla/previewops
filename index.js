import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// ── SPA fallback — React Router catches unknown paths ───────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
