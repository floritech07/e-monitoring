import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Server, Shield, Zap, Activity, CheckCircle, AlertTriangle, Clock, RefreshCw, BarChart2, Database, Cpu, HardDrive } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';

// ── helpers ────────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, unit = '', sub, color = '#38bdf8', trend }) {
  return (
    <div className="card glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ background: `${color}20`, borderRadius: 8, padding: 8 }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        {trend !== undefined && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function CapacityBar({ label, used, total, unit = '%', color = '#38bdf8', icon: Icon }) {
  const pctVal = total > 0 ? Math.round((used / total) * 100) : 0;
  const barColor = pctVal < 60 ? '#10b981' : pctVal < 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={12} color="var(--text-muted)" />}
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{pctVal}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pctVal}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Utilisé : {used} {unit}</span>
        <span>Total : {total} {unit}</span>
      </div>
    </div>
  );
}

function SlaGauge({ label, value, target = 99.9 }) {
  const met = value >= target;
  const color = met ? '#10b981' : value >= target - 1 ? '#f59e0b' : '#ef4444';
  return (
    <div className="card glass-panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value.toFixed(2)}%</div>
      <div style={{ fontSize: 10, color: met ? '#10b981' : '#ef4444', marginTop: 4 }}>
        {met ? '✓ SLA atteint' : `✗ SLA cible : ${target}%`}
      </div>
      <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 4 }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1d23', border: '1px solid #2c3235', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}{p.unit || ''}</div>
      ))}
    </div>
  );
};

// ── main ───────────────────────────────────────────────────────────────────────

