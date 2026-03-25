import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [vms, setVms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
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
