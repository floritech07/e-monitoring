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

export interface Asset {
  id: string;
  name: string;
  ip_address: string;
  asset_type: string;
  status: string;
  site_id: string;
  os: string;
}

export const useAssets = (search?: string, siteId?: string) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (siteId) params.set('site_id', siteId);
      const data = await apiFetch<Asset[]>(`/assets?${params.toString()}`);
      setAssets(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, siteId]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
};
