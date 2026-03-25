import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWebSocketClient } from '../../lib/websocket/client';

interface AlertRow {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  asset_id: string;
  state: string;
  fired_at: string;
  acknowledged: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#FF2D55',
  HIGH: '#FF6B2B',
  WARNING: '#FFD60A',
  INFO: '#30D158',
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20,
    background: SEVERITY_COLORS[severity] || '#888', color: '#000', fontWeight: 700, fontSize: 11
  }}>
    {severity}
  </span>
);

const ProblemConsole: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const subscribe = useWebSocketClient(s => s.subscribe);

  useEffect(() => {
    // Boot with mock data for dev rendering
    setAlerts([
      { id: '1', title: 'Host Down: esx-01', severity: 'CRITICAL', asset_id: 'esx-01', state: 'FIRING', fired_at: new Date().toISOString(), acknowledged: false },
      { id: '2', title: 'Disk 95% Full: /data', severity: 'HIGH', asset_id: 'srv-sql', state: 'FIRING', fired_at: new Date().toISOString(), acknowledged: false },
      { id: '3', title: 'CPU Spike: 92%', severity: 'WARNING', asset_id: 'srv-app-1', state: 'FIRING', fired_at: new Date().toISOString(), acknowledged: true },
    ]);
    
    const unsub = subscribe('alert.fired', (payload: AlertRow) => {
      setAlerts(prev => [payload, ...prev.filter(a => a.id !== payload.id)]);
      if (soundEnabled && payload.severity === 'CRITICAL') {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 880;
          osc.connect(ctx.destination);
          osc.start();
          setTimeout(() => { osc.stop(); ctx.close(); }, 800);
        } catch {}
      }
    });
    
    const unsubRes = subscribe('alert.resolved', (payload: any) => {
      setAlerts(prev => prev.filter(a => a.id !== payload.id));
    });
    
    return () => { unsub(); unsubRes(); };
  }, [subscribe, soundEnabled]);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    // POST /api/alerts/{id}/acknowledge
  };

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <div style={{ padding: '24px', background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC' }}>Problem Console</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === s ? '#6366F1' : '#1E1E2E', color: '#E2E8F0', fontWeight: 600, fontSize: 12
              }}>
              {s}
            </button>
          ))}
          <button onClick={() => setSoundEnabled(p => !p)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #2D2D3D', background: 'transparent', color: soundEnabled ? '#34D399' : '#6B7280', cursor: 'pointer' }}>
            {soundEnabled ? '🔔 Sound ON' : '🔕 Sound OFF'}
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1E1E2E' }}>
              {['Severity', 'Title', 'Asset', 'State', 'Fired At', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr key={alert.id}
                style={{
                  background: alert.acknowledged ? '#111118' : alert.severity === 'CRITICAL' ? '#1A0010' : '#0F0F1A',
                  borderBottom: '1px solid #1E1E2E',
                  transition: 'background 0.2s'
                }}>
                <td style={{ padding: '14px 16px' }}><SeverityBadge severity={alert.severity} /></td>
                <td style={{ padding: '14px 16px', fontWeight: 500, color: alert.acknowledged ? '#6B7280' : '#F1F5F9' }}>{alert.title}</td>
                <td style={{ padding: '14px 16px', color: '#94A3B8', fontFamily: 'monospace' }}>{alert.asset_id}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: alert.state === 'FIRING' ? '#FF2D55' : '#34D399', fontWeight: 600, fontSize: 12 }}>{alert.state}</span>
                </td>
                <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>{new Date(alert.fired_at).toLocaleString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  {!alert.acknowledged && (
                    <button onClick={() => handleAcknowledge(alert.id)}
                      style={{
                        padding: '5px 14px', borderRadius: 8, border: '1px solid #6366F1',
                        background: 'transparent', color: '#6366F1', cursor: 'pointer', fontSize: 12
                      }}>
                      ACK
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#4B5563' }}>No active alerts</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemConsole;
