import React, { useState } from 'react';
import { WidgetConfig } from '../../hooks/useDashboard';

interface Props {
  initial: WidgetConfig | null;
  onSave: (cfg: Omit<WidgetConfig, 'id'>) => void;
  onClose: () => void;
}

const WIDGET_TYPES = ['metric', 'alerts', 'topology', 'logs', 'gauge'];

const WidgetConfigModal: React.FC<Props> = ({ initial, onSave, onClose }) => {
  const [title, setTitle] = useState(initial?.title || 'New Widget');
  const [type, setType] = useState<string>(initial?.type || 'metric');
  const [metricKey, setMetricKey] = useState(initial?.metricKey || 'cpu_pct');

  const handleSave = () => {
    onSave({
      type: type as WidgetConfig['type'],
      title,
      metricKey,
      gridPos: initial?.gridPos || { x: 0, y: 0, w: 4, h: 2 }
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#111118', border: '1px solid #2D3748', borderRadius: 14,
        padding: 28, width: 400, fontFamily: 'Inter, sans-serif', color: '#E2E8F0'
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, color: '#F8FAFC' }}>
          {initial ? 'Edit Widget' : 'Add Widget'}
        </h2>

        <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #374151',
          background: '#1E1E2E', color: '#F1F5F9', marginBottom: 14, boxSizing: 'border-box', fontSize: 14
        }} />

        <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Widget Type</label>
        <select value={type} onChange={e => setType(e.target.value)} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #374151',
          background: '#1E1E2E', color: '#F1F5F9', marginBottom: 14, fontSize: 14
        }}>
          {WIDGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {type === 'metric' && (
          <>
            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Metric Key</label>
            <input value={metricKey} onChange={e => setMetricKey(e.target.value)} placeholder="e.g. cpu_pct, mem_pct" style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #374151',
              background: '#1E1E2E', color: '#F1F5F9', marginBottom: 14, boxSizing: 'border-box', fontSize: 14
            }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid #374151',
            background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 600
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: '#6366F1', color: '#fff', cursor: 'pointer', fontWeight: 600
          }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;
