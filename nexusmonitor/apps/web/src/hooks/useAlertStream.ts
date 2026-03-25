import { useEffect } from 'react';
import { useWebSocketClient } from '../lib/websocket/client';
import { AlertFiredSchema } from '../lib/websocket/schemas';

export function useAlertStream(onAlertFired?: (alert: any) => void) {
  const subscribe = useWebSocketClient(state => state.subscribe);

  useEffect(() => {
    const unsub = subscribe('alert.fired', (payload) => {
      const parsed = AlertFiredSchema.safeParse(payload);
      if (parsed.success) {
        // e.g., trigger sound alert, add to global state
        if (onAlertFired) onAlertFired(parsed.data);
      } else {
        console.error("Invalid alert WS payload", parsed.error);
      }
    });
    
    // Also listen to alert.resolved / alert.acknowledged to update UI 
    const unsubRes = subscribe('alert.resolved', (payload) => {
       // logic to update global alert store and remove row
    });

    return () => { unsub(); unsubRes(); };
  }, [subscribe, onAlertFired]);
}
