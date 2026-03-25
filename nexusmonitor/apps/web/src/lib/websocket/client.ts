import { useCallback, useEffect, useRef } from 'react';
import { useAlertStore } from '../../store/alertStore';

type Handler = (payload: any) => void;

let ws: WebSocket | null = null;
const handlers: Map<string, Set<Handler>> = new Map();

export const useWebSocket = (token: string) => {
  useEffect(() => {
    if (ws && ws.readyState < 2) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/api/ws?token=${token}`;
    ws = new WebSocket(url);

    ws.onopen = () => console.log('[WS] Connected to NexusMonitor Event Bus');
    ws.onclose = (e) => {
      console.log(`[WS] Closed (code ${e.code}). Reconnecting in 5 s…`);
      setTimeout(() => { ws = null; }, 5000);
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
