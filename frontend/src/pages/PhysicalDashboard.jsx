import { useState, useEffect, useCallback } from 'react';
import { Thermometer, Droplets, Wind, Zap, Battery, AlertTriangle, CheckCircle, Activity, RefreshCw, Shield } from 'lucide-react';
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
  const colors = { ok: '#10b981', warning: '#f59e0b', critical: '#ef4444', disaster: '#dc2626', running: '#10b981', offline: '#6b7280' };
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
  );
}

function GaugeArc({ value, max = 100, color = '#38bdf8', size = 80 }) {
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
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#e8eaf0" fontSize={14} fontWeight={700}>{value}%</text>
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

function CRACCard({ crac }) {
  const efficiency = crac.coolingCapacityKW > 0
    ? Math.round((crac.coolingCapacityKW / crac.powerConsumptionKW) * 10) / 10
    : 0;
  const deltaT = +(crac.returnTempC - crac.supplyTempC).toFixed(1);
  return (
    <div className="card glass-panel" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Wind size={16} color="#38bdf8" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{crac.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={crac.status} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{crac.status}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Soufflage', value: `${crac.supplyTempC?.toFixed(1)}°C`, color: '#38bdf8' },
          { label: 'Reprise', value: `${crac.returnTempC?.toFixed(1)}°C`, color: '#f97316' },
          { label: 'ΔT', value: `${deltaT}°C`, color: deltaT > 15 ? '#ef4444' : '#10b981' },
          { label: 'Puissance frigo', value: `${crac.coolingCapacityKW?.toFixed(1)} kW`, color: '#a78bfa' },
          { label: 'Consommation', value: `${crac.powerConsumptionKW?.toFixed(1)} kW`, color: '#fbbf24' },
          { label: 'COP', value: efficiency.toFixed(1), color: efficiency >= 3 ? '#10b981' : '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Débit air : {crac.airflowM3h?.toFixed(0)} m³/h</span>
        <span>Salle : {crac.id?.toUpperCase()}</span>
      </div>
    </div>
  );
}

function UPSCard({ ups }) {
  if (!ups) return null;
  const charge = ups.battery?.chargePct ?? 0;
  const load = ups.output?.loadPct ?? 0;
  const chargeColor = charge > 70 ? '#10b981' : charge > 40 ? '#f59e0b' : '#ef4444';
  const loadColor = load < 60 ? '#10b981' : load < 80 ? '#f59e0b' : '#ef4444';
  const onLine = ups.status?.input === 'on_line';
  return (
    <div className="card glass-panel" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Battery size={16} color={chargeColor} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{ups.id || 'UPS-SUKAM-01'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {onLine ? <CheckCircle size={14} color="#10b981" /> : <AlertTriangle size={14} color="#ef4444" />}
          <span style={{ fontSize: 11, fontWeight: 600, color: onLine ? '#10b981' : '#ef4444' }}>
            {onLine ? 'SUR SECTEUR' : 'SUR BATTERIE'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <GaugeArc value={charge} color={chargeColor} size={90} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Charge batterie</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <GaugeArc value={load} color={loadColor} size={90} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Charge sortie</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Autonomie', value: `${ups.battery?.autonomyMin ?? '—'} min`, color: '#a78bfa' },
          { label: 'Tension entrée', value: `${ups.input?.voltageV?.toFixed(0) ?? '—'} V`, color: 'var(--text-primary)' },
          { label: 'Tension sortie', value: `${ups.output?.voltageV?.toFixed(0) ?? '—'} V`, color: 'var(--text-primary)' },
          { label: 'Temp batterie', value: `${ups.battery?.temperatureC?.toFixed(1) ?? '—'}°C`, color: tempColor(ups.battery?.temperatureC) },
          { label: 'Nb alarmes', value: ups.status?.alarmsCount ?? 0, color: ups.status?.alarmsCount > 0 ? '#ef4444' : '#10b981' },
          { label: 'Source', value: ups.source === 'simulation' ? 'SIM' : 'SNMP', color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '7px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
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

// ── main page ──────────────────────────────────────────────────────────────────

export default function PhysicalDashboard() {
  const [summary, setSummary]   = useState(null);
  const [crac, setCrac]         = useState([]);
  const [snmp, setSnmp]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [envSum, cracData, snmpData] = await Promise.allSettled([
        api.getEnvSummary(),
        api.getCracStatus(),
        api.getSnmpData(),
      ]);
      if (envSum.status === 'fulfilled')  setSummary(envSum.value);
      if (cracData.status === 'fulfilled') setCrac(cracData.value);
      if (snmpData.status === 'fulfilled') setSnmp(snmpData.value);
      setLastUpdate(new Date());
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const primaryUPS = snmp
    ? Object.values(snmp).find(d => d.type === 'ups')
    : null;

  const sensors = summary?.sensors || [];
  const critSensors = sensors.filter(s => s.status === 'critical').length;
  const warnSensors = sensors.filter(s => s.status === 'warning').length;

  // Estimate PUE (Power Usage Effectiveness) — simplified
  const cracPower = crac.reduce((s, c) => s + (c.powerConsumptionKW || 0), 0);
  const itPower   = (primaryUPS?.output?.loadPct ?? 40) * 0.5; // kW estimate
  const pue       = cracPower > 0 && itPower > 0 ? +((itPower + cracPower) / itPower).toFixed(2) : null;

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
            Capteurs thermiques · UPS · CRAC · Ambiance salle serveur SBEE
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

      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { icon: Thermometer, label: 'Temp. moyenne', value: summary ? `${summary.avgTempC}°C` : '—', color: tempColor(summary?.avgTempC) },
          { icon: Thermometer, label: 'Temp. max', value: summary ? `${summary.maxTempC}°C` : '—', color: tempColor(summary?.maxTempC) },
          { icon: Thermometer, label: 'Allée chaude', value: summary ? `${summary.hotAisleTempC}°C` : '—', color: tempColor(summary?.hotAisleTempC) },
          { icon: Droplets, label: 'Humidité moy.', value: summary ? `${summary.avgHumidity}%` : '—', color: '#38bdf8' },
          { icon: AlertTriangle, label: 'Capteurs critiques', value: critSensors, color: critSensors > 0 ? '#ef4444' : '#10b981' },
          { icon: AlertTriangle, label: 'Capteurs warning', value: warnSensors, color: warnSensors > 0 ? '#f59e0b' : '#10b981' },
          { icon: Wind, label: 'CRAC actifs', value: `${crac.filter(c => c.status === 'running').length} / ${crac.length}`, color: '#a78bfa' },
          { icon: Zap, label: 'PUE estimé', value: pue ? pue.toFixed(2) : '—', color: pue && pue < 1.5 ? '#10b981' : pue && pue < 2 ? '#f59e0b' : '#ef4444' },
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

      {/* Body : 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* UPS */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Alimentation UPS</h2>
            {primaryUPS
              ? <UPSCard ups={primaryUPS} />
              : (
                <div className="card glass-panel" style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Aucune donnée UPS disponible — vérifier SNMP
                </div>
              )
            }
          </div>

          {/* CRAC units */}
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Unités de climatisation CRAC</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {crac.length > 0
                ? crac.map(c => <CRACCard key={c.id} crac={c} />)
                : <div className="card glass-panel" style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Aucun CRAC disponible</div>
              }
            </div>
          </div>
        </div>

        {/* Right column — sensors grid */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Capteurs environnementaux ({sensors.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {sensors.map(s => <SensorCard key={s.id} sensor={s} />)}
          </div>

          {/* Smoke / Water status */}
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            {[
              { label: 'Détection fumée', active: summary?.smokeAlert, icon: '🔥' },
              { label: 'Détection fuite eau', active: summary?.waterAlert, icon: '💧' },
            ].map(({ label, active, icon }) => (
              <div key={label} className="card glass-panel" style={{ flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: active ? '1px solid #ef4444' : '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#ef4444' : '#10b981' }}>
                    {active ? '⚠ ALARME ACTIVE' : '✓ Aucune alarme'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ASHRAE reference table */}
          <div className="card glass-panel" style={{ marginTop: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Référentiel ASHRAE TC9.9
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Classe</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Temp. entrée (°C)</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Humidité (%)</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Statut actuel</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cls: 'A1', temp: '15 – 20', hum: '20 – 80', match: summary?.avgTempC >= 15 && summary?.avgTempC <= 20 },
                  { cls: 'A2', temp: '10 – 35', hum: '8 – 80',  match: summary?.avgTempC >= 10 && summary?.avgTempC <= 35 },
                  { cls: 'A3', temp: '5 – 40',  hum: '8 – 85',  match: summary?.avgTempC >= 5  && summary?.avgTempC <= 40 },
                  { cls: 'A4', temp: '5 – 45',  hum: '8 – 90',  match: summary?.avgTempC >= 5  && summary?.avgTempC <= 45 },
                ].map(row => (
                  <tr key={row.cls} style={{ background: row.match ? 'rgba(16,185,129,0.07)' : 'transparent' }}>
                    <td style={{ padding: '5px 8px', color: row.match ? '#10b981' : 'var(--text-muted)', fontWeight: row.match ? 700 : 400 }}>{row.cls}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)' }}>{row.temp}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)' }}>{row.hum}</td>
                    <td style={{ padding: '5px 8px' }}>
                      {row.match && <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700 }}>✓ ACTUELLE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
