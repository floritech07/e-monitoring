import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// In production: backend serves the frontend, so use same origin
// In dev: backend is on port 3001, frontend on 5173 (via Vite proxy)
const isProd = window.location.port !== '5173';
const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : isProd
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3001}`
    : `http://${window.location.hostname}:3001`;

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [vms, setVms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Fetch initial activity history
      fetch(`${BACKEND_URL}/api/activity`)
        .then(res => {
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON');
          return res.json();
        })
        .then(data => setActivity(data))
        .catch(err => console.warn('Activity history unavailable (server might be starting or endpoint 404). Details:', err.message));
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('metrics_update', (data) => {
      setMetrics(data.metrics);
      setVms(data.vms || []);
      setAlerts(data.alerts || []);
      if (data.activity) setActivity(data.activity);
    });

    return () => socket.disconnect();
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, metrics, vms, alerts, activity, emit };
}
