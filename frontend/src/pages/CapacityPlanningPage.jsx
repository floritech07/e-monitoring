import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  TrendingUp, RefreshCw, AlertTriangle, CheckCircle,
  Cpu, HardDrive, Activity, Database,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

// Simple linear regression: returns { slope, intercept, predict(x) }
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, predict: x => points[0]?.y || 0 };
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: x => Math.max(0, Math.min(100, slope * x + intercept)) };
}

// Build historical + forecast series from a metric name
function buildForecast(history, metricKey, horizonDays = 90) {
  if (!history?.length) return { series: [], saturationDay: null };

  const dataPoints = history.map((h, i) => ({ x: i, y: h[metricKey] ?? 0 }));
  const reg = linearRegression(dataPoints);

  const today = new Date();
  const series = [];

  // Historical (last 30 days)
  history.forEach((h, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (history.length - 1 - i));
    series.push({
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      actual: +(h[metricKey] ?? 0).toFixed(1),
      forecast: null,
    });
  });

  // Forecast
  for (let d = 1; d <= horizonDays; d++) {
    const futDate = new Date(today);
    futDate.setDate(today.getDate() + d);
    const x = history.length + d - 1;
    if (d % 5 === 0 || d === 1 || d === 30 || d === 60 || d === 90) {
      series.push({
        date: futDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        actual: null,
        forecast: +reg.predict(x).toFixed(1),
      });
    }
  }

  // Day until 90% saturation
  let saturationDay = null;
  for (let d = 1; d <= 365; d++) {
    if (reg.predict(history.length + d - 1) >= 90) { saturationDay = d; break; }
  }

  return { series, saturationDay, slope: reg.slope };
}

const METRIC_CFG = [
  { key: 'cpuPct',        label: 'CPU',          icon: <Cpu size={16} />,      color: '#4F8EF7', unit: '%' },
  { key: 'ramPct',        label: 'RAM',          icon: <Activity size={16} />,  color: '#A855F7', unit: '%' },
  { key: 'storagePct',    label: 'Stockage',     icon: <HardDrive size={16} />, color: '#F59E0B', unit: '%' },
  { key: 'dataTransferGB',label: 'Transferts',   icon: <Database size={16} />,  color: '#10B981', unit: ' GB/j' },
];

function SaturationBadge({ days }) {
  if (days === null) return (
    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: '#10B98120', color: '#10B981', fontWeight: 600 }}>
      &gt;1 an
    </span>
  );
  const color = days < 30 ? '#EA580C' : days < 90 ? '#F59E0B' : '#10B981';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: `${color}20`, color, fontWeight: 600 }}>
      {days < 30 ? '⚠ ' : ''}{days} j
    </span>
  );
}

