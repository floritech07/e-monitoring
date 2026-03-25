/**
 * networkService.js
 * ICMP ping probes + TCP port probes + basic latency tracking for
 * custom network assets stored via storageService.
 *
 * Uses Node's `exec` to call the system `ping` command
 * (cross-platform safe: Windows ping is available on the SBEE host).
 */

const { exec } = require('child_process');
const storage  = require('./storageService');
const alertsService = require('./alertRulesService');

// In-memory probe state
const probeState   = new Map(); // assetId → { latency, loss, status, timestamp }
const latencyHistory = new Map(); // assetId → [{ ts, latency }]
const MAX_HISTORY   = 200;

/**
 * Parse Windows ping output and extract RTT in ms + packet loss %.
 */
function parsePingOutput(stdout) {
  // RTT: "Average = 4ms" (Windows) or "rtt ... = x.x/x.x/x.x/x.x ms" (Linux)
  const rttMatch   = stdout.match(/Average\s*=\s*(\d+)ms/i)
                  || stdout.match(/rtt .+ = [\d.]+\/([\d.]+)\/[\d.]+/i);
  const lossMatch  = stdout.match(/(\d+)%\s+(?:packet\s+)?loss/i);

  const latency    = rttMatch  ? parseFloat(rttMatch[1])  : null;
  const loss       = lossMatch ? parseInt(lossMatch[1], 10) : 100;
  return { latency, loss };
}

/**
 * Ping an IP address. Returns { latency, loss, reachable }.
 */
function pingHost(ip, count = 4) {
  return new Promise((resolve) => {
    // Windows: ping -n 4 -w 1000 ip
    // Adjust for Linux: ping -c 4 -W 1 ip
    const isWin = process.platform === 'win32';
    const cmd   = isWin
      ? `ping -n ${count} -w 1000 ${ip}`
      : `ping -c ${count} -W 1 ${ip}`;

    exec(cmd, { timeout: 12_000 }, (err, stdout) => {
      if (!stdout) return resolve({ latency: null, loss: 100, reachable: false });
      const { latency, loss } = parsePingOutput(stdout);
      resolve({ latency, loss, reachable: loss < 100 });
    });
  });
}

/**
 * TCP connect probe. Returns { open, latency }.
 */
function tcpProbe(ip, port) {
  return new Promise((resolve) => {
    const net   = require('net');
    const start = Date.now();
    const socket = net.createConnection({ host: ip, port, timeout: 3000 }, () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ open: true, latency });
    });
    socket.on('error', () => resolve({ open: false, latency: null }));
    socket.on('timeout', () => { socket.destroy(); resolve({ open: false, latency: null }); });
  });
}

/**
 * Probe a single asset. Updates in-memory state and emits alerts.
 */
async function probeAsset(asset) {
  if (!asset.pingEnabled && !asset.tcpPort) return;

  let latency = null;
  let loss    = 0;
  let status  = 'unknown';

  if (asset.pingEnabled && asset.ip) {
    try {
      const result = await pingHost(asset.ip, 3);
      latency      = result.latency;
      loss         = result.loss;
      status       = result.reachable ? (result.latency > 100 ? 'warning' : 'online') : 'offline';
    } catch {
      status = 'offline';
    }
  }

  if (asset.tcpPort && asset.ip) {
    try {
      const tcp = await tcpProbe(asset.ip, asset.tcpPort);
      if (!tcp.open) status = 'offline';
      else if (latency === null) latency = tcp.latency;
    } catch {}
  }

  const now   = Date.now();
  const prev  = probeState.get(asset.id);

  probeState.set(asset.id, { latency, loss, status, timestamp: now, ip: asset.ip });

  // History
  if (!latencyHistory.has(asset.id)) latencyHistory.set(asset.id, []);
  const hist = latencyHistory.get(asset.id);
  hist.push({ ts: now, latency, status });
  if (hist.length > MAX_HISTORY) hist.shift();

  // Alert if newly offline
  const ruleId = `network_${asset.id}`;
  if (status === 'offline') {
    alertsService.addExternalAlert({
      level:    'critical',
      severity: 'critical',
      category: 'network',
      message:  `${asset.name} (${asset.ip}) injoignable — perte de paquets: ${loss}%`,
      source:   asset.ip,
      ruleId,
    });
  } else if (status === 'warning') {
    alertsService.addExternalAlert({
      level:    'warning',
      severity: 'warning',
      category: 'network',
      message:  `Latence élevée sur ${asset.name} (${asset.ip}): ${latency}ms`,
      source:   asset.ip,
      ruleId:   ruleId + '_lat',
    });
  }

  return { ...asset, probeStatus: status, latency, loss, lastProbed: now };
}

/**
 * Run probes on all custom assets sequentially (keeps CPU load low).
 */
async function probeAll() {
  const assets = storage.getAssets();
  const results = [];
  for (const asset of assets) {
    try {
      const r = await probeAsset(asset);
      if (r) results.push(r);
    } catch (e) {
      console.error(`[Network] Probe error for ${asset.name}:`, e.message);
    }
  }
  return results;
}

/**
 * Get enriched asset list with current probe state.
 */
function getAssetsWithStatus() {
  const assets = storage.getAssets();
  return assets.map(a => {
    const state = probeState.get(a.id);
    return {
      ...a,
      probeStatus:  state?.status    || 'unknown',
      latency:      state?.latency   || null,
      loss:         state?.loss      || 0,
      lastProbed:   state?.timestamp || null,
    };
  });
}

function getAssetHistory(id) {
  return latencyHistory.get(id) || [];
}

/**
 * Build a simple topology graph: nodes = assets + host, edges = connections.
 */
function getTopologyGraph(metrics, vms) {
  const assets  = getAssetsWithStatus();
  const nodes   = [];
  const edges   = [];

  // Host node
  nodes.push({
    id:     'host',
    label:  metrics?.host?.hostname || 'Hôte SBEE',
    type:   'host',
    status: 'online',
    ip:     null,
    cpu:    metrics?.cpu?.usage,
    ram:    metrics?.ram?.percent,
  });

  // VM nodes
  (vms || []).forEach(vm => {
    nodes.push({
      id:     vm.id,
      label:  vm.name,
      type:   'vm',
      status: vm.state === 'on' ? 'online' : 'offline',
      ip:     vm.ip,
      cpu:    vm.cpu?.usage,
      ram:    vm.ram?.percent,
    });
    edges.push({ source: 'host', target: vm.id, type: 'hypervisor' });
  });

  // Network asset nodes
  assets.forEach(a => {
    nodes.push({
      id:     a.id,
      label:  a.name,
      type:   a.type || 'device',
      status: a.probeStatus,
      ip:     a.ip,
      latency: a.latency,
    });
    // Connect assets to host via network
    edges.push({ source: 'host', target: a.id, type: 'network', latency: a.latency });
  });

  return { nodes, edges, updatedAt: Date.now() };
}

module.exports = {
  probeAll,
  probeAsset,
  getAssetsWithStatus,
  getAssetHistory,
  getTopologyGraph,
};
