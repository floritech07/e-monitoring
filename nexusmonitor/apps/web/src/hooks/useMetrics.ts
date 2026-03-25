import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const getToken = () => sessionStorage.getItem('access_token') || '';

interface MetricPoint { time: string; value: number; }

export const useMetrics = (assetId: string, metricKey: string, range: string = '1h') => {
  const [series, setSeries] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const resp = await window.fetch(
        `${API_BASE}/metrics/${assetId}/${metricKey}?range=${range}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: MetricPoint[] = await resp.json();
      setSeries(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // Live polling every 30 s
    intervalRef.current = setInterval(fetch, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [assetId, metricKey, range]);

  return { series, loading, error };
};
