import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  Archive, RefreshCw, Lock, Unlock, Shield, AlertTriangle, CheckCircle,
  Database, Clock, HardDrive, Download, Server,
} from 'lucide-react';

const GFS_COLOR = {
  daily:   { bg: '#1e3a2f', border: '#10B981', label: 'Journalier', icon: '📅' },
  weekly:  { bg: '#1a2e3e', border: '#4F8EF7', label: 'Hebdomadaire', icon: '📆' },
  monthly: { bg: '#2a1f3e', border: '#A855F7', label: 'Mensuel',     icon: '🗓' },
  yearly:  { bg: '#3a1f1f', border: '#EA580C', label: 'Annuel',      icon: '📋' },
};

function RestorePointRow({ point }) {
  const gfsCfg = GFS_COLOR[point.gfsType] || null;

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: 12 }}>
      <td style={{ padding: '7px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {new Date(point.timestamp).toLocaleString('fr-FR')}
      </td>
      <td style={{ padding: '7px 12px' }}>
        <span style={{ fontSize: 11 }}>{point.jobName}</span>
      </td>
      <td style={{ padding: '7px 12px' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{point.type}</span>
      </td>
      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>
        {point.sizeGB.toFixed(1)} GB
      </td>
      <td style={{ padding: '7px 12px' }}>
        {gfsCfg ? (
          <span style={{
            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
            background: gfsCfg.bg, border: `1px solid ${gfsCfg.border}`, color: gfsCfg.border,
          }}>
            {gfsCfg.icon} {gfsCfg.label}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>
        )}
      </td>
      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
        {point.immutable ? (
          <span title={`Immuable jusqu'au ${new Date(point.immutableUntil).toLocaleDateString('fr-FR')}`}
            style={{ color: '#A855F7', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <Lock size={12} /> <span style={{ fontSize: 10 }}>Verrouillé</span>
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}><Unlock size={12} /></span>
        )}
      </td>
      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
        <span style={{
          padding: '2px 6px', borderRadius: 8, fontSize: 10,
          background: point.status === 'OK' ? '#10B98120' : '#EA580C20',
          color: point.status === 'OK' ? '#10B981' : '#EA580C',
        }}>{point.status}</span>
      </td>
    </tr>
  );
}

function UnprotectedVMCard({ vm }) {
  const daysAgo = vm.lastBackupDays;
  const color = daysAgo > 30 ? '#EA580C' : daysAgo > 7 ? '#F59E0B' : '#6B7280';
  return (
    <div className="card glass-panel" style={{ padding: '12px 16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{vm.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {vm.host} · {vm.os}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color, fontSize: 14 }}>{daysAgo}j</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>sans backup</div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 10 }}>
        <span style={{ color: 'var(--text-muted)' }}>Stockage: {vm.diskGB} GB</span>
        <span style={{ color: 'var(--text-muted)' }}>vCPU: {vm.vcpu}</span>
        <span style={{ color: 'var(--text-muted)' }}>RAM: {vm.ramGB} GB</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={{
          padding: '2px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600,
          background: `${color}20`, color,
        }}>
          {daysAgo > 30 ? '⚠ Critique — aucun backup récent' : '⚠ RPO dépassé'}
        </span>
      </div>
    </div>
  );
}

// State will hold these
const UNPROTECTED_VMS = [];

export default function GFSDetailPage() {
  const [gfsData,  setGfsData]  = useState(null);
  const [unprot,   setUnprot]   = useState([]);
  const [objStore, setObjStore] = useState(null);
  const [surebck,  setSurebck]  = useState([]);
  const [repl,     setRepl]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('restorePoints');
  const [jobFlt,   setJobFlt]   = useState('ALL');
  const [typeFlt,  setTypeFlt]  = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gfs, u, o, s, r] = await Promise.all([
        api.getVeeamGFS().catch(() => null),
        api.getVeeamUnprotected().catch(() => []),
        api.getVeeamObjectStorage().catch(() => null),
        api.getVeeamSureBackup().catch(() => []),
        api.getVeeamReplication().catch(() => [])
      ]);
      setGfsData(gfs);
      setUnprot(u);
      setObjStore(o);
      setSurebck(s);
      setRepl(r);
    } catch {
      setGfsData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const points = gfsData?.restorePoints || [];
  const jobs   = [...new Set(points.map(p => p.jobName))];

  const filtered = points.filter(p => {
    if (jobFlt !== 'ALL' && p.jobName !== jobFlt) return false;
    if (typeFlt !== 'ALL' && p.gfsType !== typeFlt) return false;
    return true;
  });

  const immutableCount = points.filter(p => p.immutable).length;
  const totalGB = points.reduce((s, p) => s + p.sizeGB, 0);

  return (
    <div className="fade-in" style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Archive size={22} style={{ color: 'var(--accent)' }} />
            Sauvegarde — GFS & Immutabilité
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Grandfather-Father-Son · Points de restauration · Air-gap · VMs non protégées
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={13} /></button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Points de restauration', value: points.length, color: 'var(--accent)', icon: <Database size={14} /> },
          { label: 'Points immuables', value: immutableCount, color: '#A855F7', icon: <Lock size={14} /> },
          { label: 'Stockage total', value: `${totalGB.toFixed(0)} GB`, color: '#F59E0B', icon: <HardDrive size={14} /> },
          { label: 'VMs non protégées', value: unprot.length, color: '#EA580C', icon: <AlertTriangle size={14} /> },
          { label: 'Jobs configurés', value: jobs.length, color: '#10B981', icon: <CheckCircle size={14} /> },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ color: k.color }}>{k.icon}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Politiques GFS */}
      {gfsData?.policies?.length > 0 && (
        <div className="card glass-panel" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            Politiques GFS configurées
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {gfsData.policies.map(p => (
              <div key={p.jobName} style={{ background: 'var(--bg-base)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>{p.jobName}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { key: 'daily',   label: 'J',  value: p.daily },
                    { key: 'weekly',  label: 'H',  value: p.weekly },
                    { key: 'monthly', label: 'M',  value: p.monthly },
                    { key: 'yearly',  label: 'A',  value: p.yearly },
                  ].map(g => g.value > 0 && (
                    <span key={g.key} style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: GFS_COLOR[g.key]?.bg || 'var(--bg-surface)',
                      border: `1px solid ${GFS_COLOR[g.key]?.border || '#6B7280'}`,
                      color: GFS_COLOR[g.key]?.border || '#6B7280',
                    }}>
                      {g.value}×{g.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'restorePoints', label: 'Points de restauration' },
          { key: 'unprotected',   label: `VMs non protégées (${unprot.length})` },
          { key: 'objectStorage', label: 'Object Storage (S3/Azure)' },
          { key: 'surebackup',    label: 'SureBackup' },
          { key: 'replication',   label: 'Réplication VM' },
        ].map(t => (
          <button key={t.key}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      {tab === 'restorePoints' && (
        <div className="card glass-panel" style={{ overflow: 'hidden' }}>
          {/* Filtres */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={jobFlt} onChange={e => setJobFlt(e.target.value)}
              style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-primary)', fontSize: 11 }}>
              <option value="ALL">Tous les jobs</option>
              {jobs.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <select value={typeFlt} onChange={e => setTypeFlt(e.target.value)}
              style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-primary)', fontSize: 11 }}>
              <option value="ALL">Tous types GFS</option>
              <option value="daily">Journalier</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
              {filtered.length} point{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                  {['Date/Heure', 'Job', 'Type', 'Taille', 'GFS', 'Immuable', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                      color: 'var(--text-muted)', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Chargement…
                  </td></tr>
                ) : filtered.map((p, i) => <RestorePointRow key={i} point={p} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'unprotected' && (
        <div>
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#EA580C15',
            border: '1px solid #EA580C30', borderRadius: 6, fontSize: 12, color: '#EA580C' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
            {unprot.length} VM{unprot.length > 1 ? 's' : ''} non sauvegardée{unprot.length > 1 ? 's' : ''} selon la politique RPO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {unprot.map((vm, i) => <UnprotectedVMCard key={i} vm={vm} />)}
          </div>
        </div>
      )}

      {tab === 'objectStorage' && (
        <div className="card glass-panel" style={{ padding: 24, textAlign: 'center' }}>
          <Database size={32} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Object Storage — S3 / Azure Blob</div>
          {objStore?.configured ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
                {objStore.repositories.map(r => (
                  <div key={r.name} style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Type : {r.type}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span>Utilisé</span><span>{r.usedGB} / {r.capacityGB} GB</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-base)', borderRadius: 3, marginBottom: 8 }}>
                      <div style={{ width: `${(r.usedGB/r.capacityGB)*100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: r.immutability ? '#A855F7' : 'var(--text-muted)' }}>
                      {r.immutability ? <><Lock size={10} style={{marginRight: 4}}/>Immutabilité activée</> : <><Unlock size={10} style={{marginRight: 4}}/>Pas d'immutabilité</>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 500, margin: '0 auto' }}>
                Aucun repository Object Storage configuré. Connecter un bucket S3 ou Azure Blob via la configuration Veeam B&R pour activer l'archivage hors-site et l'immutabilité WORM (S3 Object Lock).
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}
                onClick={() => {}}>
                + Configurer Object Storage
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'surebackup' && (
        <div className="card glass-panel" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>SureBackup — Tests de restaurabilité automatiques</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {surebck.map((sb, i) => (
              <div key={i} className="card glass-panel" style={{ padding: '12px 16px',
                borderLeft: `3px solid ${sb.result === 'Success' ? '#10B981' : '#F59E0B'}` }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{sb.job}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Dernière exécution: {sb.lastRun}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: sb.result === 'Success' ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                    {sb.result === 'Success' ? '✓ ' : '⚠ '}{sb.result}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{sb.duration}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{sb.vms} VMs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'replication' && (
        <div className="card glass-panel" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Réplication VM — Lag & État</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                {['VM Source', 'Hôte source', 'VM Réplique', 'Hôte cible', 'Lag RPO', 'Dernier sync', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repl.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{r.src}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{r.srcHost}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{r.rep}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{r.dstHost}</td>
                  <td style={{ padding: '8px 12px', color: r.lagMin > 15 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                    {r.lagMin} min
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{r.lastSync}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      background: r.ok ? '#10B98120' : '#F59E0B20', color: r.ok ? '#10B981' : '#F59E0B' }}>
                      {r.ok ? '✓ OK' : '⚠ Lag élevé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
