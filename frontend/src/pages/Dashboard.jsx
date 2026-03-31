import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, ShieldAlert, Monitor, Server, Database, 
  AlertCircle, MapPin, Terminal, CheckCircle2, 
  Cpu, MemoryStick, HardDrive, Activity, Zap, ChevronRight, GitBranch,
  Power, RotateCcw, Trash2, List, Play, Square, XCircle, Globe
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import '../Topology.css';

const getScoreColor = (pct) => pct >= 90 ? '#38b249' : pct >= 75 ? '#f59c23' : '#f23e42';

const MetricCircle = ({ value, label, subLabel, color, icon: Icon, details, onClick }) => {
  const radius = 42; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div 
      className="card glass-panel" 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '20px', 
        textAlign: 'center', 
        border: '1px solid var(--border-bright)', 
        position: 'relative', 
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: color, opacity: 0.5 }} />
      
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 16 }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${color}44)` }}>
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            style={{ transition: '1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(value)}%</div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, marginBottom: 16 }}>{subLabel}</div>
      
      {details && (
        <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {details.map((d, i) => (
            <div key={i} style={{ textAlign: i % 2 === 0 ? 'left' : 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{d.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DiskPie = ({ disk, onClick }) => {
  const data = [
    { name: 'Utilisé', value: parseFloat(disk.used), color: '#f5534b' },
    { name: 'Libre', value: parseFloat(disk.available), color: '#22d3a3' }
  ];
  
  const totalGB = (parseFloat(disk.size) / (1024**3)).toFixed(1);
  const usedGB = (parseFloat(disk.used) / (1024**3)).toFixed(1);
  const freeGB = (parseFloat(disk.available) / (1024**3)).toFixed(1);

  return (
    <div 
      className="card glass-panel" 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '16px', 
        border: '1px solid var(--border-bright)',
        cursor: 'pointer'
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
        Disque: {disk.mount}
      </div>
      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
              formatter={(val) => `${(val / (1024**3)).toFixed(1)} Go`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 10 }}>
         <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Utilisé</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f5534b' }}>{usedGB} Go</div>
         </div>
         <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Libre</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3a3' }}>{freeGB} Go</div>
         </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, width: '100%', textAlign: 'center' }}>
        Taille Totale: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalGB} Go</span>
      </div>
    </div>
  );
};

export default function Dashboard({ metrics, vms, alerts, activity, connected, timeRange }) {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  // Merge system logs from metrics, alerts, and local activity logs
  const displayLogs = useMemo(() => {
    const sysLogs = metrics?.logs || [];
    const alertLogs = (alerts || []).map(a => ({
      id: a.id,
      time: new Date(a.timestamp).toLocaleTimeString('fr-FR'),
      msg: a.message,
      type: a.level,
      ts: a.timestamp
    }));
    
    const persistLogs = (activity || []).map(a => ({
      id: a.id,
      time: a.time,
      msg: a.msg,
      type: a.type,
      ts: a.timestamp
    }));
    
    // Prioritize persistent logs (actions) and alerts over generic system logs
    return [...persistLogs, ...alertLogs, ...sysLogs].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 30);
  }, [metrics?.logs, alerts, activity]);


  const parseRangeToSeconds = (range) => {
    const value = parseInt(range);
    const unit = range.replace(/[0-9]/g, '');
    switch(unit) {
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  };

  const timeDomain = useMemo(() => {
    const rangeSec = parseRangeToSeconds(timeRange);
    const latestTs = (metrics?.timestamps && metrics.timestamps.length > 0) 
      ? metrics.timestamps[metrics.timestamps.length - 1] 
      : Date.now();
    const nowAnchor = (Date.now() - latestTs < 30000) ? Date.now() : latestTs;
    return [nowAnchor - rangeSec * 1000, nowAnchor];
  }, [timeRange, metrics]);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    const ticks = metrics.timestamps || [];
    const domainStart = timeDomain[0];
    
    const startIndex = ticks.findIndex(ts => ts >= domainStart);
    const visibleTicks = (startIndex === -1) ? [] : ticks.slice(startIndex);

    return visibleTicks.map((ts, i) => {
      const idx = startIndex + i;
      const date = new Date(ts);
      return {
        timestamp: ts,
        t: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fullTime: date.toLocaleTimeString('fr-FR'),
        CPU: metrics.cpu.history[idx] ?? 0,
        RAM: metrics.ram.history[idx] ?? 0,
        RX: parseFloat(((metrics.network?.rx_history?.[idx] || 0) / 1024 / 1024).toFixed(2)),
        TX: parseFloat(((metrics.network?.tx_history?.[idx] || 0) / 1024 / 1024).toFixed(2)),
      };
    });
  }, [metrics, timeRange, timeDomain]);

  if (!metrics) {
    return (
      <div className="empty-state">
        <div className="loading-spin" />
        Initialisation du backend...
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  const formatSpeed = (bytes) => {
    if (!bytes || bytes === 0) return '0 Ko/s';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko/s';
    return (bytes / (1024 * 1024)).toFixed(2) + ' Mo/s';
  };

  const rxCurrent = metrics.network?.rx_sec || 0;
  const txCurrent = metrics.network?.tx_sec || 0;
  const rxLen = metrics.network?.rx_history?.length || 0;
  const rxPrev = rxLen > 1 ? metrics.network.rx_history[rxLen - 2] : rxCurrent;
  const txPrev = rxLen > 1 ? metrics.network.tx_history[rxLen - 2] : txCurrent;


  const requestAction = (action) => {
    setConfirmAction(action);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    
    try {
      const res = await fetch('http://localhost:3001/api/host/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      
      if (!data.success) {
        console.error(`Action failed: ${data.error}`);
      }
    } catch (err) {
      console.error('API error:', err);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 40, position: 'relative' }}>
      {/* En-tête de page */}
      <div className="page-header">
        <div>
          <h1 className="page-title glow-text" style={{ fontSize: '26px' }}>Centre de Supervision SBEE</h1>
          <p className="page-subtitle">Monitoring d'infrastructure en temps réel • {timeRange}</p>
        </div>
        <div className="header-badge online" style={{ padding: '8px 16px' }}>
          <Activity size={14} />
          <span style={{ fontWeight: 600 }}>MONITORING ACTIF</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: 24 }}>
        
        {/* COLONNE GAUCHE : L'UC PHYSIQUE ET ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card glass-panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="card-title" style={{ width: '100%', marginBottom: 30, justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Monitor size={14} color="var(--accent)" /> SUPERVISEUR RÉSEAU SBEE
            </div>
            
            <div className="node-host-premium" onClick={() => navigate('/infrastructure/host-details')} title="Accéder aux contrôles avancés" style={{ cursor: 'pointer', position: 'relative', marginBottom: 60 }}>
              <div style={{ 
                width: 280, height: 200, 
                background: `url(/${(metrics.host.machineType && metrics.host.machineType !== 'uc' ? metrics.host.machineType.replace('_', '-') : 'uc-hp')}.png)`,
                backgroundSize: 'contain', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center',
                filter: 'drop-shadow(0 0 20px rgba(79, 142, 247, 0.4))'
              }} />
              
              <div className="host-labels-modern" style={{ textAlign: 'center', marginTop: -20 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{metrics.host.hostname}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4, opacity: 0.8 }}>
                  {metrics.host.machineType === 'serveur' ? 'SERVEUR NOEUD MAÎTRE' : 'STATION DE TRAVAIL - NOEUD MAÎTRE'}
                </div>
              </div>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 32, marginTop: 20 }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Système</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{metrics.host.os}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Modèle Matériel</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{metrics.host.hardware?.model || 'PC'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>IP Locale</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace' }}>{metrics.host.localIP || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Installé le</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {typeof metrics.host.installDate === 'string' ? metrics.host.installDate.split(' ')[0] : 'N/A'}
                    </div>
                  </div>
                  {metrics.host.hardware && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Génération CPU</div>
                      <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--success)' }}>{metrics.host.hardware.cpuGeneration || 'N/A'}</div>
                    </div>
                  )}
                  {metrics.host.ramLayout && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Dispo. Mémoire</div>
                      <div style={{ fontWeight: 600, fontSize: 11 }}>{metrics.host.ramLayout.usedSlots}/{metrics.host.ramLayout.totalSlots} Slots Utilisés</div>
                    </div>
                  )}
               </div>
               
               <div style={{ marginTop: 28 }}>
                 <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Actions Rapides</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--success-bg)', color: 'var(--success)', justifyContent: 'center' }} onClick={() => requestAction('Démarrage')}>
                      <Play size={14} /> Démarrer
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--accent-glow)', color: 'var(--accent)', justifyContent: 'center' }} onClick={() => requestAction('Redémarrage')}>
                      <RotateCcw size={14} /> Relancer
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--danger-bg)', color: 'var(--danger)', justifyContent: 'center' }} onClick={() => requestAction('Arrêt')}>
                      <Power size={14} /> Éteindre
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }} onClick={() => requestAction('Vidage du cache')}>
                      <Trash2 size={14} /> Nettoyer
                    </button>
                 </div>
               </div>
            </div>
          </div>

          {/* LISTE DES MACHINES VIRTUELLES (VMWARE) */}
          <div className="card glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-title" style={{ fontSize: '14px', marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={14} color="var(--accent)" /> Machines Virtuelles
              </div>
              {vms.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {[...new Set(vms.map(v => v.hypervisor).filter(Boolean))].map(hv => (
                    <span key={hv} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: hv === 'VMware' ? 'rgba(32,150,243,0.15)' : hv === 'VirtualBox' ? 'rgba(243,156,18,0.15)' : 'rgba(0,180,216,0.15)', color: hv === 'VMware' ? '#2196f3' : hv === 'VirtualBox' ? '#f59c23' : '#00b4d8', border: `1px solid currentColor` }}>{hv}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '350px', paddingRight: 4 }}>
               {vms.length > 0 ? (
                 vms.map((vm, i) => (
                   <div 
                     key={vm.id || `vm-row-${i}`} 
                     onClick={() => navigate(`/infrastructure/${vm.id}`)}
                     style={{ 
                       padding: '12px', 
                       background: 'rgba(255,255,255,0.03)', 
                       borderRadius: '8px', 
                       border: '1px solid var(--border)',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       cursor: 'pointer',
                       transition: 'all 0.2s ease'
                     }}
                     className="vm-item-hover"
                   >
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                          <Monitor size={20} color={vm.state === 'on' ? 'var(--success)' : 'var(--text-muted)'} />
                          <div style={{ 
                            position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%',
                            background: vm.state === 'on' ? 'var(--success)' : 'var(--danger)',
                            border: '2px solid var(--bg-panel)'
                          }} />
                        </div>
                         <div>
                           <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{vm.name}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                             <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{vm.os || 'OS Inconnu'}</div>
                             {vm.transactions !== undefined && vm.transactions !== null && (
                               <div style={{ 
                                 fontSize: 9, 
                                 fontWeight: 800, 
                                 padding: '1px 5px', 
                                 borderRadius: 4, 
                                 background: vm.transactions < 10 ? 'rgba(242, 62, 66, 0.15)' : 'rgba(79, 247, 142, 0.1)',
                                 color: vm.transactions < 10 ? 'var(--danger)' : '#22d3a3',
                                 border: `1px solid ${vm.transactions < 10 ? 'rgba(242, 62, 66, 0.3)' : 'rgba(34, 211, 163, 0.2)'}`
                               }}>
                                 {vm.transactions} TX/s
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: vm.state === 'on' ? 'var(--success)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {vm.state === 'on' ? 'En ligne' : 'Arrêtée'}
                        </div>
                        {vm.cpu && vm.state === 'on' && (
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                            CPU: {vm.cpu.usage}%
                          </div>
                        )}
                      </div>
                   </div>
                 ))
               ) : (
                 <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>Aucune machine virtuelle détectée.</div>
               )}
            </div>
            <div className="card-footer-action">
              <button 
                className="btn-premium-link" 
                onClick={() => navigate('/actions')}
              >
                Gérer et contrôler les machines <Zap size={14} />
              </button>
            </div>

          </div>
        </div>

        {/* COLONNE DROITE : METRIQUES ET LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* DIAGRAMMES CIRCULAIRES PERF & DISQUE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCircle 
              value={metrics.cpu.usage} 
              label="Charge CPU" 
              subLabel={`${metrics.cpu.usage}% actif`} 
              color="#4f8ef7" 
              icon={Cpu} 
              onClick={() => navigate('/infrastructure/host-details')}
              details={[
                { label: 'Cœurs', value: metrics.cpu.cores },
                { label: 'Threads', value: metrics.cpu.cores * 2 },
              ]}
            />
            <MetricCircle 
              value={metrics.ram.percent} 
              label="RAM Serveur" 
              subLabel={`${Math.round(metrics.ram.used/1024/1024/1024)} Go utilisés`} 
              color="#a78bfa" 
              icon={MemoryStick} 
              onClick={() => navigate('/infrastructure/host-details')}
              details={[
                { label: 'Capacité', value: `${Math.round(metrics.ram.total/1024/1024/1024)} Go` },
                { label: 'Type', value: 'DDR4 SDRAM' },
              ]}
            />
            {metrics.disk && metrics.disk.length > 0 ? (
              metrics.disk.slice(0, 2).map((d, i) => (
                <DiskPie key={i} disk={d} onClick={() => navigate('/infrastructure/host-details')} />
              ))
            ) : (
              <MetricCircle value={100} label="Stockage" subLabel="Aucun disque détecté" color="#f5a623" icon={HardDrive} />
            )}
          </div>

          {/* GRAPHE PERFORMANCE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* CPU / RAM */}
            <div className="card glass-panel" onClick={() => navigate('/infrastructure/host-details')} style={{ padding: '24px', cursor: 'pointer' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div className="card-title" style={{ margin: 0 }}><Activity size={13} /> CPU & Mémoire</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600 }}>
                     <span style={{ color: '#4f8ef7' }}>● CPU</span>
                     <span style={{ color: '#22d3a3' }}>● RAM</span>
                  </div>
               </div>
               <div style={{ height: 160 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart key={timeRange} data={chartData}>
                     <defs>
                       <linearGradient id="pCPU" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="pRAM" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#22d3a3" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#22d3a3" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                     <XAxis 
                        dataKey="timestamp" 
                        type="number"
                        domain={timeDomain}
                        allowDataOverflow={true}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={40} 
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      />
                     <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="%" width={35} />
                     <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
                     <Area type="monotone" dataKey="CPU" stroke="#4f8ef7" strokeWidth={2} fillOpacity={1} fill="url(#pCPU)" isAnimationActive={false} />
                     <Area type="monotone" dataKey="RAM" stroke="#22d3a3" strokeWidth={2} fillOpacity={1} fill="url(#pRAM)" isAnimationActive={false} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* RESEAU / INTERNET */}
            <div className="card glass-panel" onClick={() => navigate('/infrastructure/host-details')} style={{ padding: '24px', cursor: 'pointer' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="card-title" style={{ margin: 0 }}><Globe size={13} /> Trafic Réseau & Internet</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                       <span style={{ color: '#f59c23' }}>
                         ↓ {formatSpeed(rxCurrent)} 
                         <span style={{ fontSize: 10, marginLeft: 4 }}>{rxCurrent >= rxPrev ? '▲' : '▼'}</span>
                       </span>
                       <span style={{ color: '#a78bfa' }}>
                         ↑ {formatSpeed(txCurrent)}
                         <span style={{ fontSize: 10, marginLeft: 4 }}>{txCurrent >= txPrev ? '▲' : '▼'}</span>
                       </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600, alignItems: 'flex-start' }}>
                     <span style={{ color: '#f59c23' }}>● Download</span>
                     <span style={{ color: '#a78bfa' }}>● Upload</span>
                  </div>
               </div>
               <div style={{ height: 160 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart key={timeRange} data={chartData}>
                     <defs>
                       <linearGradient id="pRX" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f59c23" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#f59c23" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="pTX" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                     <XAxis 
                        dataKey="timestamp" 
                        type="number"
                        domain={timeDomain}
                        allowDataOverflow={true}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={40} 
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      />
                     <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={35} />
                     <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
                     <Area type="monotone" dataKey="RX" stroke="#f59c23" strokeWidth={2} fillOpacity={1} fill="url(#pRX)" isAnimationActive={false} />
                     <Area type="monotone" dataKey="TX" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#pTX)" isAnimationActive={false} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* LOGS TERMINAL STYLE */}
          <div className="card glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Terminal size={14} color="var(--accent)" /> Logs SI en direct
               </div>
               <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mise à jour automatique</div>
            </div>
            <div style={{ 
               padding: '12px 20px', 
               background: 'var(--bg-elevated)', 
               flex: 1, 
               overflowY: 'auto', 
               maxHeight: '400px', 
               fontFamily: 'JetBrains Mono, monospace', 
               fontSize: '11px', 
               lineHeight: '1.4'
            }}>
               {(displayLogs || []).map((log, i) => (
                 <div key={log.id || `${log.ts}-${i}-${(log.msg || '').substring(0,10)}`} style={{ marginBottom: '8px', display: 'flex', gap: 12, borderLeft: `2px solid ${log.type === 'error' ? 'var(--danger)' : log.type === 'warning' ? 'var(--warning)' : 'transparent'}`, paddingLeft: 8 }}>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>[{log.time}]</span>
                    <span style={{ 
                      color: log.type === 'error' ? 'var(--danger)' : 
                             log.type === 'warning' ? 'var(--warning)' : 
                             log.type === 'success' ? '#22d3a3' : 'var(--text-secondary)' 
                    }}>
                      {log.msg}
                    </span>
                 </div>
               ))}
               <div style={{ opacity: 0.3, fontStyle: 'italic', marginTop: 10, color: 'var(--text-muted)' }}>-- Flux système synchronisé --</div>
            </div>
          </div>



        </div>

      </div>

      {/* MODAL DE CONFIRMATION */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
           <div className="card glass-panel fade-in" style={{ width: 450, padding: 32, textAlign: 'center', border: '1px solid var(--danger-bg)' }}>
             <AlertCircle size={56} color="var(--danger)" style={{ margin: '0 auto 20px' }} />
             <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Confirmation Critique Active</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14, lineHeight: '1.6' }}>
               Vous êtes sur le point d'envoyer la commande OS <strong>[{confirmAction.toUpperCase()}]</strong> à l'hôte physique. 
               {confirmAction === 'Arrêt' || confirmAction === 'Redémarrage' ? <><br/><span style={{ color: 'var(--danger)', fontWeight: 600 }}>Toutes les VMs associées et le contrôleur de domaine seront impactés !</span></> : ''}
             </p>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               <button className="btn btn-ghost" style={{ padding: '12px 0' }} onClick={() => setConfirmAction(null)}>
                 <XCircle size={16} /> Annuler
               </button>
               <button className="btn" style={{ background: 'var(--danger)', color: 'white', padding: '12px 0', border: 'none' }} onClick={executeAction}>
                 <Power size={16} /> CONFIRMER
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