function MetricCard({ cfg, forecast, slope }) {
  const trend = slope > 0.3 ? 'hausse rapide' : slope > 0.05 ? 'légère hausse' : slope < -0.05 ? 'baisse' : 'stable';
  const trendColor = slope > 0.3 ? '#EA580C' : slope > 0.05 ? '#F59E0B' : '#10B981';

  return (
    <div className="card glass-panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{cfg.label}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <SaturationBadge days={forecast.saturationDay} />
          <span style={{ fontSize: 10, color: trendColor }}>{trend}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={forecast.series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 9 }} interval={Math.ceil(forecast.series.length / 6)} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 9 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: '#1a2332', border: '1px solid #2a4060', borderRadius: 6, fontSize: 11 }}
            formatter={(v, name) => [v != null ? `${v}${cfg.unit}` : '—', name === 'actual' ? 'Historique' : 'Prévision']}
          />
          <Area type="monotone" dataKey="actual" stroke={cfg.color} fill={`${cfg.color}25`}
            strokeWidth={2} dot={false} connectNulls={false} name="actual" />
          <Area type="monotone" dataKey="forecast" stroke={cfg.color} fill={`${cfg.color}10`}
            strokeWidth={1.5} strokeDasharray="5,3" dot={false} connectNulls={false} name="forecast" />
          <ReferenceLine y={90} stroke="#EA580C" strokeDasharray="4,3" strokeWidth={1}
            label={{ value: '90%', fill: '#EA580C', fontSize: 9, position: 'right' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CapacityPlanningPage() {
  const [history,  setHistory]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [horizon,  setHorizon]  = useState(90);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCapacityHistory();
      setHistory(data);
    } catch {
      // Fallback: generate plausible synthetic history
      const synthetic = Array.from({ length: 30 }, (_, i) => ({
        cpuPct:         Math.min(100, 32 + i * 0.8 + (Math.random() - 0.5) * 6),
        ramPct:         Math.min(100, 48 + i * 1.0 + (Math.random() - 0.5) * 5),
        storagePct:     Math.min(100, 51 + i * 0.5 + (Math.random() - 0.5) * 3),
        dataTransferGB: Math.max(0,  120 + i * 2.5 + (Math.random() - 0.5) * 25),
      }));
      setHistory({ points: synthetic, source: 'simulation' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const forecasts = METRIC_CFG.map(cfg => {
    const f = buildForecast(history?.points || [], cfg.key, horizon);
    return { cfg, ...f };
  });

  // Global saturation risk
  const minSat = forecasts.reduce((min, f) => {
    if (f.saturationDay === null) return min;
    return min === null ? f.saturationDay : Math.min(min, f.saturationDay);
  }, null);

  const riskLevel = minSat === null ? 'ok' : minSat < 30 ? 'critical' : minSat < 90 ? 'warning' : 'ok';
  const riskColor = { ok: '#10B981', warning: '#F59E0B', critical: '#EA580C' }[riskLevel];
  const riskText  = { ok: 'Capacité suffisante', warning: 'Attention : saturation proche', critical: 'ALERTE : saturation imminente' }[riskLevel];

  return (
    <div className="fade-in" style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} style={{ color: 'var(--accent)' }} />
            Capacity Planning
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Projections linéaires 30 / 60 / 90 jours — seuil de saturation à 90%
            {history?.source === 'simulation' && (
              <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 6, fontSize: 10,
                background: '#F59E0B20', color: '#F59E0B' }}>SIMULATION</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[30, 60, 90].map(h => (
              <button key={h}
                className={`btn btn-sm ${horizon === h ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setHorizon(h)}>
                {h}j
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Global risk banner */}
      <div style={{
        padding: '12px 20px', borderRadius: 8, marginBottom: 20,
        background: `${riskColor}12`, border: `1px solid ${riskColor}40`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {riskLevel === 'ok'
          ? <CheckCircle size={20} style={{ color: riskColor, flexShrink: 0 }} />
          : <AlertTriangle size={20} style={{ color: riskColor, flexShrink: 0 }} />}
        <div>
          <div style={{ fontWeight: 700, color: riskColor }}>{riskText}</div>
          {minSat !== null && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              La première ressource atteindra 90% dans <strong style={{ color: riskColor }}>{minSat} jour{minSat > 1 ? 's' : ''}</strong>.
              {minSat < 90 && ' Il est recommandé d\'augmenter la capacité ou d\'optimiser l\'utilisation.'}
            </div>
          )}
          {minSat === null && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Aucune ressource ne devrait atteindre 90% dans les 12 prochains mois selon la tendance actuelle.
            </div>
          )}
        </div>
      </div>

      {/* Projections summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {forecasts.map(f => {
          const lastActual = f.series.filter(s => s.actual != null).at(-1)?.actual ?? 0;
          const day30  = f.series.find(s => s.forecast != null && f.series.indexOf(s) >= (f.series.filter(s2=>s2.actual!=null).length))?.forecast ?? lastActual;
          return (
            <div key={f.cfg.key} className="card glass-panel" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: f.cfg.color }}>{f.cfg.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{f.cfg.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: f.cfg.color }}>
                {lastActual.toFixed(1)}{f.cfg.unit}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                actuellement
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Satur. dans :</span>
                <SaturationBadge days={f.saturationDay} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
          Chargement des données historiques…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {forecasts.map(f => (
            <MetricCard key={f.cfg.key} cfg={f.cfg} forecast={f} slope={f.slope || 0} />
          ))}
        </div>
      )}

      {/* Recommendations */}
      {!loading && (
        <div className="card glass-panel" style={{ padding: 20, marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            Recommandations automatiques
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {forecasts.filter(f => f.saturationDay !== null && f.saturationDay < 180).map(f => (
              <div key={f.cfg.key} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                borderRadius: 6, background: 'var(--bg-base)',
                borderLeft: `3px solid ${f.saturationDay < 30 ? '#EA580C' : '#F59E0B'}`,
              }}>
                <AlertTriangle size={14} style={{ color: f.saturationDay < 30 ? '#EA580C' : '#F59E0B', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    {f.cfg.label} — saturation dans {f.saturationDay} j
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {f.cfg.key === 'cpuPct' && 'Envisager l\'ajout de nœuds ESXi ou l\'optimisation des VMs les plus consommatrices.'}
                    {f.cfg.key === 'ramPct' && 'Augmenter la RAM physique ou identifier les VMs sur-provisionnées.'}
                    {f.cfg.key === 'storagePct' && 'Archiver les snapshots anciens, ajouter des disques ou étendre le SAN.'}
                    {f.cfg.key === 'dataTransferGB' && 'Vérifier la bande passante disponible et envisager une mise à niveau du lien WAN.'}
                  </div>
                </div>
              </div>
            ))}
            {forecasts.every(f => f.saturationDay === null || f.saturationDay >= 180) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10B981', fontSize: 12 }}>
                <CheckCircle size={16} />
                Aucune action requise — toutes les ressources sont dans des limites acceptables pour les 6 prochains mois.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
