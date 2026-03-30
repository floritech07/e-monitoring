// En dev: utilise VITE_API_URL si défini, sinon détecte l'hôte automatiquement.
// En prod (build): pointe toujours vers le backend sur le même hôte, port 3001.
const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Host
  getHostMetrics:   ()              => req('/metrics/host'),
  hostAction:       (action)        => req('/host/action', { method: 'POST', body: JSON.stringify({ action }) }),

  // VMs
  listVMs:          ()              => req('/vms'),
  vmAction:         (id, action)    => req(`/vms/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Infrastructure tree
  getInfrastructure: ()             => req('/infrastructure'),

  // Alerts
  getAlerts:        ()              => req('/alerts'),
  getAllAlerts:      (limit = 200)  => req(`/alerts/all?limit=${limit}`),
  getAlertHistory:  (limit = 100)  => req(`/alerts/history?limit=${limit}`),
  clearAlerts:      ()              => req('/alerts/clear', { method: 'POST' }),
  acknowledgeAlert: (id, user, comment) =>
    req(`/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ user, comment }) }),

  // Alert Rules
  getRules:         ()              => req('/rules'),
  createRule:       (rule)          => req('/rules', { method: 'POST', body: JSON.stringify(rule) }),
  updateRule:       (id, rule)      => req(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
  deleteRule:       (id)            => req(`/rules/${id}`, { method: 'DELETE' }),

  // Silences
  getSilences:      ()              => req('/silences'),
  createSilence:    (s)             => req('/silences', { method: 'POST', body: JSON.stringify(s) }),
  deleteSilence:    (id)            => req(`/silences/${id}`, { method: 'DELETE' }),

  // Activity
  getActivity:      ()              => req('/activity'),

  // Veeam
  getVeeam:         (refresh)       => req(`/veeam${refresh ? '?refresh=true' : ''}`),
  getVeeamConfig:   ()              => req('/veeam/config'),
  saveVeeamConfig:  (cfg)           => req('/veeam/config', { method: 'PUT', body: JSON.stringify(cfg) }),
  veeamJobAction:   (jobId, action) =>
    req(`/veeam/jobs/${jobId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Network / Assets
  getNetworkAssets: ()              => req('/network/assets'),
  createAsset:      (a)             => req('/network/assets', { method: 'POST', body: JSON.stringify(a) }),
  updateAsset:      (id, a)         => req(`/network/assets/${id}`, { method: 'PUT', body: JSON.stringify(a) }),
  deleteAsset:      (id)            => req(`/network/assets/${id}`, { method: 'DELETE' }),
  probeAsset:       (id)            => req(`/network/assets/${id}/probe`, { method: 'POST' }),
  getAssetHistory:  (id)            => req(`/network/assets/${id}/history`),

  // Topology
  getTopology:      ()              => req('/network/topology'),

  // Reports
  getAvailability:  (period)        => req(`/reports/availability?period=${period || '24h'}`),
  getBackupReport:  ()              => req('/reports/backup'),

  // Terminal
  terminalExec:     (command)       => req('/terminal/exec', { method: 'POST', body: JSON.stringify({ command }) }),

  // System Scan & Detection
  getSystemScan:    ()              => req('/system/scan'),
  getHypervisors:   ()              => req('/system/hypervisors'),

  // Payment Trends
  getPrepaidTrend:  (range)         => req(`/payments/trends/prepaid?range=${range || '24h'}`),
  getPostpaidTrend: (range)         => req(`/payments/trends/postpaid?range=${range || '24h'}`),
  getPaymentStats:  ()              => req('/payments/stats'),
  getPaymentRules:  ()              => req('/payments/rules'),
  createPaymentRule:(rule)          => req('/payments/rules', { method: 'POST', body: JSON.stringify(rule) }),
  updatePaymentRule:(id, rule)      => req(`/payments/rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
  deletePaymentRule:(id)            => req(`/payments/rules/${id}`, { method: 'DELETE' }),
};
