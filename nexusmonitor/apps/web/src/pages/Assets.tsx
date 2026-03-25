import React, { useState } from 'react';
import { useAssets } from '../hooks/useAssets';

const STATUS_COLOR: Record<string, string> = {
  HEALTHY: '#34D399', WARNING: '#FCD34D', CRITICAL: '#F87171', UNKNOWN: '#6B7280'
};

const Assets: React.FC = () => {
  const [search, setSearch] = useState('');
  const { assets, loading, error } = useAssets(search);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = (v: string) => {
    setSearch(v);
    setTimeout(() => setDebouncedSearch(v), 300);
  };

  return (
    <div style={{ padding: 24, background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: '#F8FAFC' }}>Asset Inventory</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            placeholder="Search assets…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              background: '#1E1E2E', border: '1px solid #2D3748', borderRadius: 8,
              padding: '8px 14px', color: '#E2E8F0', fontSize: 13, outline: 'none', width: 240
            }}
          />
        </div>
      </div>

      {loading && <div style={{ color: '#64748B', padding: 40, textAlign: 'center' }}>Loading assets…</div>}
      {error && <div style={{ color: '#F87171', padding: 20 }}>Error: {error}</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {(assets.length ? assets : MOCK_ASSETS).map(asset => (
            <a key={asset.id} href={`/assets/${asset.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: '16px 18px',
                transition: 'border-color 0.2s, transform 0.15s', cursor: 'pointer'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4B5563'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E1E2E'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: 15 }}>{asset.name}</div>
                    <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2, fontFamily: 'monospace' }}>{asset.ip_address}</div>
                  </div>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: STATUS_COLOR[asset.status] || '#6B7280',
                    boxShadow: `0 0 6px ${STATUS_COLOR[asset.status] || '#6B7280'}`
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, background: '#1E1E2E', color: '#64748B', padding: '2px 8px', borderRadius: 6 }}>{asset.asset_type}</span>
                  <span style={{ fontSize: 11, background: '#1E1E2E', color: '#64748B', padding: '2px 8px', borderRadius: 6 }}>{asset.os}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const MOCK_ASSETS = [
  { id: 'esx-01', name: 'ESXi Host 01', ip_address: '10.0.1.10', asset_type: 'ESXi Host', status: 'HEALTHY', os: 'VMware ESXi 8.0', site_id: 's1' },
  { id: 'srv-sql', name: 'SQL Server Primary', ip_address: '10.0.1.20', asset_type: 'Server', status: 'WARNING', os: 'Windows Server 2022', site_id: 's1' },
  { id: 'fw-core', name: 'Core Firewall', ip_address: '10.0.0.1', asset_type: 'Firewall', status: 'HEALTHY', os: 'FortiOS 7.4', site_id: 's1' },
  { id: 'sw-a', name: 'Distribution Switch A', ip_address: '10.0.0.2', asset_type: 'Switch', status: 'HEALTHY', os: 'Cisco IOS 17.6', site_id: 's1' },
  { id: 'nas-01', name: 'NAS Storage Primary', ip_address: '10.0.1.30', asset_type: 'NAS', status: 'CRITICAL', os: 'TrueNAS SCALE 23', site_id: 's1' },
  { id: 'vcenter', name: 'vCenter Server', ip_address: '10.0.1.11', asset_type: 'vCenter', status: 'HEALTHY', os: 'VCSA 8.0', site_id: 's1' },
];

export default Assets;
