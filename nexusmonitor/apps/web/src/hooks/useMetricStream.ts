import { useEffect } from 'react';
import { useWebSocketClient } from '../lib/websocket/client';
import { MetricUpdateSchema } from '../lib/websocket/schemas';

export function useMetricStream(assetId: string, seriesNames: string[], onPointReceived: (p: any) => void) {
  const subscribe = useWebSocketClient(state => state.subscribe);
  const send = useWebSocketClient(state => state.send);

  useEffect(() => {
    // 1. Tell backend to send updates for this configuration
    if (assetId && seriesNames.length > 0) {
      send({
        type: 'subscribe',
        filters: { asset_ids: [assetId] }
      });
    }

    // 2. Listen to broadcast loop
    const unsub = subscribe('metric.update', (payload) => {
      const parsed = MetricUpdateSchema.safeParse(payload);
      if (parsed.success && parsed.data.asset_id === assetId && seriesNames.includes(parsed.data.metric_name)) {
        onPointReceived(parsed.data);
      }
    });

    return () => unsub();
  }, [assetId, seriesNames, subscribe, send]);
}
