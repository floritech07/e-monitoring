import React from 'react';
import { useAppStore } from '../store/appStore';
import { useAlertStore } from '../store/alertStore';

type NavItem = { label: string; icon: string; path: string; badge?: number };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Problems', icon: '🚨', path: '/problems' },
  { label: 'Topology', icon: '🕸', path: '/topology' },
  { label: 'Assets', icon: '🖥', path: '/assets' },
  { label: 'Reports', icon: '📄', path: '/reports' },
  { label: 'Actions', icon: '⚡', path: '/actions' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
];

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const unreadCount = useAlertStore(s => s.unreadCount);
  const current = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: sidebarOpen ? 240 : 64,
      background: '#0D0D1A',
      borderRight: '1px solid #1E1E2E',
      transition: 'width 0.2s ease',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #1E1E2E' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0
        }}>⬡</div>
        {sidebarOpen && <span style={{ fontWeight: 800, color: '#F1F5F9', fontSize: 16, letterSpacing: '-0.5px' }}>NexusMonitor</span>}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const isActive = current === item.path || (item.path !== '/' && current.startsWith(item.path));
          const showBadge = item.label === 'Problems' && unreadCount > 0;

          return (
            <a key={item.path} href={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', transition: 'background 0.15s',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {showBadge && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    background: '#F87171', color: '#fff', borderRadius: '50%',
                    width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                  }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
              {sidebarOpen && <span style={{ color: isActive ? '#A5B4FC' : '#64748B', fontWeight: isActive ? 600 : 400, fontSize: 14, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1E1E2E' }}>
        <button onClick={toggleSidebar} style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#1E1E2E', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <span style={{ fontSize: 14 }}>{sidebarOpen ? '◀' : '▶'}</span>
          {sidebarOpen && <span style={{ fontSize: 12 }}>Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
