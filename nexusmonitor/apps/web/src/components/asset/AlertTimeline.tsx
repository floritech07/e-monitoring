import React from 'react';

interface Props { assetId: string; }

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#F87171', HIGH: '#FB923C', WARNING: '#FCD34D', RESOLVED: '#34D399'
};

const MOCK_EVENTS = [
  { id: '1', ts: '2026-03-25 11:50', severity: 'CRITICAL', title: 'Host unreachable via ICMP', duration: '4m 12s' },
  { id: '2', ts: '2026-03-25 10:33', severity: 'HIGH', title: 'CPU spike 95%', duration: '1m 05s' },
  { id: '3', ts: '2026-03-25 09:15', severity: 'WARNING', title: 'Disk 88% utilization', duration: '22m 00s' },
  { id: '4', ts: '2026-03-24 23:01', severity: 'RESOLVED', title: 'Network latency anomaly resolved', duration: '—' },
];

const AlertTimeline: React.FC<Props> = ({ assetId }) => (
  <div>
    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Alert history for <code style={{ color: '#A5B4FC' }}>{assetId}</code></div>
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* Vertical line */}
      <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#1E1E2E' }} />
      {MOCK_EVENTS.map((ev, i) => (
        <div key={ev.id} style={{ marginBottom: 20, position: 'relative' }}>
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -24, top: 4,
            width: 12, height: 12, borderRadius: '50%',
            background: SEVERITY_COLOR[ev.severity],
            boxShadow: `0 0 6px ${SEVERITY_COLOR[ev.severity]}`
          }} />
          <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#E2E8F0', fontSize: 14 }}>{ev.title}</span>
              <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 12, whiteSpace: 'nowrap' }}>{ev.ts}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, color: SEVERITY_COLOR[ev.severity], fontWeight: 600 }}>{ev.severity}</span>
              {ev.duration !== '—' && <span style={{ fontSize: 12, color: '#64748B' }}>Duration: {ev.duration}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AlertTimeline;
