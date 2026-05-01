/**
 * k8s-client.js
 * Thin wrapper around `kubectl` for Bridge API use.
 *
 * All functions return safe defaults (empty arrays / "Destroyed") if
 * kubectl is unavailable — so local dev without a cluster still works.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Namespace name pattern: defaults to preview-env-{ID}
// Configurable via NAMESPACE_PATTERN env var (must include one capture group for the ID)
const NS_PATTERN = new RegExp(process.env.NAMESPACE_PATTERN || '^preview-env-(\\d+)$');

/**
 * Maps Kubernetes pod phases to the frontend's DeploymentStatus type.
 * @param {Object[]} pods - Raw pod objects from kubectl JSON output
 * @returns {'Live'|'Provisioning'|'Tearing Down...'|'Destroyed'}
 */
function mapPodsToStatus(pods) {
  if (!pods || pods.length === 0) return 'Destroyed';

  // Any pod with a deletionTimestamp means the namespace is winding down
  if (pods.some((p) => p.metadata?.deletionTimestamp)) return 'Tearing Down...';

  const phases = pods.map((p) => p.status?.phase ?? 'Unknown');

  if (phases.every((ph) => ph === 'Running')) {
    // Extra check: all containers must be ready
    const allReady = pods.every((p) =>
      (p.status?.containerStatuses ?? []).every((c) => c.ready)
    );
    return allReady ? 'Live' : 'Provisioning';
  }

  if (phases.some((ph) => ph === 'Failed')) return 'Destroyed';

  return 'Provisioning';
}

/**
 * Runs a kubectl command and returns parsed JSON output.
 * Returns null on failure.
 * @param {string[]} args
 * @returns {Promise<Object|null>}
 */
async function kubectl(args) {
  try {
    const { stdout } = await execFileAsync('kubectl', args, { timeout: 10_000 });
    return JSON.parse(stdout);
  } catch (err) {
    // ENOENT = kubectl not installed; surface as a soft warning
    if (err.code === 'ENOENT') {
      console.warn('[k8s-client] kubectl not found — running in offline mode.');
    } else {
      console.error('[k8s-client] kubectl error:', err.message);
    }
    return null;
  }
}

/**
 * Lists all active preview-env-* namespaces in the cluster.
 * @returns {Promise<Array<{namespace: string, buildNumber: number, createdAt: string}>>}
 */
export async function listPreviewNamespaces() {
  const result = await kubectl(['get', 'namespaces', '-o', 'json']);
  if (!result) return [];

  return result.items
    .filter((ns) => NS_PATTERN.test(ns.metadata.name))
    .map((ns) => ({
      namespace:   ns.metadata.name,
      buildNumber: parseInt(NS_PATTERN.exec(ns.metadata.name)[1], 10),
      createdAt:   ns.metadata.creationTimestamp ?? new Date().toISOString(),
    }));
}

/**
 * Gets the deployment status for a given namespace.
 * @param {string} namespace
 * @returns {Promise<'Live'|'Provisioning'|'Tearing Down...'|'Destroyed'>}
 */
export async function getNamespaceStatus(namespace) {
  const result = await kubectl(['get', 'pods', '-n', namespace, '-o', 'json']);
  if (!result) return 'Destroyed';
  return mapPodsToStatus(result.items);
}
