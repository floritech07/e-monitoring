import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Server, GitBranch, Bell, Zap, Settings, Users,
  Activity, AlertTriangle, Sun, Moon, Clock, RefreshCw, ChevronDown,
  Search, Calendar, ArrowRight, Shield, Globe, BellRing, Map, CreditCard, List,
  Menu, ChevronLeft, Box, Layers, AppWindow, HardDrive, Network,
  Building2, Thermometer, FileText, TrendingUp, CheckSquare, Phone, BarChart2,
  ClipboardList, Lock,
} from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import { useMetricSounds } from './hooks/useMetricSounds';
import Dashboard from './pages/Dashboard';
import Infrastructure from './pages/Infrastructure';
import ServerDetail from './pages/ServerDetail';
import AlertsPage from './pages/AlertsPage';
import ProblemConsole from './pages/ProblemConsole';
import RemoteActions from './pages/RemoteActions';
import SettingsPage from './pages/SettingsPage';
import UserManagement from './pages/UserManagement';
import AddSystem from './pages/AddSystem';
import Login from './pages/Login';
import HostDetail from './pages/HostDetail';
import NetworkTopology from './pages/NetworkTopology';
import AlertRulesPage from './pages/AlertRulesPage';
import PaymentMonitor from './pages/PaymentMonitor';
import PaymentRecap from './pages/PaymentRecap';
import Datacenter3D from './pages/Datacenter3D';
import DeviceDetail from './pages/DeviceDetail';
import ESXiHostDetail from './pages/ESXiHostDetail';
import ClusterView from './pages/ClusterView';
import ServiceMap from './pages/ServiceMap';
import StorageTopology from './pages/StorageTopology';
import NetworkFabric from './pages/NetworkFabric';
import RoomMap from './pages/RoomMap';
import PhysicalDashboard from './pages/PhysicalDashboard';
import LogsExplorer from './pages/LogsExplorer';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ServiceChecks from './pages/ServiceChecks';
import OnCallPage from './pages/OnCallPage';
import ReportsPage from './pages/ReportsPage';
import AuditTrailPage from './pages/AuditTrailPage';
import CapacityPlanningPage from './pages/CapacityPlanningPage';
import './index.css';

function Sidebar({ alertCount, collapsed }) {
  const navItems = [
    { to: '/',             icon: LayoutDashboard, label: 'Dashboard'           },
    { to: '/executive',    icon: TrendingUp,      label: 'Tableau de bord DG'  },
    { to: '/problems',     icon: BellRing,        label: 'Problèmes', badge: alertCount },
    { to: '/infrastructure',icon: GitBranch,      label: 'Infrastructure'      },
    { to: '/datacenter-3d',icon: Box,             label: 'Salle serveur 3D'    },
    { to: '/room-map',     icon: Building2,       label: 'Vue Salle 2D'        },
    { to: '/topology',     icon: Map,             label: 'Topologie Réseau'    },
    { to: '/alerts',       icon: Bell,            label: 'Alertes', badge: alertCount },
    { section: 'Environnement & Logs' },
    { to: '/physical',     icon: Thermometer,     label: 'Environnement DC'    },
    { to: '/logs',         icon: FileText,        label: 'Explorateur Logs'    },
    { section: 'Virtualisation' },
    { to: '/clusters',       icon: Layers,     label: 'Clusters & Pools'   },
    { to: '/services',       icon: AppWindow,  label: 'Carte des services' },
    { section: 'Infrastructure DC' },
    { to: '/storage',        icon: HardDrive,  label: 'Stockage'           },
    { to: '/network-fabric', icon: Network,    label: 'Fabric réseau'      },
    { section: 'Opérations' },
    { to: '/service-checks',   icon: CheckSquare,   label: 'Vérif. services'    },
    { to: '/oncall',           icon: Phone,          label: 'Astreinte & ITIL'   },
    { to: '/reports',          icon: BarChart2,      label: 'Rapports'           },
    { to: '/capacity',         icon: TrendingUp,     label: 'Capacity Planning'  },
    { section: 'Sécurité & Conformité' },
    { to: '/audit',            icon: ClipboardList,  label: 'Piste d\'audit'     },
    { section: 'Intégrations' },
    { to: '/payments',icon: CreditCard,       label: 'Monitoring Paiements' },
    { to: '/payments/recap', icon: List,      label: 'Récapitulatif Paiements' },
    { to: '/actions', icon: Zap,             label: 'Actions à distance' },
    { section: 'Configuration' },
    { to: '/rules',   icon: BellRing,        label: 'Règles d\'alertes' },
    { to: '/settings',icon: Settings,        label: 'Paramètres'   },
    { to: '/users',   icon: Users,           label: 'Utilisateurs' },
  ];

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
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
            {!collapsed && <span className="label-text">{item.label}</span>}
            {item.badge > 0 && <span className="badge">{item.badge}</span>}
          </NavLink>
        );
      })}
    </aside>
  );
}

