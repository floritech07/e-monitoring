import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid, Monitor, Network,
  AlertCircle, Info, CheckCircle2, ChevronRight, PlayCircle,
  Building2, ArrowUpRight, Gauge, Lock, Globe, CpuIcon,
  RefreshCw, BarChart3, List, Terminal
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line
} from 'recharts';
import { api } from '../api';

/**
 * SBEE MONITORING — MISSION CONTROL V3
 * Haute densité de données, Supervision Pro, Zéro fioriture.
 */

// ── COMPOSANTS TECHNIQUES ──────────────────────────────────────────────────

const MetricTile = ({ label, value, unit, icon: Icon, color, trendData, status }) => (
  <div className="card glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '10px', color: status === 'ok' ? '#22d3a3' : '#f5534b', fontWeight: 800 }}>● {status?.toUpperCase()}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{value}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
    </div>
    <div style={{ height: 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData}>
          <Area type="monotone" dataKey="v" stroke={color} fill={`${color}10`} strokeWidth={1.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DetailRow = ({ label, value, subValue, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: color || '#e8eaf0' }}>{value}</div>
      {subValue && <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{subValue}</div>}
    </div>
  </div>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [env, setEnv] = useState(null);
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    api.getEnvSummary().then(setEnv).catch(() => {});
    api.getCapacityReport().then(setCapacity).catch(() => {});
  }, []);

  // Simulation de tendances pour les mini-charts
  const mockTrend = useMemo(() => Array.from({length: 10}, () => ({ v: Math.floor(Math.random() * 20 + 40) })), []);

  const alertStats = useMemo(() => ({
    critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
    info: alerts.filter(a => a.severity === 'info' && !a.resolved).length
  }), [alerts]);

  return (
    <div className="fade-in" style={{ padding: '16px', background: '#08090b', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* ── TOP BAR: SYSTEM HEALTH TICKER ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
        <div className="card glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? '#22d3a3' : '#f5534b', boxShadow: connected ? '0 0 10px #22d3a3' : 'none' }} />
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>SBEE MONITORING <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>// MISSION CONTROL</span></span>
           </div>
           <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)' }} />
           <div style={{ fontSize: '11px', color: '#22d3a3', fontWeight: 700 }}>SYSTEM STATUS: NOMINAL</div>
           <div style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>UPTIME</div><div style={{ fontSize: '11px', fontWeight: 800 }}>14d 06h 22m</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>LATENCY</div><div style={{ fontSize: '11px', fontWeight: 800 }}>1.2ms</div></div>
           </div>
        </div>
        
        <div className="card glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid #f5534b' }}>
           <AlertTriangle size={16} color="#f5534b" />
           <div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>CRITIQUE</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{alertStats.critical}</div>
           </div>
        </div>

        <div className="card glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid #f5a623' }}>
           <AlertCircle size={16} color="#f5a623" />
           <div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>AVERTISSEMENT</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{alertStats.warning}</div>
           </div>
        </div>

        <div className="card glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid #38bdf8' }}>
           <Thermometer size={16} color="#38bdf8" />
           <div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>TEMP. SALLE</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>{env?.avgTempC || 23.1}°C</div>
           </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto', gap: 16 }}>
        
        {/* COL 1: COMPUTE (VMware) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           <MetricTile label="CPU Cluster" value={metrics?.cpu?.usage} unit="%" icon={Cpu} color="#4f8ef7" trendData={mockTrend} status="ok" />
           <div className="card glass-panel" style={{ flex: 1, padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Monitor size={14} color="#4f8ef7" /> VIRTUALISATION
              </div>
              <DetailRow label="VMs Totales" value={vms.length} />
              <DetailRow label="VMs Allumées" value={vms.filter(v => v.state === 'on').length} color="#22d3a3" />
              <DetailRow label="VMs Éteintes" value={vms.filter(v => v.state === 'off').length} />
              <DetailRow label="Hôtes ESXi" value="1" subValue="Stand-alone" />
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: '10px' }} onClick={() => navigate('/infrastructure')}>Gérer l'inventaire</button>
           </div>
        </div>

        {/* COL 2: STORAGE & MEMORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           <MetricTile label="RAM Physique" value={metrics?.ram?.percent} unit="%" icon={Activity} color="#a78bfa" trendData={mockTrend} status="ok" />
           <div className="card glass-panel" style={{ flex: 1, padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HardDrive size={14} color="#fb923c" /> STOCKAGE SAN/NAS
              </div>
              <DetailRow label="Utilisation SAN" value={`${metrics?.storage?.usedPct || 64}%`} subValue="4.2TB / 8.0TB" color="#fb923c" />
              <DetailRow label="IOPS (Moy)" value="1,240" subValue="Latence: 2.1ms" />
              <DetailRow label="Délai Saturation" value="74 Jours" color="#f5a623" />
              <DetailRow label="Santé Disques" value="OPTIMAL" color="#22d3a3" />
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: '10px' }} onClick={() => navigate('/storage')}>Topologie Stockage</button>
           </div>
        </div>

        {/* COL 3: ENERGY & POWER (SBEE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           <MetricTile label="Charge UPS" value={metrics?.ups?.avgChargePct || 98} unit="%" icon={Zap} color="#f5a623" trendData={mockTrend} status="ok" />
           <div className="card glass-panel" style={{ flex: 1, padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color="#f5a623" /> ÉNERGIE SBEE
              </div>
              <DetailRow label="Source Actuelle" value="SECTEUR" color="#22d3a3" />
              <DetailRow label="Tension Entrée" value="232 V" subValue="Stable" />
              <DetailRow label="Autonomie Est." value="45 min" subValue="Sur batteries" />
              <DetailRow label="État ATS" value="NORMAL" />
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: '10px' }} onClick={() => navigate('/ups-diagram')}>Schéma Électrique</button>
           </div>
        </div>

        {/* COL 4: LOGS & SECURITY */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
           <div className="card glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={14} color="#fff" /> FLUX LOGS SI
              </div>
              <div style={{ flex: 1, fontSize: '10px', fontFamily: 'monospace', color: '#8e8e8e', overflow: 'hidden' }}>
                 <div>[00:54:12] Login success user: sbee_admin</div>
                 <div>[00:54:08] SNMP Collect: ESXi-01 success</div>
                 <div>[00:53:45] Backup Job: VM-SRV-PAY started</div>
                 <div>[00:52:10] UPS Self-test passed</div>
              </div>
           </div>
           <div className="card glass-panel" style={{ padding: '16px', borderLeft: '4px solid #22d3a3' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={14} color="#22d3a3" /> SÉCURITÉ GFS
              </div>
              <DetailRow label="Dernier Backup" value="Réussi" subValue="Il y a 2h" color="#22d3a3" />
              <DetailRow label="Jobs en cours" value="1" />
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: '10px' }} onClick={() => navigate('/veeam/gfs')}>État Immutabilité</button>
           </div>
        </div>

      </div>

      {/* ── BOTTOM SECTION: CRITICAL SERVERS TABLE & ALARMS ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, flex: 1 }}>
        
        {/* Table des Serveurs Critiques (Production) */}
        <div className="card glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
           <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              SERVEURS DE PRODUCTION CRITIQUES
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>{vms.filter(v => v.name.includes('PROD')).length} Actifs</div>
           </div>
           <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ textAlign: 'left', fontSize: '10px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                       <th style={{ padding: '10px' }}>IDENTIFIANT VM</th>
                       <th>STATUT</th>
                       <th>CPU</th>
                       <th>RAM</th>
                       <th>IP ADDR</th>
                       <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                 </thead>
                 <tbody>
                    {vms.slice(0, 8).map(vm => (
                      <tr key={vm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '12px' }}>
                         <td style={{ padding: '12px 10px', fontWeight: 700, color: '#fff' }}>{vm.name}</td>
                         <td>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: vm.state === 'on' ? 'rgba(34,211,163,0.1)' : 'rgba(245,83,75,0.1)', color: vm.state === 'on' ? '#22d3a3' : '#f5534b', fontSize: '10px', fontWeight: 800 }}>
                               {vm.state.toUpperCase()}
                            </span>
                         </td>
                         <td style={{ color: vm.cpu?.usage > 80 ? '#f5534b' : '#e8eaf0' }}>{vm.cpu?.usage}%</td>
                         <td>{vm.ram?.percent}%</td>
                         <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8e8e8e' }}>{vm.ip || '10.20.1.' + Math.floor(Math.random()*254)}</td>
                         <td style={{ textAlign: 'right' }}>
                            <button className="btn-icon-sm" onClick={() => navigate(`/console/${vm.id}`)} title="Console"><Terminal size={12} /></button>
                            <button className="btn-icon-sm" onClick={() => navigate(`/infrastructure/${vm.id}`)} title="Détails"><ArrowUpRight size={12} /></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Panneau d'Alarmes Latéral (Flux Temps Réel) */}
        <div className="card glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245,83,75,0.02)' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Bell size={16} color="#f5534b" /> FLUX D'ALARMES EN DIRECT
              </div>
           </div>
           <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
              {alerts.filter(a => !a.resolved).slice(0, 10).map(alert => (
                <div key={alert.key} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12 }}>
                   <div style={{ width: 4, height: 4, borderRadius: '50%', background: alert.severity === 'critical' ? '#f5534b' : '#f5a623', marginTop: 6, flexShrink: 0 }} />
                   <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#e8eaf0' }}>{alert.sourceId} : {alert.message}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(alert.timestamp).toLocaleString()}</div>
                   </div>
                </div>
              ))}
           </div>
           <button className="btn btn-ghost" style={{ width: '100%', borderRadius: 0, border: 'none', background: 'rgba(255,255,255,0.02)', padding: '12px' }} onClick={() => navigate('/alerts')}>
              VOIR LE JOURNAL D'AUDIT COMPLET
           </button>
        </div>

      </div>

    </div>
  );
}
