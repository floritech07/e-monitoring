import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Server, Monitor, Cpu, MemoryStick, CheckCircle,
  AlertTriangle, RefreshCw, ChevronRight, Zap, TrendingUp
} from 'lucide-react';
import { api } from '../api';

function CapacityBar({ used, total, unit = '', color = '#4f8ef7', height = 10 }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const col = pct > 85 ? '#f5534b' : pct > 70 ? '#f5a623' : color;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>{used}{unit} utilisé</span>
        <span style={{ fontWeight: 700, color: col }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ background: 'var(--bg-hover)', borderRadius: 4, height, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, background: `linear-gradient(90deg, ${col}aa, ${col})`,
          height: '100%', borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>0 {unit}</span>
        <span>Capacité : {total} {unit}</span>
      </div>
    </div>
  );
}

function HostCard({ host, onClick }) {
  const cpuPct = host.cpu.totalCores > 0 ? Math.round((host.cpu.usedCores / host.cpu.totalCores) * 100) : 0;
  const ramPct = host.ram.totalGB > 0 ? Math.round((host.ram.usedGB / host.ram.totalGB) * 100) : 0;
  const worstPct = Math.max(cpuPct, ramPct);
  const statusColor = host.status === 'online'
    ? (worstPct > 85 ? '#f5a623' : '#22d3a3')
    : '#f5534b';

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: 18, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        borderLeft: `3px solid ${statusColor}`,
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: `${statusColor}18`, borderRadius: 8, padding: 8 }}>
            <Server size={18} color={statusColor} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{host.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{host.ip}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: `${statusColor}18`, color: statusColor,
          }}>
            {host.status === 'online' ? '● EN LIGNE' : '○ HORS LIGNE'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <Monitor size={11} /> {host.vmCount} VM{host.vmCount > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Cpu size={11} /> CPU
            </span>
            <span style={{ fontWeight: 700, color: cpuPct > 85 ? '#f5534b' : 'var(--text-primary)' }}>
              {host.cpu.usedCores}/{host.cpu.totalCores} cores
            </span>
          </div>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
            <div style={{
              width: `${cpuPct}%`,
              background: cpuPct > 85 ? '#f5534b' : cpuPct > 70 ? '#f5a623' : '#4f8ef7',
              height: '100%', borderRadius: 3,
            }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <MemoryStick size={11} /> RAM
            </span>
            <span style={{ fontWeight: 700, color: ramPct > 85 ? '#f5534b' : 'var(--text-primary)' }}>
              {host.ram.usedGB}/{host.ram.totalGB} GB
            </span>
          </div>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
            <div style={{
              width: `${ramPct}%`,
              background: ramPct > 85 ? '#f5534b' : ramPct > 70 ? '#f5a623' : '#c45ef7',
              height: '100%', borderRadius: 3,
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
          Détails <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}

export default function ClusterView() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [cls, hs] = await Promise.all([api.getClusters(), api.getEsxiHosts()]);
      setClusters(cls);
      setHosts(hs);
      if (!selectedCluster && cls.length > 0) setSelectedCluster(cls[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const cluster = clusters.find(c => c.id === selectedCluster);
  const clusterHosts = cluster ? hosts.filter(h => cluster.hosts.includes(h.id)) : hosts;

  // Top consumers across all cluster hosts
  const allVMsApprox = clusterHosts.map(h => ({
    name: h.name,
    cpuPct: h.cpu.totalCores > 0 ? Math.round((h.cpu.usedCores / h.cpu.totalCores) * 100) : 0,
    ramPct: h.ram.totalGB > 0 ? Math.round((h.ram.usedGB / h.ram.totalGB) * 100) : 0,
  }));

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Layers size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div>Chargement des clusters…</div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={22} color="var(--accent)" /> Clusters & Pools de ressources
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Vue consolidée style Huawei FusionSphere DCS
          </div>
        </div>
        <button onClick={load}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* Cluster selector tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <button
          onClick={() => setSelectedCluster(null)}
          style={{
            background: 'none', border: 'none', padding: '9px 18px', cursor: 'pointer', fontSize: 13,
            color: !selectedCluster ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: !selectedCluster ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: !selectedCluster ? 700 : 400,
          }}>
          Tous les hôtes
        </button>
        {clusters.map(c => (
          <button key={c.id} onClick={() => setSelectedCluster(c.id)}
            style={{
              background: 'none', border: 'none', padding: '9px 18px', cursor: 'pointer', fontSize: 13,
              color: selectedCluster === c.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: selectedCluster === c.id ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: selectedCluster === c.id ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'online' ? '#22d3a3' : '#f5534b', display: 'inline-block' }} />
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left: cluster summary + host grid */}
        <div>
          {/* Cluster resource bars */}
          {cluster && (
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{cluster.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {cluster.datacenter} · {cluster.hosts.length} hôte{cluster.hosts.length > 1 ? 's' : ''} · {cluster.vmCount} VMs
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {cluster.haEnabled && (
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(34,211,163,0.12)', color: '#22d3a3', border: '1px solid rgba(34,211,163,0.3)' }}>
                      HA Activé
                    </span>
                  )}
                  {cluster.drsEnabled && (
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(79,142,247,0.12)', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.3)' }}>
                      DRS Activé
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Cpu size={15} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Capacité CPU</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {cluster.cpu.totalCores} cores · {(cluster.cpu.totalMhz / 1000).toFixed(0)} GHz
                    </span>
                  </div>
                  <CapacityBar
                    used={cluster.cpu.usedCores}
                    total={cluster.cpu.totalCores}
                    unit=" cores"
                    color="var(--accent)"
                    height={12}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <MemoryStick size={15} color="#c45ef7" />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Capacité RAM</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {cluster.ram.totalGB} GB total
                    </span>
                  </div>
                  <CapacityBar
                    used={cluster.ram.usedGB}
                    total={cluster.ram.totalGB}
                    unit=" GB"
                    color="#c45ef7"
                    height={12}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Host grid */}
          <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hôtes ({clusterHosts.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {clusterHosts.map(host => (
              <HostCard
                key={host.id}
                host={host}
                onClick={() => navigate(`/infrastructure/esxi/${host.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Right: stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Global summary */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="var(--accent)" /> Synthèse globale
            </div>
            {[
              { label: 'Hôtes actifs', value: hosts.filter(h => h.status === 'online').length, total: hosts.length, color: '#22d3a3' },
              { label: 'VMs totales', value: hosts.reduce((s, h) => s + h.vmCount, 0), color: 'var(--accent)' },
              { label: 'Clusters', value: clusters.length, color: '#c45ef7' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>
                  {s.value}{s.total !== undefined ? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/{s.total}</span> : ''}
                </span>
              </div>
            ))}
          </div>

          {/* CPU pressure per host */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} color="var(--accent)" /> Pression CPU par hôte
            </div>
            {clusterHosts.map(h => {
              const pct = h.cpu.totalCores > 0 ? Math.round((h.cpu.usedCores / h.cpu.totalCores) * 100) : 0;
              const col = pct > 85 ? '#f5534b' : pct > 70 ? '#f5a623' : '#4f8ef7';
              return (
                <div key={h.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{h.name}</span>
                    <span style={{ fontWeight: 700, color: col }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 5 }}>
                    <div style={{ width: `${pct}%`, background: col, height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* RAM pressure per host */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MemoryStick size={14} color="#c45ef7" /> Pression RAM par hôte
            </div>
            {clusterHosts.map(h => {
              const pct = h.ram.totalGB > 0 ? Math.round((h.ram.usedGB / h.ram.totalGB) * 100) : 0;
              const col = pct > 85 ? '#f5534b' : pct > 70 ? '#f5a623' : '#c45ef7';
              return (
                <div key={h.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{h.name}</span>
                    <span style={{ fontWeight: 700, color: col }}>{h.ram.usedGB}/{h.ram.totalGB} GB</span>
                  </div>
                  <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 5 }}>
                    <div style={{ width: `${pct}%`, background: col, height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