function TimePicker({ timeRange, setTimeRange, refreshRate, setRefreshRate, onManualRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshOpen, setIsRefreshOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRange = () => {
    setIsOpen(!isOpen);
    setIsRefreshOpen(false); // Close other
  };

  const toggleRefresh = () => {
    setIsRefreshOpen(!isRefreshOpen);
    setIsOpen(false); // Close other
  };

  const closeAll = () => {
    setIsOpen(false);
    setIsRefreshOpen(false);
  };

  const quickRanges = [
    { label: 'Last 5 minutes', value: '5m' },
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last 30 minutes', value: '30m' },
    { label: 'Last 1 hour', value: '1h' },
    { label: 'Last 3 hours', value: '3h' },
    { label: 'Last 6 hours', value: '6h' },
    { label: 'Last 12 hours', value: '12h' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 2 days', value: '2d' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 6 months', value: '6mo' },
    { label: 'Last 1 year', value: '1y' },
    { label: 'Last 2 years', value: '2y' },
    { label: 'Last 5 years', value: '5y' },
    { label: 'Yesterday', value: 'yesterday' },
  ];

  const refreshOptions = [
    { label: 'Off', value: '0' },
    { label: 'Auto', value: 'int-10000' },
    { label: '10s', value: '10' },
    { label: '30s', value: '30' },
    { label: '1m', value: '60' },
    { label: '5m', value: '300' },
    { label: '15m', value: '900' },
    { label: '1h', value: '3600' },
  ];

  const currentRange = quickRanges.find(r => r.value === timeRange) || quickRanges[3];
  const currentRefreshLabel = refreshOptions.find(o => o.value === refreshRate)?.label || 'Off';

  const filteredRanges = quickRanges.filter(r => r.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      {/* Backdrop for click-away closing */}
      {(isOpen || isRefreshOpen) && (
        <div 
          onClick={closeAll} 
          style={{ position: 'fixed', inset: 0, zIndex: 998, backgroundColor: 'transparent' }} 
        />
      )}

      {/* Time Range Selector */}
      <div style={{ position: 'relative', zIndex: isOpen ? 1000 : 1 }}>
        <button 
          onClick={toggleRange}
          style={{ 
            backgroundColor: '#181b1f', border: '1px solid #2c3235', borderRadius: '2px', 
            padding: '4px 10px', color: '#e8eaf0', fontSize: '11px', display: 'flex', 
            alignItems: 'center', gap: '6px', cursor: 'pointer', height: '32px'
          }}
        >
          <Clock size={12} style={{ color: '#8e8e8e' }} />
          <span style={{ fontWeight: 600 }}>{currentRange.label} <span style={{ color: '#f59123', fontSize: '9px', marginLeft: '4px' }}>WAT</span></span>
          <ChevronDown size={12} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </button>
        
        {isOpen && (
          <div style={{ 
            position: 'absolute', top: '100%', right: 0, marginTop: '4px', 
            backgroundColor: '#181b1f', border: '1px solid #2c3235', borderRadius: '2px', 
            zIndex: 1001, width: '550px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* ... Content ... */}
            <div style={{ display: 'flex', borderBottom: '1px solid #2c3235' }}>
              {/* Left Pane: Absolute */}
              <div style={{ flex: 1, padding: '15px', borderRight: '1px solid #2c3235' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>Période temporelle absolue</div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8e8e8e', marginBottom: '4px' }}>De</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" defaultValue="now-3h" style={{ backgroundColor: '#0b0c10', border: '1px solid #2c3235', color: '#fff', padding: '6px 10px', fontSize: '11px', flex: 1 }} />
                    <button style={{ backgroundColor: '#21262d', border: '1px solid #2c3235', padding: '0 8px', color: '#fff' }}><Calendar size={14} /></button>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#8e8e8e', marginBottom: '4px' }}>À</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" defaultValue="now" style={{ backgroundColor: '#0b0c10', border: '1px solid #2c3235', color: '#fff', padding: '6px 10px', fontSize: '11px', flex: 1 }} />
                    <button style={{ backgroundColor: '#21262d', border: '1px solid #2c3235', padding: '0 8px', color: '#fff' }}><Calendar size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ backgroundColor: '#21262d', border: '1px solid #2c3235', padding: '8px', color: '#fff' }}><RefreshCw size={14} /></button>
                  <button style={{ backgroundColor: '#21262d', border: '1px solid #2c3235', padding: '8px', color: '#fff' }}><Calendar size={14} /></button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    style={{ backgroundColor: '#3274d9', border: 'none', color: '#fff', padding: '0 15px', fontSize: '11px', fontWeight: 'bold', flex: 1, cursor: 'pointer' }}
                  >
                    Appliquer la plage de temps
                  </button>
                </div>
                <div style={{ marginTop: '20px', fontSize: '11px', color: '#8e8e8e', lineHeight: '1.6' }}>
                  Il semble que vous n'ayez jamais utilisé ce sélecteur de temps dans le passé.
                </div>
              </div>

              {/* Right Pane: List & Search */}
              <div style={{ width: '250px', backgroundColor: '#111217', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #2c3235' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8e8e8e' }} />
                    <input 
                      type="text" 
                      placeholder="Rechercher dans les pla..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ backgroundColor: '#0b0c10', border: '1px solid #2c3235', color: '#fff', padding: '6px 10px 6px 30px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                  {filteredRanges.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => { setTimeRange(opt.value); setIsOpen(false); }}
                      style={{ 
                        padding: '8px 15px', fontSize: '11px', cursor: 'pointer', 
                        backgroundColor: timeRange === opt.value ? 'rgba(50, 116, 217, 0.1)' : 'transparent',
                        color: timeRange === opt.value ? '#3274d9' : '#fff', 
                        borderLeft: timeRange === opt.value ? '2px solid #3274d9' : '2px solid transparent'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = timeRange === opt.value ? 'rgba(50, 116, 217, 0.1)' : 'transparent'}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ backgroundColor: '#181b1f', padding: '8px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', borderBottomLeftRadius: '2px', borderBottomRightRadius: '2px' }}>
              <div style={{ color: '#8e8e8e' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Africa/Porto-Novo</span> Benin, WAT <span style={{ color: '#fff' }}>UTC+01:00</span>
              </div>
              <button style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px' }}>
                <ChevronDown size={10} /> Modifier les paramètres de l'heure
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refresh Selector */}
      <div style={{ position: 'relative', display: 'flex', border: '1px solid #2c3235', borderRadius: '2px', height: '32px', zIndex: isRefreshOpen ? 1000 : 1 }}>
        <button 
          className="refresh-trigger"
          title="Actualiser maintenant"
          onClick={() => onManualRefresh()}
          style={{ backgroundColor: '#181b1f', border: 'none', borderRight: '1px solid #2c3235', padding: '0 10px', color: '#e8eaf0', cursor: 'pointer', borderTopLeftRadius: '2px', borderBottomLeftRadius: '2px' }}
        >
          <RefreshCw size={12} style={{ color: refreshRate !== '0' ? '#5794f2' : '#8e8e8e' }} />
        </button>
        <button 
          onClick={toggleRefresh}
          style={{ backgroundColor: '#181b1f', border: 'none', padding: '0 12px', color: '#e8eaf0', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, borderTopRightRadius: '2px', borderBottomRightRadius: '2px' }}
        >
          <span style={{ color: refreshRate !== '0' ? '#5794f2' : '#e8eaf0' }}>{currentRefreshLabel}</span>
          <ChevronDown size={12} style={{ opacity: 0.5, transform: isRefreshOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {isRefreshOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', backgroundColor: '#181b1f', border: '1px solid #2c3235', borderRadius: '2px', zIndex: 1001, width: '100px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
            {refreshOptions.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { setRefreshRate(opt.value); setIsRefreshOpen(false); }}
                style={{ padding: '8px 12px', fontSize: '11px', cursor: 'pointer', backgroundColor: refreshRate === opt.value ? '#3274d9' : 'transparent', color: '#fff', borderBottom: '1px solid #222' }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const { connected, metrics, vms, alerts, activity } = useSocket();
  const [user,        setUser]        = useState(null);
  const [theme,       setTheme]       = useState(() => localStorage.getItem('sbee_theme') || 'dark');
  const [refreshRate, setRefreshRate] = useState('10');
  const [timeRange,   setTimeRange]   = useState('1h');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const alertStatus = useMetricSounds(metrics, vms, alerts);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed);
    document.documentElement.style.setProperty('--sidebar-width', sidebarCollapsed ? '64px' : '240px');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light-mode');
    else root.classList.remove('light-mode');
    localStorage.setItem('sbee_theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('sbee_user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch (_) {} }
  }, []);

  const toggleTheme   = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const activeAlerts  = alerts.filter(a => !a.resolved);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem('sbee_user', JSON.stringify(userData));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('sbee_user');
  }

  const isPaymentPage = window.location.pathname === '/payments';

  if (!user) {
    return <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <BrowserRouter>
      <div className={`app-shell-container${alertStatus.active ? ' has-alert-banner' : ''}`}>
        {alertStatus.active && (
          <div className={`global-alert-banner ${alertStatus.type}`}>
            <AlertTriangle className="alert-icon" size={18} />
            <span>{alertStatus.message}</span>
            <div className="alert-pulse-line" />
          </div>
        )}

        <div className="app-shell">
          {/* Header */}
          <header className="app-header">
            <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                className="sidebar-toggle-btn"
              >
                {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
              </button>
              <div className="logo">
                <Activity size={20} color="var(--accent)" />
                {!sidebarCollapsed && <span>SBEE <span style={{ color: 'var(--text-primary)', fontWeight: 400 }}>Monitor</span></span>}
              </div>
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
              {criticalCount > 0 && (
                <div className="header-badge" style={{ borderColor: 'rgba(245,83,75,0.3)', color: 'var(--danger)' }}>
                  <AlertTriangle size={12} />
                  {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                </div>
              )}

              <TimePicker 
                timeRange={timeRange} 
                setTimeRange={setTimeRange} 
                refreshRate={refreshRate} 
                setRefreshRate={setRefreshRate} 
                onManualRefresh={() => setRefreshCounter(c => c + 1)}
              />

              <div
                className="header-badge"
                style={{ cursor: 'pointer', width: 32, justifyContent: 'center' }}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </div>

              <div className="header-badge" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Se déconnecter">
                <Users size={12} />
                {user.name}
                <div style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, marginLeft: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                  Déconnexion
                </div>
              </div>
            </div>
          </header>

          <Sidebar alertCount={activeAlerts.length} collapsed={sidebarCollapsed} />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard metrics={metrics} vms={vms} alerts={alerts} activity={activity} connected={connected} timeRange={timeRange} />} />
              <Route path="/problems" element={<ProblemConsole alerts={activeAlerts} connected={connected} />} />
              <Route path="/infrastructure" element={<Infrastructure vms={vms} metrics={metrics} />} />
              <Route path="/infrastructure/new" element={<AddSystem />} />
              <Route path="/infrastructure/host-details" element={<HostDetail metrics={metrics} />} />
              <Route path="/infrastructure/:vmId" element={<ServerDetail vms={vms} metrics={metrics} />} />
              <Route path="/datacenter-3d" element={<Datacenter3D />} />
              <Route path="/datacenter-3d/device/:deviceId" element={<DeviceDetail />} />
              <Route path="/infrastructure/esxi/:hostId" element={<ESXiHostDetail />} />
              <Route path="/clusters" element={<ClusterView />} />
              <Route path="/services" element={<ServiceMap />} />
              <Route path="/storage" element={<StorageTopology />} />
              <Route path="/network-fabric" element={<NetworkFabric />} />
              <Route path="/room-map" element={<RoomMap />} />
              <Route path="/physical" element={<PhysicalDashboard />} />
              <Route path="/logs" element={<LogsExplorer />} />
              <Route path="/executive" element={<ExecutiveDashboard />} />
              <Route path="/service-checks" element={<ServiceChecks />} />
              <Route path="/oncall"         element={<OnCallPage />} />
              <Route path="/reports"        element={<ReportsPage />} />
              <Route path="/capacity"       element={<CapacityPlanningPage />} />
              <Route path="/audit"          element={<AuditTrailPage />} />
              <Route path="/topology" element={<NetworkTopology metrics={metrics} vms={vms} />} />
              <Route path="/alerts" element={<AlertsPage alerts={alerts} />} />
              <Route path="/actions" element={<RemoteActions vms={vms} />} />
              <Route path="/rules" element={<AlertRulesPage />} />
              <Route path="/payments" element={<PaymentMonitor timeRange={timeRange} refreshRate={refreshRate} refreshCounter={refreshCounter} />} />
              <Route path="/payments/recap" element={<PaymentRecap refreshCounter={refreshCounter} />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
