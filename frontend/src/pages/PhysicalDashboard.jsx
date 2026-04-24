import { useState, useEffect, useCallback } from 'react';
import { 
  Thermometer, Droplets, Wind, Zap, Battery, AlertTriangle, 
  CheckCircle, Activity, RefreshCw, Shield, Layers, 
  Cpu, Gauge, BarChart, Server, Lock, Unlock, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart as ReBarChart, Bar } from 'recharts';
import { api } from '../api';

// ── helpers ────────────────────────────────────────────────────────────────────

function pct(used, total) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

function tempColor(t) {
  if (t === undefined || t === null) return '#6b7280';
  if (t < 18) return '#38bdf8';
  if (t < 22) return '#34d399';
  if (t < 27) return '#a3e635';
  if (t < 30) return '#fbbf24';
  if (t < 35) return '#f97316';
  return '#ef4444';
}

function StatusDot({ status }) {
  const colors = { 
    ok: '#10b981', warning: '#f59e0b', critical: '#ef4444', 
    disaster: '#dc2626', running: '#10b981', stopped: '#6b7280', 
    on: '#10b981', off: '#6b7280', locked: '#6b7280' 
  };
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
  );
}

function GaugeArc({ value, max = 100, color = '#38bdf8', size = 80, label }) {
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arc = Math.PI * 1.5;
  const startAngle = Math.PI * 0.75;
  const ratio = Math.min(value / max, 1);
  const endAngle = startAngle + arc * ratio;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = arc * ratio > Math.PI ? 1 : 0;
  const bgEnd = startAngle + arc;
  const bgx2 = cx + r * Math.cos(bgEnd);
  const bgy2 = cy + r * Math.sin(bgEnd);
  const bgLarge = arc > Math.PI ? 1 : 0;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <path d={`M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 ${bgLarge} 1 ${bgx2} ${bgy2}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} strokeLinecap="round" />
      {ratio > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#e8eaf0" fontSize={14} fontWeight={700}>{Math.round(value)}%</text>
      {label && <text x={cx} y={cy + 22} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>{label}</text>}
    </svg>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function SensorCard({ sensor }) {
  const tc = tempColor(sensor.tempC);
  const statusLabels = { ok: 'Normal', warning: 'Attention', critical: 'Critique' };
  return (
    <div className="card glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{sensor.location}</span>
        <StatusDot status={sensor.status} />
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Thermometer size={14} color={tc} />
          <span style={{ fontSize: 20, fontWeight: 700, color: tc }}>{sensor.tempC}°C</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Droplets size={14} color="#38bdf8" />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#38bdf8' }}>{sensor.humidity}%</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sensor.smoke && <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>FUMÉE</span>}
          {sensor.water && <span style={{ fontSize: 10, background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>FUITE EAU</span>}
          {!sensor.smoke && !sensor.water && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{statusLabels[sensor.status] || sensor.status}</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        Zone : {sensor.zone} {sensor.rack ? `• Rack ${sensor.rack}` : ''}
      </div>
    </div>
  );
}

function ASHRAEBadge({ compliant, classLabel }) {
  const color = compliant ? '#10b981' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, padding: '6px 14px' }}>
      <Shield size={14} color={color} />
      <span style={{ fontSize: 12, fontWeight: 700, color }}>ASHRAE {classLabel}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{compliant ? '— Conforme' : '— Non conforme'}</span>
    </div>
  );
}

// ── Energy Components ─────────────────────────────────────────────────────────

function TGBTPanel({ tgbt }) {
  if (!tgbt) return null;
  return (
    <div className="card glass-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{tgbt.name}</h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Charge globale : {tgbt.totalKW} kW · cos φ {tgbt.powerFactorGlobal}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{tgbt.mainCurrentA} A</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Courant d'arrivée (3φ)</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {tgbt.circuits.map(c => (
          <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.label}</span>
              <StatusDot status={c.status === 'normal' ? 'ok' : c.status} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.status === 'overload' ? '#ef4444' : 'var(--text-primary)' }}>
              {c.currentA} A <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>/ {c.ratedA}A</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: 4, borderRadius: 2 }}>
                <div style={{ width: `${c.loadPct}%`, height: '100%', background: c.loadPct > 80 ? '#ef4444' : '#10b981', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BMSPanel({ bms }) {
  if (!bms) return null;
  return (
    <div className="card glass-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>BMS — Système de Batteries</h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bms.system}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{bms.overallSOC}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SOC Global</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{bms.estimatedRuntimeMin} min</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Autonomie est.</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bms.strings.map(s => (
          <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Battery size={16} color={s.status === 'ok' ? '#10b981' : '#f59e0b'} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• {s.voltageV} V • {s.currentA} A</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>SOH: <span style={{ color: s.sohPct < 90 ? '#f59e0b' : '#10b981' }}>{s.sohPct}%</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
              {s.cells.map(c => (
                <div key={c.id} title={`Cellule ${c.id}: ${c.voltage}V / ${c.tempC}°C`} style={{ height: 24, background: c.status === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', borderRadius: 3, border: `1px solid ${c.status === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cooling Components ────────────────────────────────────────────────────────

function CRACDetailCard({ crac }) {
  const deltaT = +(crac.returnTempC - crac.supplyTempC).toFixed(1);
  return (
    <div className="card glass-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Wind size={18} color="#38bdf8" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{crac.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{crac.model}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={crac.status} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{crac.status.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Soufflage', value: `${crac.supplyTempC.toFixed(1)}°C`, sub: `Cible ${crac.setpointC}°C` },
          { label: 'Reprise', value: `${crac.returnTempC.toFixed(1)}°C`, sub: `ΔT ${deltaT}°C` },
          { label: 'Puissance', value: `${crac.coolingCapacityKW.toFixed(1)} kW`, sub: `COP ${crac.cop.toFixed(1)}` },
          { label: 'Débit Air', value: `${crac.airflowM3h} m³/h`, sub: `Filtre ${crac.filter.cloggedPct.toFixed(0)}%` },
        ].map(k => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{k.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 12 }}>
        {/* Compresseur */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={12} /> COMPRESSEUR ({crac.compressor.refrigerant})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Vitesse</span><span style={{ fontWeight: 700 }}>{crac.compressor.speedPct.toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Pression HP</span><span style={{ fontWeight: 700 }}>{crac.compressor.pressureHighBar} bar</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>Pression BP</span><span style={{ fontWeight: 700 }}>{crac.compressor.pressureLowBar} bar</span>
          </div>
        </div>
        {/* Filtre / Condensats */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>FILTRE & CONDENSATS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Perte charge</span><span style={{ fontWeight: 700 }}>{crac.filter.pressureDropPa} Pa</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>Niveau bac</span><span style={{ fontWeight: 700 }}>{crac.condensate.levelMm} mm</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span>Pompe</span><span style={{ color: '#10b981', fontWeight: 700 }}>{crac.condensate.pumpStatus.toUpperCase()}</span>
          </div>
        </div>
        {/* Alertes */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>DIAGNOSTIC</div>
          {crac.alarms.length > 0 ? (
            crac.alarms.map((a, i) => (
              <div key={i} style={{ fontSize: 9, color: a.severity === 'warning' ? '#f59e0b' : '#ef4444', marginBottom: 4 }}>
                ⚠ {a.msg}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 11, color: '#10b981' }}>✓ Système nominal</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Efficiency Components ─────────────────────────────────────────────────────

function WUEPanel({ wue }) {
  if (!wue) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="card glass-panel" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: wue.pueStatus === 'good' ? '#10b981' : '#f59e0b' }}>{wue.pue}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PUE (Indicateur efficacité)</div>
          <div style={{ fontSize: 10, marginTop: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '2px 8px', display: 'inline-block' }}>Cible : {wue.pueTarget}</div>
        </div>
        <div className="card glass-panel" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#38bdf8' }}>{wue.itLoadKW}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Charge IT (kW)</div>
        </div>
        <div className="card glass-panel" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f97316' }}>{wue.coolingKW}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Climatisation (kW)</div>
        </div>
        <div className="card glass-panel" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa' }}>{wue.coolingEfficiencyPct}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Efficacité Frigorifique</div>
        </div>
      </div>

      <div className="card glass-panel" style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Historique PUE / Charge IT (24h)</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={wue.history}>
            <defs>
              <linearGradient id="gpue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis yId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[1, 2]} />
            <YAxis yId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Area yId="left" type="monotone" dataKey="pue" stroke="#10b981" fill="url(#gpue)" strokeWidth={2} name="PUE" />
            <Area yId="right" type="monotone" dataKey="itKW" stroke="#38bdf8" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Charge IT (kW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function PhysicalDashboard() {
  const [activeTab, setActiveTab] = useState('general');
  const [summary, setSummary]   = useState(null);
  const [crac, setCrac]         = useState([]);
  const [cracDetail, setCracDetail] = useState([]);
  const [snmp, setSnmp]         = useState(null);
  const [tgbt, setTgbt]         = useState(null);
  const [bms, setBms]           = useState(null);
  const [wue, setWue]           = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [doors, setDoors]       = useState([]);
  
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [
        envSum, cracData, cracDet, snmpData, 
        tgbtData, bmsData, wueData, airData, 
        presData, doorData
      ] = await Promise.allSettled([
        api.getEnvSummary(),
        api.getCracStatus(),
        api.getEnvCRACDetail(),
        api.getSnmpData(),
        api.getEnvTGBT(),
        api.getEnvBMSBatteries(),
        api.getEnvWUE(),
        api.getEnvAirQuality(),
        api.getEnvPressure(),
        api.getEnvDoors(),
      ]);

      if (envSum.status === 'fulfilled')   setSummary(envSum.value);
      if (cracData.status === 'fulfilled')  setCrac(cracData.value);
      if (cracDet.status === 'fulfilled')   setCracDetail(cracDet.value);
      if (snmpData.status === 'fulfilled')  setSnmp(snmpData.value);
      if (tgbtData.status === 'fulfilled')  setTgbt(tgbtData.value);
      if (bmsData.status === 'fulfilled')   setBms(bmsData.value);
      if (wueData.status === 'fulfilled')   setWue(wueData.value);
      if (airData.status === 'fulfilled')   setAirQuality(airData.value);
      if (presData.status === 'fulfilled')  setPressure(presData.value);
      if (doorData.status === 'fulfilled')  setDoors(doorData.value);

      setLastUpdate(new Date());
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const primaryUPS = snmp ? Object.values(snmp).find(d => d.type === 'ups') : null;
  const sensors = summary?.sensors || [];
  const critSensors = sensors.filter(s => s.status === 'critical').length;
  const warnSensors = sensors.filter(s => s.status === 'warning').length;

  const TABS = [
    { id: 'general', label: 'Général', icon: Layers },
    { id: 'energy',  label: 'Énergie',  icon: Zap },
    { id: 'cooling', label: 'Climatisation', icon: Wind },
    { id: 'efficiency', label: 'Efficacité', icon: Gauge },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Activity size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ marginLeft: 12, color: 'var(--text-secondary)' }}>Chargement environnement…</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Environnement Physique DC</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Infrastructure critique · TGBT · BMS · Climatisation de précision SBEE
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {summary?.ashrae && <ASHRAEBadge compliant={summary.ashrae.compliant} classLabel={summary.ashrae.class} />}
          <button onClick={fetchAll} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />
            <span style={{ fontSize: 11 }}>Actualiser</span>
          </button>
          {lastUpdate && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              MAJ {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { icon: Thermometer, label: 'Temp. moyenne', value: `${summary?.avgTempC}°C`, color: tempColor(summary?.avgTempC) },
              { icon: Droplets, label: 'Humidité moy.', value: `${summary?.avgHumidity}%`, color: '#38bdf8' },
              { icon: AlertTriangle, label: 'Critiques', value: critSensors, color: critSensors > 0 ? '#ef4444' : '#10b981' },
              { icon: Zap, label: 'PUE', value: wue?.pue || '—', color: wue?.pueStatus === 'good' ? '#10b981' : '#f59e0b' },
              { icon: Wind, label: 'Clim actifs', value: `${crac.filter(c => c.status === 'running').length} / ${crac.length}`, color: '#a78bfa' },
              { icon: Gauge, label: 'Pression Diff.', value: `${pressure?.sensors[0]?.pressurePa.toFixed(1)} Pa`, color: '#34d399' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card glass-panel" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={16} color={color} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Air Quality */}
            <div className="card glass-panel" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wind size={16} color="#34d399" /> Qualité de l'Air (CO2 / PM2.5)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {airQuality?.sensors.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12 }}>{s.location}</div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.co2Ppm > 1000 ? '#ef4444' : '#10b981' }}>{s.co2Ppm} <span style={{ fontSize: 9 }}>ppm</span></div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>CO₂</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{s.pm25} <span style={{ fontSize: 9 }}>µg/m³</span></div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>PM2.5</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Access Doors */}
            <div className="card glass-panel" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="#fbbf24" /> Sécurité des Accès (Portes)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {doors.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {d.state === 'closed' || d.state === 'locked' ? <Lock size={14} color="#10b981" /> : <Unlock size={14} color="#ef4444" />}
                      <div style={{ fontSize: 12 }}>{d.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: d.state === 'open' ? '#ef4444' : '#10b981', textTransform: 'uppercase' }}>{d.state}</div>
                      {d.lastEventAt && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Dernier event: {new Date(d.lastEventAt).toLocaleTimeString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '10px 0 15px' }}>Capteurs Thermiques ({sensors.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {sensors.map(s => <SensorCard key={s.id} sensor={s} />)}
            </div>
          </div>
        </>
      )}

      {activeTab === 'energy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TGBTPanel tgbt={tgbt} />
          <BMSPanel bms={bms} />
        </div>
      )}

      {activeTab === 'cooling' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {cracDetail.map(c => <CRACDetailCard key={c.id} crac={c} />)}
        </div>
      )}

      {activeTab === 'efficiency' && (
        <WUEPanel wue={wue} />
      )}
    </div>
  );
}
