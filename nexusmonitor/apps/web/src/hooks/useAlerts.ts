import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => sessionStorage.getItem('access_token') || '';

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${path}`);
  return resp.json() as Promise<T>;
}

export interface Alert {
  id: string;
  title: string;
  severity: string;
  asset_id: string;
  state: string;
  fired_at: string;
}

export const useAlerts = (filter?: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?severity=${filter}` : '';
      const data = await apiFetch<Alert[]>(`/alerts${query}`);
      setAlerts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const acknowledge = async (id: string) => {
    await apiFetch(`/alerts/${id}/acknowledge`, { method: 'POST' });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, state: 'ACKNOWLEDGED' } : a));
  };

  return { alerts, loading, error, acknowledge, refetch: fetchAlerts };
};
