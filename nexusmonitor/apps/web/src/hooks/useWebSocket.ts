import { useEffect } from 'react';
import { useWebSocketClient } from '../lib/websocket/client';
import { useAlertStream } from './useAlertStream';
import { useMetricStream } from './useMetricStream';

/**
 * Top level app WS hook. 
 * Place this high in the component tree to maintain connection.
 */
export function useWebSocket(token: string) {
  const { connect, disconnect, status } = useWebSocketClient();

  useEffect(() => {
    if (token) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return { status };
}

// Re-export hooks
export { useAlertStream, useMetricStream };
