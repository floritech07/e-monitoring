import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';

export interface Alert {
  id: string;
  title: string;
  severity: AlertSeverity;
  asset_id: string;
  state: 'FIRING' | 'RESOLVED' | 'ACKNOWLEDGED';
  fired_at: string;
}

interface AlertStore {
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAll: () => void;
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      unreadCount: 0,
      
      addAlert: (alert) => set(state => ({
        alerts: [alert, ...state.alerts.filter(a => a.id !== alert.id)],
        unreadCount: state.unreadCount + 1
      })),
      
      resolveAlert: (id) => set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, state: 'RESOLVED' as const } : a)
      })),
      
      acknowledgeAlert: (id) => set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, state: 'ACKNOWLEDGED' as const } : a),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      
      clearAll: () => set({ alerts: [], unreadCount: 0 })
    }),
    { name: 'nexusmonitor-alerts' }
  )
);
