import { useCallback, useEffect, useRef } from 'react';
import { useAlertStore } from '../../store/alertStore';

type Handler = (payload: any) => void;

let ws: WebSocket | null = null;
const handlers: Map<string, Set<Handler>> = new Map();

export const useWebSocket = (token: string) => {
  const attemptRef = useRef(0);
  const maxAttempts = 20;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (ws && ws.readyState < 2) return;
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${proto}://${window.location.host}/api/ws?token=${token}`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected to NexusMonitor Event Bus');
        attemptRef.current = 0; // Reset backoff on success
      };
      ws.onclose = (e) => {
        if (attemptRef.current >= maxAttempts) {
          console.error(`[WS] Max reconnection attempts (${maxAttempts}) reached. Giving up.`);
          return;
        }
        // FIX-003: Exponential backoff with full jitter
        const baseDelay = 1000;
        const maxDelay = 30000;
        const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attemptRef.current));
        const jitter = Math.floor(Math.random() * exponential);
        
        console.log(`[WS] Closed (code ${e.code}). Reconnecting in ${jitter}ms (attempt ${attemptRef.current + 1})`);
        
        attemptRef.current++;
        timeoutId = setTimeout(() => { ws = null; connect(); }, jitter);
      };
      ws.onmessage = (ev) => {
        try {
          const { event, payload } = JSON.parse(ev.data);
          handlers.get(event)?.forEach(fn => fn(payload));
          if (event === 'alert.fired')    useAlertStore.getState().addAlert(payload);
          if (event === 'alert.resolved') useAlertStore.getState().resolveAlert(payload.id);
        } catch { /* ignore malformed frames */ }
      };
      ws.onerror = (e) => console.error('[WS] Error', e);
    };

    connect();

    return () => {
      clearTimeout(timeoutId);
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [token]);
};

export const useWebSocketClient = <T,>(selector: (store: { subscribe: (event: string, fn: Handler) => () => void }) => T): T => {
  const storeRef = useRef({
    subscribe: (event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => handlers.get(event)?.delete(handler);
    }
  });
  return selector(storeRef.current);
};
