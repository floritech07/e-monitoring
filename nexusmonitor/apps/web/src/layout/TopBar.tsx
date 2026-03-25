import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAlertStore } from '../store/alertStore';

const ORGS = ['SBEE Central', 'DataCenter Nord', 'Cloud AWS Prod'];

const TopBar: React.FC = () => {
  const { theme, setTheme, currentOrg, setOrg } = useAppStore();
  const unreadCount = useAlertStore(s => s.unreadCount);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div style={{
      height: 56, background: '#0D0D1A', borderBottom: '1px solid #1E1E2E',
      display: 'flex', alignItems: 'center', paddingLeft: 24, paddingRight: 24,
      gap: 16, flexShrink: 0
    }}>
      {/* Org Selector */}
      <select
        value={currentOrg || ''}
        onChange={e => setOrg(e.target.value)}
        style={{
          background: '#1E1E2E', border: '1px solid #2D3748', color: '#E2E8F0',
          padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', outline: 'none'
        }}>
        <option value="">— Select Organization —</option>
        {ORGS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{
        background: '#1E1E2E', border: '1px solid #2D3748', borderRadius: 8,
        padding: '6px 12px', color: '#94A3B8', cursor: 'pointer', fontSize: 14
      }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Notification bell */}
      <div style={{ position: 'relative' }}>
        <button style={{
          background: '#1E1E2E', border: '1px solid #2D3748', borderRadius: 8,
          padding: '6px 12px', color: '#94A3B8', cursor: 'pointer', fontSize: 14, position: 'relative'
        }}>
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: '#F87171', color: '#fff',
              borderRadius: '50%', width: 16, height: 16, fontSize: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
            }}>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* User Avatar */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setUserMenuOpen(p => !p)} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 14
        }}>A</button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 44, background: '#1E1E2E', border: '1px solid #2D3748',
            borderRadius: 10, padding: 8, minWidth: 180, zIndex: 999
          }}>
            {['Profile', 'API Keys', 'Preferences', 'Sign Out'].map(item => (
              <div key={item} style={{
                padding: '8px 14px', borderRadius: 6, cursor: 'pointer', color: '#94A3B8', fontSize: 13,
                transition: 'background 0.15s'
              }} onMouseEnter={e => (e.currentTarget.style.background = '#2D3748')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
