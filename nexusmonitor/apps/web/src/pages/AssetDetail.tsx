import React, { useState } from 'react';
import MetricCharts from '../components/asset/MetricCharts';
import AlertTimeline from '../components/asset/AlertTimeline';

const TABS = ['Overview', 'Metrics', 'Alerts', 'Actions', 'Config'];

const ACTION_TYPES = ['SSH into asset', 'Reboot server', 'Open RDP', 'Run Ansible playbook', 'Trigger Veeam backup'];

const AssetDetail: React.FC = () => {
  const [tab, setTab] = useState('Overview');
  const assetId = window.location.pathname.split('/').pop() || 'unknown';

  return (
    <div style={{ padding: 24, background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <a href="/assets" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>← Assets</a>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1E1E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🖥</div>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 18, color: '#F8FAFC', margin: 0 }}>{assetId}</h1>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Windows Server 2022 · ESXi Cluster A · Online</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span style={{ background: '#054218', color: '#34D399', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>● HEALTHY</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1E1E2E', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t ? '#A5B4FC' : '#64748B', fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent', fontSize: 14
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Hostname', value: assetId },
            { label: 'IP Address', value: '10.0.1.45' },
            { label: 'OS', value: 'Windows Server 2022' },
            { label: 'Uptime', value: '42 days 6 hours' },
            { label: 'CPU Cores', value: '16 vCPUs' },
            { label: 'RAM', value: '64 GB' },
            { label: 'Monitoring Agent', value: 'NexusAgent v2.1.4' },
            { label: 'Last Seen', value: new Date().toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{label}</div>
              <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Metrics' && <MetricCharts assetId={assetId} />}

      {tab === 'Alerts' && <AlertTimeline assetId={assetId} />}

      {tab === 'Actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Execute remote operations against this asset. Requires OPERATOR role.</div>
          {ACTION_TYPES.map(action => (
            <div key={action} style={{
              background: '#111118', border: '1px solid #1E1E2E', borderRadius: 10,
              padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ color: '#E2E8F0', fontSize: 14 }}>{action}</span>
              <button style={{
                padding: '6px 16px', borderRadius: 8, border: '1px solid #6366F1',
                background: 'transparent', color: '#6366F1', cursor: 'pointer', fontWeight: 600, fontSize: 12
              }}>Execute</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetDetail;
