import React from 'react';
import { useAppStore } from '../store/appStore';

const Settings: React.FC = () => {
  const { currentOrg } = useAppStore();

  return (
    <div style={{ padding: 24, background: '#0A0A12', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, color: '#F8FAFC', marginBottom: 24 }}>System Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* General Section */}
          <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 }}>General Configuration</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Current Organization</label>
              <input value={currentOrg || 'No Org Selected'} disabled style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #374151', background: '#1A1A24', color: '#64748B', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Data Retention Policy (Days)</label>
              <input type="number" defaultValue={90} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #374151', background: '#1E1E2E', color: '#E2E8F0', fontSize: 14 }} />
            </div>
            <button style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Save General Context</button>
          </div>

          {/* Integrations Section */}
          <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 24 }}>
             <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 }}>Integrations</h2>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1E1E2E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20 }}>☁️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>AWS CloudWatch</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Sync EC2 assets and metrics</div>
                  </div>
                </div>
                <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#E2E8F0', fontSize: 12 }}>Configure</button>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1E1E2E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20 }}>🔍</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>Zabbix API</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Pull active legacy triggers</div>
                  </div>
                </div>
                <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#E2E8F0', fontSize: 12 }}>Configure</button>
             </div>
          </div>
        </div>

        <div>
          {/* Quick Actions */}
          <div style={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 }}>Quick Actions</h2>
            <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#E2E8F0', marginBottom: 10, fontSize: 13, cursor: 'pointer' }}>Generate API Key</button>
            <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}>Purge Metric Cache</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