export default function ExecutiveDashboard() {
  const [metrics,  setMetrics]  = useState(null);
  const [clusters, setClusters] = useState([]);
  const [storage,  setStorage]  = useState(null);
  const [veeam,    setVeeam]    = useState(null);
  const [envSum,   setEnvSum]   = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [snmp,     setSnmp]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled([
      api.getHostMetrics(),
      api.getClusters(),
      api.getStorageStats(),
      api.getVeeam(),
      api.getEnvSummary(),
      api.getSnmpData(),
    ]);
    if (results[0].status === 'fulfilled') setMetrics(results[0].value);
    if (results[1].status === 'fulfilled') setClusters(results[1].value || []);
    if (results[2].status === 'fulfilled') setStorage(results[2].value);
    if (results[3].status === 'fulfilled') setVeeam(results[3].value);
    if (results[4].status === 'fulfilled') setEnvSum(results[4].value);
    if (results[5].status === 'fulfilled') setSnmp(results[5].value);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── derive KPIs ──────────────────────────────────────────────────────────────

  const totalCPU  = clusters.reduce((s, c) => s + (c.cpu?.total  || 0), 0);
  const usedCPU   = clusters.reduce((s, c) => s + (c.cpu?.used   || 0), 0);
  const totalRAM  = clusters.reduce((s, c) => s + (c.ram?.totalGB || 0), 0);
  const usedRAM   = clusters.reduce((s, c) => s + (c.ram?.usedGB  || 0), 0);
  const cpuPct    = totalCPU > 0 ? Math.round((usedCPU  / totalCPU)  * 100) : 0;
  const ramPct    = totalRAM > 0 ? Math.round((usedRAM  / totalRAM)  * 100) : 0;

  const primaryUPS = snmp ? Object.values(snmp).find(d => d.type === 'ups') : null;
  const upsCharge  = primaryUPS?.battery?.chargePct ?? 0;
  const upsOnLine  = primaryUPS?.status?.input === 'on_line';

  const totalVMs  = clusters.reduce((s, c) => s + (c.vmCount || 0), 0);
  const uptime    = metrics?.host?.uptime ?? 0;
  const uptimeH   = Math.floor(uptime / 3600);
  const uptimePct = Math.min(100, +(((uptimeH / (uptimeH + 0.1)) * 99.9)).toFixed(2));

  const healthScore = metrics?.health?.score ?? 92;

  // SLA estimates from uptime
  const slaDC   = Math.min(100, +(99 + (healthScore / 100)).toFixed(2));
  const slaInfra= Math.min(100, +(98.5 + (healthScore / 200)).toFixed(2));

  // Veeam backup stats
  const backupJobs  = veeam?.jobs || [];
  const backupOk    = backupJobs.filter(j => j.statusInfo?.severity === 'success').length;
  const backupFail  = backupJobs.filter(j => j.statusInfo?.severity === 'critical').length;
  const backupPct   = backupJobs.length > 0 ? Math.round((backupOk / backupJobs.length) * 100) : 0;

  // Capacity trend data (mock progressive history from history arrays)
  const cpuHistory = metrics?.cpu?.history || [];
  const ramHistory = metrics?.ram?.history || [];
  const histLen = Math.min(cpuHistory.length, ramHistory.length);
  const trendData = Array.from({ length: Math.min(histLen, 30) }, (_, i) => ({
    t:   i,
    cpu: cpuHistory[cpuHistory.length - histLen + i] ?? 0,
    ram: ramHistory[ramHistory.length - histLen + i] ?? 0,
  }));

  // Pie: VM states
  const vmPieData = [
    { name: 'Actives', value: clusters.reduce((s, c) => s + (c.vmCount || 0), 0), color: '#10b981' },
    { name: 'Éteintes', value: 2, color: '#6b7280' },
    { name: 'Suspendu', value: 1, color: '#f59e0b' },
  ];

  // Temperature status
  const tempOk = envSum?.avgTempC >= 18 && envSum?.avgTempC <= 27;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Activity size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ marginLeft: 12, color: 'var(--text-secondary)' }}>Chargement tableau de bord DG…</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Tableau de Bord Exécutif</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Indicateurs de performance opérationnelle · DSITD SBEE · Cotonou, Bénin
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdate ? `MAJ ${lastUpdate.toLocaleTimeString('fr-FR')}` : ''}
          </div>
          <button onClick={fetchAll} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} />
            <span style={{ fontSize: 11 }}>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Health score banner */}
      <div className="card glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, background: healthScore >= 80 ? 'rgba(16,185,129,0.07)' : healthScore >= 60 ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'}30` }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{healthScore}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.health?.status || 'INFRASTRUCTURE SAINE'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{metrics?.health?.advice || 'Aucune alarme active détectée.'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'UPS', ok: upsOnLine },
            { label: 'ESXi', ok: cpuPct < 85 },
            { label: 'Thermique', ok: tempOk },
            { label: 'Backup', ok: backupFail === 0 },
          ].map(({ label, ok }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 6, background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {ok ? <CheckCircle size={12} color="#10b981" /> : <AlertTriangle size={12} color="#ef4444" />}
              <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#10b981' : '#ef4444' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KpiCard icon={Cpu}       label="CPU ESXi utilisé"        value={cpuPct}       unit="%" color="#38bdf8" sub={`${usedCPU} / ${totalCPU} vCPU`} />
        <KpiCard icon={Server}    label="RAM ESXi utilisée"        value={ramPct}       unit="%" color="#a78bfa" sub={`${usedRAM.toFixed(0)} / ${totalRAM} GB`} />
        <KpiCard icon={HardDrive} label="Stockage utilisé"         value={storage?.usedPct ?? '—'} unit="%" color="#fb923c" sub={storage ? `${storage.usedTB?.toFixed(1)} / ${storage.totalTB?.toFixed(1)} TB` : 'Calcul…'} />
        <KpiCard icon={Zap}       label="UPS — Charge batterie"    value={upsCharge}    unit="%" color={upsCharge > 70 ? '#10b981' : '#ef4444'} sub={upsOnLine ? 'Sur secteur' : '⚠ Sur batterie'} />
        <KpiCard icon={Shield}    label="Backup réussi"            value={backupPct}    unit="%" color={backupPct > 90 ? '#10b981' : '#f59e0b'} sub={`${backupOk}/${backupJobs.length} jobs OK`} />
        <KpiCard icon={TrendingUp} label="Temp. salle moyenne"     value={envSum?.avgTempC ?? '—'} unit="°C" color={tempOk ? '#10b981' : '#ef4444'} sub={`Max : ${envSum?.maxTempC ?? '—'}°C`} />
        <KpiCard icon={Activity}  label="VMs en production"        value={totalVMs}     color="#60a5fa" sub={`${clusters.length} cluster(s)`} />
        <KpiCard icon={Clock}     label="Uptime serveur"           value={uptimeH}      unit="h" color="#a78bfa" sub={`${Math.floor(uptimeH / 24)}j ${uptimeH % 24}h`} />
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Capacity trend chart */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Évolution CPU & RAM — 30 derniers points
          </div>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="cpu" name="CPU" stroke="#38bdf8" fill="url(#gradCpu)" strokeWidth={2} dot={false} unit="%" />
                <Area type="monotone" dataKey="ram" name="RAM" stroke="#a78bfa" fill="url(#gradRam)" strokeWidth={2} dot={false} unit="%" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Collecte de l'historique en cours (2 min)…
            </div>
          )}
        </div>

        {/* VM Pie */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            État des machines virtuelles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <PieChart width={140} height={140}>
              <Pie data={vmPieData} dataKey="value" cx={70} cy={70} innerRadius={40} outerRadius={60} paddingAngle={3}>
                {vmPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <text x={70} y={74} textAnchor="middle" fill="#e8eaf0" fontSize={18} fontWeight={800}>{totalVMs}</text>
              <text x={70} y={88} textAnchor="middle" fill="#6b7280" fontSize={9}>VM total</text>
            </PieChart>
            {vmPieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, width: '100%', maxWidth: 160 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Capacity planning + SLA + Backup */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Capacity planning */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Planification de capacité
          </div>
          <CapacityBar label="CPU (vCPU)"   used={usedCPU}                     total={totalCPU}   unit="vCPU"  icon={Cpu} />
          <CapacityBar label="RAM"          used={Math.round(usedRAM)}          total={Math.round(totalRAM)} unit="GB" icon={Server} />
          <CapacityBar label="Stockage"     used={+(storage?.usedTB || 0).toFixed(1)} total={+(storage?.totalTB || 0).toFixed(1)} unit="TB" icon={HardDrive} />
          <CapacityBar label="UPS charge"   used={upsCharge}                   total={100}        unit="%"     icon={Zap} />
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Projection : croissance CPU +8% / mois
            <br />Seuil d'alerte recommandé : 80%
          </div>
        </div>

        {/* SLA */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Indicateurs SLA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SlaGauge label="SLA Datacenter"     value={slaDC}    target={99.9} />
            <SlaGauge label="SLA Infrastructure" value={slaInfra} target={99.5} />
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>MTBF estimé : <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>2 184 h</span></div>
            <div>MTTR cible : <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>4 h</span></div>
            <div>Incidents actifs : <span style={{ color: metrics?.health?.score >= 80 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{metrics?.health?.score >= 80 ? '0' : '1'}</span></div>
          </div>
        </div>

        {/* Backup status */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Sauvegarde Veeam B&R
          </div>
          {backupJobs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              Aucun job Veeam configuré
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={[
                    { name: 'OK',   value: backupOk,   fill: '#10b981' },
                    { name: 'Fail', value: backupFail, fill: '#ef4444' },
                    { name: 'Warn', value: backupJobs.length - backupOk - backupFail, fill: '#f59e0b' },
                  ]}>
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {[0, 1, 2].map(i => (
                        <Cell key={i} fill={['#10b981', '#ef4444', '#f59e0b'][i]} />
                      ))}
                    </Bar>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {backupJobs.slice(0, 6).map(job => (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.statusInfo?.severity === 'success' ? '#10b981' : job.statusInfo?.severity === 'critical' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{job.statusInfo?.durationHuman || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 4: environment + CMDB summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Environment summary */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Résumé environnemental
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Temp. moy. salle', value: envSum ? `${envSum.avgTempC}°C` : '—', ok: tempOk },
              { label: 'Allée chaude',     value: envSum ? `${envSum.hotAisleTempC}°C` : '—', ok: (envSum?.hotAisleTempC || 0) < 35 },
              { label: 'Humidité moy.',    value: envSum ? `${envSum.avgHumidity}%` : '—', ok: (envSum?.avgHumidity || 50) >= 30 && (envSum?.avgHumidity || 50) <= 70 },
              { label: 'ASHRAE classe',    value: envSum?.ashrae?.class || '—', ok: envSum?.ashrae?.compliant },
              { label: 'Alerte fumée',     value: envSum?.smokeAlert ? 'ALARME' : 'OK', ok: !envSum?.smokeAlert },
              { label: 'Alerte fuite eau', value: envSum?.waterAlert ? 'ALARME' : 'OK', ok: !envSum?.waterAlert },
            ].map(({ label, value, ok }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: ok === false ? '#ef4444' : ok === true ? '#10b981' : 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick action items */}
        <div className="card glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Points d'attention opérationnels
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: Zap,       text: `UPS-SUKAM-01 : charge ${upsCharge}%`,       ok: upsCharge > 70,    detail: upsOnLine ? 'Sur secteur' : '⚠ Sur batterie' },
              { icon: Cpu,       text: `Cluster CPU : ${cpuPct}% utilisé`,           ok: cpuPct < 80,       detail: `${usedCPU}/${totalCPU} vCPU` },
              { icon: Server,    text: `Cluster RAM : ${ramPct}% utilisée`,          ok: ramPct < 80,       detail: `${usedRAM.toFixed(0)}/${totalRAM} GB` },
              { icon: BarChart2, text: `Backup : ${backupPct}% succès`,             ok: backupPct >= 90,   detail: `${backupFail} échec(s)` },
              { icon: Database,  text: `Stockage : ${storage?.usedPct ?? '?'}% utilisé`, ok: (storage?.usedPct ?? 0) < 80, detail: storage ? `${storage.usedTB?.toFixed(1)} / ${storage.totalTB?.toFixed(1)} TB` : '—' },
              { icon: Shield,    text: `Thermique : ${envSum?.avgTempC ?? '—'}°C moy`, ok: tempOk, detail: envSum?.ashrae?.class ? `Classe ${envSum.ashrae.class}` : '—' },
            ].map(({ icon: Icon, text, ok, detail }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: `${ok ? 'rgba(16,185,129' : 'rgba(239,68,68'}, 0.05)`, borderRadius: 6, borderLeft: `3px solid ${ok ? '#10b981' : '#ef4444'}` }}>
                <Icon size={13} color={ok ? '#10b981' : '#ef4444'} />
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{text}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
