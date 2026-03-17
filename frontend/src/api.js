const BASE = 'http://localhost:3001/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getHostMetrics: () => req('/metrics/host'),
  listVMs: () => req('/vms'),
  vmAction: (id, action) => req(`/vms/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  getAlerts: () => req('/alerts'),
  clearAlerts: () => req('/alerts/clear', { method: 'POST' }),
  getInfrastructure: () => req('/infrastructure'),
  hostAction: (action) => req('/host/action', {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
};

