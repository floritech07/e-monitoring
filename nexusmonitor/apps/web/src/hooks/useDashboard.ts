import { useState, useCallback } from 'react';

export interface WidgetConfig {
  id: string;
  type: 'metric' | 'alerts' | 'topology' | 'logs' | 'gauge';
  title: string;
  metricKey?: string;
  assetId?: string;
  gridPos: { x: number; y: number; w: number; h: number };
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'metric', title: 'CPU Usage', metricKey: 'cpu_pct', gridPos: { x: 0, y: 0, w: 4, h: 2 } },
  { id: 'w2', type: 'metric', title: 'Memory Usage', metricKey: 'mem_pct', gridPos: { x: 4, y: 0, w: 4, h: 2 } },
  { id: 'w3', type: 'alerts', title: 'Active Problems', gridPos: { x: 8, y: 0, w: 4, h: 2 } },
  { id: 'w4', type: 'topology', title: 'Topology Mini', gridPos: { x: 0, y: 2, w: 6, h: 3 } },
  { id: 'w5', type: 'logs', title: 'Recent Events', gridPos: { x: 6, y: 2, w: 6, h: 3 } },
];

const STORAGE_KEY = 'nexus_dashboard_layout';

export const useDashboard = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch { return DEFAULT_WIDGETS; }
  });

  const saveLayout = useCallback((updated: WidgetConfig[]) => {
    setWidgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addWidget = useCallback((cfg: Omit<WidgetConfig, 'id'>) => {
    const id = `w_${Date.now()}`;
    saveLayout([...widgets, { ...cfg, id }]);
  }, [widgets, saveLayout]);

  const removeWidget = useCallback((id: string) => {
    saveLayout(widgets.filter(w => w.id !== id));
  }, [widgets, saveLayout]);

  const updateWidget = useCallback((id: string, patch: Partial<WidgetConfig>) => {
    saveLayout(widgets.map(w => w.id === id ? { ...w, ...patch } : w));
  }, [widgets, saveLayout]);

  const resetLayout = useCallback(() => {
    saveLayout(DEFAULT_WIDGETS);
  }, [saveLayout]);

  return { widgets, addWidget, removeWidget, updateWidget, resetLayout };
};
