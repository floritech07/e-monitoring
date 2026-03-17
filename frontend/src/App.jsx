import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Server, GitBranch, Bell, Zap, Settings, Users, Activity, 
  AlertTriangle, Sun, Moon, Clock, RefreshCw, ChevronDown, Search, Calendar, ArrowRight
} from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import Dashboard from './pages/Dashboard';
import Infrastructure from './pages/Infrastructure';
import ServerDetail from './pages/ServerDetail';
import AlertsPage from './pages/AlertsPage';
import RemoteActions from './pages/RemoteActions';
import SettingsPage from './pages/SettingsPage';
import UserManagement from './pages/UserManagement';
import AddSystem from './pages/AddSystem';
import Login from './pages/Login';
import HostDetail from './pages/HostDetail';
import './index.css';

function Sidebar({ alertCount }) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/infrastructure', icon: GitBranch, label: 'Infrastructure' },
    { to: '/alerts', icon: Bell, label: 'Alertes', badge: alertCount },
    { to: '/actions', icon: Zap, label: 'Actions à distance' },
    { section: 'Configuration' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
    { to: '/users', icon: Users, label: 'Utilisateurs' },
  ];

  return (
    <aside className="sidebar">
      {navItems.map((item, i) => {
        if (item.section) return <div key={i} className="nav-section-title">{item.section}</div>;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {item.label}
            {item.badge > 0 && <span className="badge">{item.badge}</span>}
          </NavLink>
        );
      })}
    </aside>
  );
}

