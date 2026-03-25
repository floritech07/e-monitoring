import { z } from 'zod';

// Zod schemas for runtime type validation of WS stream payloads
export const AlertFiredSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'WARNING', 'INFO']),
  state: z.string(),
  asset_id: z.string().uuid(),
  value_at_trigger: z.string().optional(),
});
export type AlertFiredEvent = z.infer<typeof AlertFiredSchema>;

export const MetricUpdateSchema = z.object({
  asset_id: z.string(),
  metric_name: z.string(),
  value: z.number(),
  timestamp: z.number()
});
export type MetricUpdateEvent = z.infer<typeof MetricUpdateSchema>;

export const WSEventWrapper = z.object({
  type: z.string(),
  payload: z.any()
});
