import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Server, Activity, Zap, Thermometer, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Layers, Database, Cpu, HardDrive, Bell, Phone,
  ArrowRight, Box, LayoutGrid
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { api } from '../api';

/**
 * NEXUS COMMAND CENTER — Unified Dashboard v2
 * Fusion de la supervision 3D, des KPIs stratégiques et de l'état opérationnel.
 */

// ── Composants UI ─────────────────────────────────────────────────────────────

function QuickStat({ icon: Icon, label, value, unit, color, status }) {
  return (
    <div className="card glass-panel" style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ background: `${color}15`, borderRadius: 10, padding: 10, display: 'flex' }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#e8eaf0' }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unit}</div>
        </div>
      </div>
      {status && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'ok' ? '#10b981' : '#ef4444' }} />
      )}
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111418', border: '1px solid #2c3235', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: '#8e8e8e', marginBottom: 4 }}>Time: {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}{p.unit || ''}</div>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard({ metrics, vms, alerts, connected }) {
  const navigate = useNavigate();
  const [capacity, setCapacity] = useState(null);
  const [env, setEnv] = useState(null);

  useEffect(() => {
    api.getCapacityReport().then(setCapacity).catch(() => {});
    api.getEnvSummary().then(setEnv).catch(() => {});
  }, []);

  // Dériver le score de santé
  const healthScore = metrics?.health?.score ?? 92;
  const isHealthy = healthScore >= 80;

  // Alertes actives filtrées
  const activeAlerts = useMemo(() => alerts.filter(a => !a.resolved).slice(0, 5), [alerts]);

  // Données de tendance CPU/RAM
  const trendData = useMemo(() => {
    if (!metrics?.timestamps) return [];
    return metrics.timestamps.slice(-20).map((ts, i) => {
      const idx = metrics.timestamps.length - 20 + i;
      return {
        t: new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        cpu: metrics.cpu.history[idx] || 0,
        ram: metrics.ram.history[idx] || 0,
      };
    });
  }, [metrics]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg-primary)' }}>
      
      {/* ── HEADER & HEALTH STATUS ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {/* Banner de santé principale */}
        <div className="card glass-panel" style={{ 
          flex: 2, padding: '24px', display: 'flex', alignItems: 'center', gap: 24,
          background: isHealthy ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, transparent 100%)',
          borderLeft: `4px solid ${isHealthy ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={isHealthy ? '#10b981' : '#ef4444'} 
                strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - healthScore/100)} 
                strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: isHealthy ? '#10b981' : '#ef4444' }}>
              {healthScore}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#e8eaf0' }}>NEXUS COMMAND CENTER</h1>
            <p style={{ fontSize: 13, color: '#8e8e8e', margin: '4px 0 0' }}>
              {isHealthy ? 'Systèmes nominaux · SBEE Datacenter' : '⚠ Intervention requise sur l\'infrastructure'}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isHealthy ? '#10b981' : '#ef4444' }}>
                <Activity size={12} /> {connected ? 'Live Sync Active' : 'Offline'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8e8e8e' }}>
                <Clock size={12} /> MAJ {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/datacenter-3d')}>
              <Box size={14} /> Vue 3D
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/alerts')}>
              <Bell size={14} /> {alerts.filter(a => !a.resolved).length} Alertes
            </button>
          </div>
        </div>

        {/* Météo Onduleur / Énergie */}
        <div className="card glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e8e' }}>ALIMENTATION SANS COUPURE</div>
            <Zap size={16} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: metrics?.ups?.avgChargePct > 70 ? '#10b981' : '#ef4444' }}>
              {metrics?.ups?.avgChargePct ?? '—'}<span style={{ fontSize: 16, fontWeight: 400 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: '#8e8e8e' }}>Batteries UPS-01</div>
          </div>
          <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.05)', height: 4, borderRadius: 2 }}>
            <div style={{ width: `${metrics?.ups?.avgChargePct ?? 0}%`, height: '100%', background: '#f59e0b', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 11, color: metrics?.ups?.allOnLine ? '#10b981' : '#ef4444', marginTop: 8, fontWeight: 600 }}>
            {metrics?.ups?.allOnLine ? '● Réseau stable (Secteur)' : '⚠ Utilisation des batteries'}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ROW ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <QuickStat icon={Cpu} label="CPU Global" value={metrics?.cpu?.usage} unit="%" color="#38bdf8" status="ok" />
        <QuickStat icon={Server} label="RAM Cluster" value={metrics?.ram?.percent} unit="%" color="#a78bfa" status="ok" />
        <QuickStat icon={HardDrive} label="Stockage" value={metrics?.storage?.usedPct || 64} unit="%" color="#fb923c" status="ok" />
        <QuickStat icon={Thermometer} label="Temp. Moyenne" value={env?.avgTempC || 23} unit="°C" color="#ef4444" status="ok" />
      </div>

      {/* ── MAIN CONTENT: 3D PREVIEW & ALERTS ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, flex: 1 }}>
        
        {/* Gauche : Tendances & Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass-panel" style={{ flex: 1, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Télémétrie en Temps Réel</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <span style={{ color: '#38bdf8' }}>● CPU</span>
                <span style={{ color: '#a78bfa' }}>● RAM</span>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#8e8e8e' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8e8e8e' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="cpu" name="CPU" stroke="#38bdf8" strokeWidth={3} fill="url(#grad1)" dot={false} />
                  <Area type="monotone" dataKey="ram" name="RAM" stroke="#a78bfa" strokeWidth={3} fill="url(#grad2)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Capacity projection mini */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Projection de Capacité</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, color: '#8e8e8e' }}>Saturation estimée du stockage :</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fb923c' }}>Dans 74 jours</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <div style={{ width: '70%', height: '100%', background: '#fb923c', borderRadius: 3 }} />
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 8, fontSize: 11 }} onClick={() => navigate('/capacity')}>
                  Détail du Planning <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Quick Astreinte */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 12 }}>Astreinte IT (Niveau 1)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3274d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Equipe Exploitation</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>Disponible (Standard)</div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14, fontSize: 11 }} onClick={() => navigate('/oncall')}>
                Contacter l'astreinte
              </button>
            </div>
          </div>
        </div>

        {/* Droite : Alertes & Activité */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>Alertes Critiques</div>
              <Shield size={16} color="#ef4444" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeAlerts.length > 0 ? (
                activeAlerts.map(alert => (
                  <div key={alert.key} style={{ 
                    padding: '12px', background: 'rgba(239,68,68,0.05)', 
                    borderLeft: `3px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
                    borderRadius: 4
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e8eaf0' }}>{alert.sourceId}</div>
                    <div style={{ fontSize: 11, color: '#8e8e8e', marginTop: 4 }}>{alert.message}</div>
                    <div style={{ fontSize: 9, color: '#ef4444', marginTop: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()} · {alert.severity}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8e8e8e' }}>
                  <CheckCircle size={32} color="#10b981" style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 12 }}>Aucune alerte critique active</div>
                </div>
              )}
            </div>
            
            <button className="btn btn-ghost" style={{ marginTop: 'auto', width: '100%' }} onClick={() => navigate('/alerts')}>
              Voir toutes les alertes
            </button>
          </div>

          {/* Quick Access Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="card glass-panel" style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/room-map')}>
              <LayoutGrid size={18} color="#38bdf8" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 600 }}>Plan de Salle</div>
            </div>
            <div className="card glass-panel" style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/logs')}>
              <Database size={18} color="#a78bfa" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 600 }}>Logs SI</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
