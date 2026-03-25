import React from 'react';
import { WidgetConfig } from '../../hooks/useDashboard';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useAlertStore } from '../../store/alertStore';

const MOCK_SPARK = Array.from({ length: 20 }, (_, i) => ({ v: 20 + Math.random() * 60 }));

const MetricWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => (
  <div style={{ height: '100%' }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: '#60A5FA' }}>
      {Math.floor(30 + Math.random() * 50)}<span style={{ fontSize: 14, marginLeft: 2, color: '#64748B' }}>%</span>
    </div>
    <div style={{ marginTop: 8, height: 50 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_SPARK}>
          <defs>
            <linearGradient id={`g_${config.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#6366F1" fill={`url(#g_${config.id})`} strokeWidth={1.5} dot={false} />
          <Tooltip contentStyle={{ background: '#1E1E2E', border: 'none', fontSize: 11 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AlertsWidget: React.FC = () => {
  const alerts = useAlertStore(s => s.alerts.slice(0, 4));
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {alerts.length === 0 && <div style={{ color: '#34D399', fontSize: 13, paddingTop: 8 }}>✓ All systems healthy</div>}
      {alerts.map(a => (
        <div key={a.id} style={{ padding: '4px 0', borderBottom: '1px solid #1E1E2E', fontSize: 12, color: '#94A3B8' }}>
          <span style={{ color: a.severity === 'CRITICAL' ? '#F87171' : a.severity === 'HIGH' ? '#FB923C' : '#FCD34D', fontWeight: 700, marginRight: 6 }}>{a.severity}</span>
          {a.title}
        </div>
      ))}
    </div>
  );
};

const LogsWidget: React.FC = () => {
  const logs = [
    { ts: '12:34:01', msg: 'Agent connected: esx-01' },
    { ts: '12:33:47', msg: 'Backup Job "VM Daily" completed' },
    { ts: '12:32:10', msg: 'SNMP trap received from 10.0.1.5' },
    { ts: '12:31:55', msg: 'Alert acknowledged: Disk 90%' },
  ];
  return (
    <div style={{ height: '100%', overflowY: 'auto', fontFamily: 'monospace' }}>
      {logs.map((l, i) => (
        <div key={i} style={{ fontSize: 11, padding: '3px 0', color: '#64748B', borderBottom: '1px solid #111118' }}>
          <span style={{ color: '#4B5563', marginRight: 10 }}>{l.ts}</span>
          <span style={{ color: '#94A3B8' }}>{l.msg}</span>
        </div>
      ))}
    </div>
  );
};

const Widget: React.FC<{ config: WidgetConfig; onRemove: () => void; onEdit: () => void }> = ({ config, onRemove, onEdit }) => (
  <div style={{
    background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, height: '100%',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  }}>
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #1E1E2E', flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{config.title}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>⚙</button>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
      </div>
    </div>
    {/* Body */}
    <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden' }}>
      {config.type === 'metric'   && <MetricWidget config={config} />}
      {config.type === 'alerts'   && <AlertsWidget />}
      {config.type === 'logs'     && <LogsWidget />}
      {config.type === 'topology' && <div style={{ color: '#4B5563', fontSize: 12, paddingTop: 8 }}>Mini Topology (open full view ↗)</div>}
    </div>
  </div>
);

export default Widget;