function TimePicker({ timeRange, setTimeRange, refreshRate, setRefreshRate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const quickRanges = [
    { label: 'Last 5 minutes', value: '5m' },
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last 30 minutes', value: '30m' },
    { label: 'Last 1 hour', value: '1h' },
    { label: 'Last 3 hours', value: '3h' },
    { label: 'Last 6 hours', value: '6h' },
    { label: 'Last 12 hours', value: '12h' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 2 days', value: '48h' },
    { label: 'Last 7 days', value: '7d' },
  ];

  const refreshOptions = [
    { label: 'Off', value: '0' },
    { label: '5s', value: '5' },
    { label: '10s', value: '10' },
    { label: '30s', value: '30' },
    { label: '1m', value: '60' },
    { label: '5m', value: '300' },
    { label: '15m', value: '900' },
  ];

  const currentRange = quickRanges.find(r => r.value === timeRange) || quickRanges[4];
  const currentRefresh = refreshOptions.find(o => o.value === refreshRate) || refreshOptions[0];

  return (
    <div className="time-picker-controls">
      <button className="tp-button time-range" onClick={() => setIsOpen(!isOpen)} title="Choisir la plage temporelle">
        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
        <span>{currentRange.label} <span style={{ color: 'var(--warning)', fontWeight: 700, marginLeft: 4 }}>WAT</span></span>
        <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      <button className="tp-button refresh" title="Ajuster l'actualisation" onClick={() => {
        const idx = refreshOptions.findIndex(o => o.value === refreshRate);
        const nextIdx = (idx + 1) % refreshOptions.length;
        setRefreshRate(refreshOptions[nextIdx].value);
      }}>
        <RefreshCw size={14} className={refreshRate !== '0' ? 'rotate-animation' : ''} style={{ color: refreshRate !== '0' ? 'var(--accent)' : 'var(--text-muted)' }} />
        {currentRefresh.label !== 'Off' && (
          <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{currentRefresh.label}</span>
        )}
      </button>

      {isOpen && (
        <div className="tp-dropdown fade-in">
          <div className="tp-quick-ranges">
             <div className="tp-search-wrap">
               <Search size={14} className="tp-search-icon" />
               <input 
                 type="text" 
                 placeholder="Rechercher une plage..." 
                 className="tp-search-input"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
             </div>
             {quickRanges.filter(r => r.label.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
               <div 
                 key={r.value} 
                 className={`tp-range-item ${timeRange === r.value ? 'active' : ''}`}
                 onClick={() => { setTimeRange(r.value); setIsOpen(false); }}
               >
                 {r.label}
                 {timeRange === r.value && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59123' }} />}
               </div>
             ))}
          </div>

          <div className="tp-absolute-range">
             <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Période temporelle absolue</div>
             <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>De</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" defaultValue="now-3h" className="tp-search-input" style={{ flex: 1, paddingLeft: 10 }} />
                  <div className="btn btn-ghost btn-sm" style={{ padding: 4 }}><Calendar size={14} /></div>
                </div>
             </div>
             <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>À</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" defaultValue="now" className="tp-search-input" style={{ flex: 1, paddingLeft: 10 }} />
                  <div className="btn btn-ghost btn-sm" style={{ padding: 4 }}><Calendar size={14} /></div>
                </div>
             </div>
             <button className="btn btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>
               Appliquer la plage de temps
             </button>
             
             <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.5', marginTop: 10 }}>
               Il semble que vous n'ayez jamais utilisé ce sélecteur de temps dans le passé...
             </div>
          </div>

          <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <div className="tp-footer">
               <div>Africa/Porto-Novo <span style={{ color: 'var(--text-muted)' }}>Benin, WAT UTC+01:00</span></div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                 Modifier les paramètres de l'heure <ChevronDown size={10} />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const { connected, metrics, vms, alerts } = useSocket();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('sbee_theme') || 'dark');
  const [refreshRate, setRefreshRate] = useState('10'); // Default 10s
  const [timeRange, setTimeRange] = useState('1h');

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
    localStorage.setItem('sbee_theme', theme);
  }, [theme]);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('sbee_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (_) {}
    }
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const activeAlerts = alerts.filter(a => !a.resolved);

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem('sbee_user', JSON.stringify(userData));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('sbee_user');
  }

  if (!user) {
    return <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Header */}
        <header className="app-header">
          <div className="logo">
            <Activity size={20} color="var(--accent)" />
            <span>SBEE</span> Monitor
          </div>
          <div className="header-right">
            <div className={`header-badge ${connected ? 'online' : 'offline'}`}>
              <span className="dot" />
              {connected ? 'En ligne' : 'Déconnecté'}
            </div>
            {metrics && (
              <div className="header-badge">
                <Server size={12} />
                {metrics.host?.hostname}
              </div>
            )}
            {activeAlerts.length > 0 && (
              <div className="header-badge" style={{ borderColor: 'rgba(245,83,75,0.3)', color: 'var(--danger)' }}>
                <AlertTriangle size={12} />
                {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''}
              </div>
            )}

            {/* Controls: Refresh / History (Grafana Style) */}
            <TimePicker 
              timeRange={timeRange} 
              setTimeRange={setTimeRange} 
              refreshRate={refreshRate} 
              setRefreshRate={setRefreshRate} 
            />

            {/* Theme toggle */}
            <div
              className="header-badge"
              style={{ cursor: 'pointer', width: 32, justifyContent: 'center' }}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </div>

            {/* User / Logout */}
            <div className="header-badge" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Se déconnecter">
              <Users size={12} />
              {user.name}
              <div style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, marginLeft: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                Déconnexion
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar alertCount={activeAlerts.length} />

        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard metrics={metrics} vms={vms} alerts={alerts} connected={connected} timeRange={timeRange} />} />
            <Route path="/infrastructure" element={<Infrastructure vms={vms} metrics={metrics} />} />
            <Route path="/infrastructure/new" element={<AddSystem />} />
            <Route path="/infrastructure/host-details" element={<HostDetail metrics={metrics} />} />
            <Route path="/infrastructure/:vmId" element={<ServerDetail vms={vms} metrics={metrics} />} />
            <Route path="/alerts" element={<AlertsPage alerts={alerts} />} />
            <Route path="/actions" element={<RemoteActions vms={vms} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
