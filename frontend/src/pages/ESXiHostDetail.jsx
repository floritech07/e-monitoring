import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Server, Monitor, HardDrive, Network, Play, Square, RotateCcw,
  Camera, ChevronLeft, Cpu, MemoryStick, Database, Wifi,
  AlertTriangle, CheckCircle, Clock, Search, RefreshCw,
  Activity, Layers, ArrowLeft, Shuffle, BarChart2, BookOpen,
  ShieldCheck, ArrowRightLeft, Wrench, FileText as FileDoc,
  Link, Cloud
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../api';

const TABS = [
  { id: 'vms',     label: 'Machines virtuelles', icon: Monitor },
  { id: 'perf',    label: 'Performances',         icon: Activity },
  { id: 'storage', label: 'Stockage',             icon: HardDrive },
  { id: 'network', label: 'Réseau',               icon: Network },
  { id: 'vsan',    label: 'vSAN',                 icon: Database },
  { id: 'vmotion', label: 'vMotion',              icon: Shuffle },
  { id: 'drs',     label: 'DRS / HA',             icon: BarChart2 },
  { id: 'multipathing', label: 'Multipathing',    icon: Link },
  { id: 'nsx',     label: 'NSX-T',                icon: Cloud },
  { id: 'docs',    label: 'Documentation',        icon: BookOpen },
];

const OS_ICONS = {
  'windows': '🪟',
  'ubuntu':  '🐧',
  'linux':   '🐧',
  'centos':  '🐧',
  'redhat':  '🐧',
  'pfsense': '🔒',
  'freebsd': '😈',
};

function osIcon(os = '') {
  const l = os.toLowerCase();
  for (const [key, icon] of Object.entries(OS_ICONS)) {
    if (l.includes(key)) return icon;
  }
  return '💻';
}

function fmtUptime(secs) {
  if (!secs) return '—';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  if (d > 0) return `${d}j ${h}h`;
  return `${h}h`;
}

function fmtBytes(gb) {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb} GB`;
}

function UsageBar({ value, max = 100, color = '#4f8ef7', label }) {
  const pct = Math.min(100, (value / max) * 100);
  const col = pct > 85 ? '#f5534b' : pct > 70 ? '#f5a623' : color;
  return (
    <div style={{ width: '100%' }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>}
      <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: col, height: '100%', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function StatPill({ label, value, color = 'var(--accent)' }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center', minWidth: 100,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Tab: VMs ────────────────────────────────────────────────────────────────

function VMsTab({ hostId }) {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getHostVMs(hostId);
      setVms(data);
    } catch { /* keep stale */ }
    finally { setLoading(false); }
  }, [hostId]);

  useEffect(() => { load(); }, [load]);

  async function doAction(vm, action) {
    setActioning(`${vm.id}-${action}`);
    await api.esxiVmAction(vm.id, action).catch(() => {});
    setActioning(null);
    load();
  }

  const filtered = vms.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une VM..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={load} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['VM', 'Système', 'État', 'vCPU', 'CPU Ready', 'vRAM', 'Snapshots', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(vm => (
                <tr key={vm.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Monitor size={14} style={{ color: vm.state === 'on' ? 'var(--success)' : 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{vm.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <span style={{ marginRight: 5 }}>{osIcon(vm.os)}</span>{vm.os}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: vm.state === 'on' ? 'rgba(34,211,163,0.12)' : 'rgba(245,83,75,0.12)',
                      color: vm.state === 'on' ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${vm.state === 'on' ? 'rgba(34,211,163,0.3)' : 'rgba(245,83,75,0.3)'}`,
                    }}>
                      {vm.state === 'on' ? '● ACTIF' : '○ ARRÊTÉ'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ minWidth: 36, color: 'var(--text-primary)', fontWeight: 600 }}>{vm.cpu.usage}%</span>
                      <UsageBar value={vm.cpu.usage} />
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ 
                      fontSize: 12, fontWeight: 700, 
                      color: vm.cpu.readyPct > 5 ? '#ef4444' : vm.cpu.readyPct > 2 ? '#f5a623' : '#10b981' 
                    }}>
                      {vm.cpu.readyPct}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ minWidth: 36, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {vm.state === 'on' ? `${vm.ram.usedGB}G` : '0G'}
                      </span>
                      <UsageBar value={vm.state === 'on' ? (vm.ram.usedGB / vm.ram.totalGB) * 100 : 0} color="#c45ef7" />
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: vm.snapshots > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {vm.snapshots > 0 ? <span style={{ background: 'rgba(245,166,35,0.15)', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{vm.snapshots}</span> : '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {vm.state === 'off' ? (
                        <ActionBtn icon={Play} title="Démarrer" color="var(--success)" loading={actioning === `${vm.id}-start`}
                          onClick={() => doAction(vm, 'start')} />
                      ) : (
                        <>
                          <ActionBtn icon={Square} title="Arrêter" color="var(--danger)" loading={actioning === `${vm.id}-stop`}
                            onClick={() => doAction(vm, 'stop')} />
                          <ActionBtn icon={RotateCcw} title="Redémarrer" color="var(--warning)" loading={actioning === `${vm.id}-restart`}
                            onClick={() => doAction(vm, 'restart')} />
                        </>
                      )}
                      <ActionBtn icon={Camera} title="Snapshot" color="var(--accent)" loading={actioning === `${vm.id}-snapshot`}
                        onClick={() => doAction(vm, 'snapshot')} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune VM trouvée.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color, onClick, loading }) {
  return (
    <button
      title={title}
      disabled={loading}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        background: 'var(--bg-hover)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '5px 8px',
        color: loading ? 'var(--text-muted)' : color,
        cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
      }}
    >
      <Icon size={12} />
    </button>
  );
}

// ─── Tab: Performances ────────────────────────────────────────────────────────

function PerfTab({ hostId, host }) {
  const [history, setHistory] = useState([]);
  const [vms, setVms] = useState([]);

  useEffect(() => {
    api.getHostPerfHistory(hostId).then(d => setHistory(d.map(p => ({
      ...p, time: new Date(p.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }))));
    api.getHostVMs(hostId).then(setVms);
  }, [hostId]);

  const top5cpu = [...vms].sort((a, b) => b.cpu.usage - a.cpu.usage).slice(0, 5);
  const top5ram = [...vms].sort((a, b) => (b.ram.usedGB / b.ram.totalGB) - (a.ram.usedGB / a.ram.totalGB)).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>
            <Cpu size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Utilisation CPU — 1h
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="gcpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }} formatter={v => [`${v}%`, 'CPU']} />
              <Area type="monotone" dataKey="cpu" stroke="#4f8ef7" fill="url(#gcpu)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>
            <MemoryStick size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Utilisation RAM — 1h
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="gram" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c45ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c45ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }} formatter={v => [`${v}%`, 'RAM']} />
              <Area type="monotone" dataKey="ram" stroke="#c45ef7" fill="url(#gram)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Top CPU — VMs</div>
          {top5cpu.map(vm => (
            <div key={vm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ minWidth: 140, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vm.name}</span>
              <UsageBar value={vm.cpu.usage} />
              <span style={{ minWidth: 38, fontSize: 12, fontWeight: 600, textAlign: 'right', color: vm.cpu.usage > 80 ? 'var(--danger)' : 'var(--text-primary)' }}>{vm.cpu.usage}%</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Top RAM — VMs</div>
          {top5ram.map(vm => {
            const pct = vm.ram.totalGB > 0 ? ((vm.ram.usedGB / vm.ram.totalGB) * 100).toFixed(0) : 0;
            return (
              <div key={vm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ minWidth: 140, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vm.name}</span>
                <UsageBar value={pct} color="#c45ef7" />
                <span style={{ minWidth: 52, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{vm.ram.usedGB}/{vm.ram.totalGB}G</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Storage ─────────────────────────────────────────────────────────────

function StorageTab({ hostId }) {
  const [datastores, setDatastores] = useState([]);

  useEffect(() => { api.getHostStorage(hostId).then(setDatastores); }, [hostId]);

  const typeColor = { NFS: '#22d3a3', VMFS: '#4f8ef7', Local: '#f5a623' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {datastores.map(ds => {
        const usedPct = Math.round((ds.usedGB / ds.capacityGB) * 100);
        const col = usedPct > 85 ? '#f5534b' : usedPct > 70 ? '#f5a623' : '#4f8ef7';
        return (
          <div key={ds.id} className="card" style={{ padding: 20, borderLeft: `3px solid ${typeColor[ds.type] || '#4f8ef7'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ds.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ds.host}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                  background: `${typeColor[ds.type]}20`, color: typeColor[ds.type] }}>
                  {ds.type}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                  background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                  {ds.transportType}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Utilisé</span>
                <span style={{ fontWeight: 700, color: col }}>{usedPct}%</span>
              </div>
              <div style={{ background: 'var(--bg-hover)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${usedPct}%`, background: col, height: '100%', borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{fmtBytes(ds.usedGB)} utilisé</span>
                <span>{fmtBytes(ds.capacityGB - ds.usedGB)} libre / {fmtBytes(ds.capacityGB)}</span>
              </div>
            </div>

            {ds.vms.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{ds.vms.length} VM(s)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ds.vms.slice(0, 4).map(v => (
                    <span key={v} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-hover)', borderRadius: 4, color: 'var(--text-secondary)' }}>{v}</span>
                  ))}
                  {ds.vms.length > 4 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{ds.vms.length - 4}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Réseau ──────────────────────────────────────────────────────────────

function NetworkTab({ hostId }) {
  const [netData, setNetData] = useState(null);

  useEffect(() => { api.getHostNetwork(hostId).then(setNetData); }, [hostId]);

  if (!netData) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  const pgTypeColor = { 'VM Network': '#4f8ef7', 'VMkernel': '#c45ef7', 'Management': '#22d3a3' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {netData.vswitches.map(vsw => (
        <div key={vsw.name} className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(79,142,247,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                <Network size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{vsw.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vsw.ports} ports · MTU {vsw.mtu}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {vsw.uplinks.map(ul => (
                <span key={ul.nic} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11,
                  background: ul.status === 'online' ? 'rgba(34,211,163,0.12)' : 'rgba(245,166,35,0.12)',
                  color: ul.status === 'online' ? 'var(--success)' : 'var(--warning)',
                  border: `1px solid ${ul.status === 'online' ? 'rgba(34,211,163,0.3)' : 'rgba(245,166,35,0.3)'}`,
                }}>
                  {ul.nic} · {ul.speed}
                </span>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Groupes de ports ({vsw.portgroups.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nom', 'VLAN', 'Type', 'VMs'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vsw.portgroups.map(pg => (
                <tr key={pg.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{pg.name}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {pg.vlanId === 0 ? <span style={{ color: 'var(--text-muted)' }}>—</span> : (
                      <span style={{ fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
                        VLAN {pg.vlanId}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                      background: `${pgTypeColor[pg.type] || '#4f8ef7'}18`,
                      color: pgTypeColor[pg.type] || '#4f8ef7',
                    }}>{pg.type}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                    {pg.vmCount > 0 ? pg.vmCount : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: vMotion ─────────────────────────────────────────────────────────────

function VMotionTab({ hostId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEsxiVMotion().then(res => {
      const hostMigrations = res.filter(m => m.src === hostId || m.dst === hostId);
      setData(hostMigrations.length > 0 ? hostMigrations : res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [hostId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement vMotion...</div>;

  const totalSucc = data.filter(m => m.status === 'success').length;
  const avgDur    = data.length > 0 ? Math.round(data.reduce((s, m) => s + m.durationSec, 0) / data.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Migrations (30j)', value: data.length,              color: 'var(--accent)' },
          { label: 'Réussies',         value: `${totalSucc}/${data.length}`, color: '#22d3a3' },
          { label: 'Durée moyenne',    value: `${avgDur}s`,             color: '#f5a623' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowRightLeft size={13} /> HISTORIQUE vMotion (30 derniers jours)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
              {['VM', 'Source', 'Destination', 'Durée', 'Raison', 'Statut', 'Date'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 12px', fontWeight: 600 }}>{m.vm}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{m.src}</td>
                <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{m.dst}</td>
                <td style={{ padding: '9px 12px', color: m.durationSec > 30 ? '#f5a623' : 'var(--text-primary)', fontWeight: 600 }}>{m.durationSec}s</td>
                <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{m.reason}</td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: m.status === 'success' ? 'rgba(34,211,163,0.12)' : 'rgba(245,83,75,0.12)',
                    color: m.status === 'success' ? '#22d3a3' : '#f5534b' }}>
                    {m.status === 'success' ? '✓ Succès' : '✗ Échec'}
                  </span>
                </td>
                <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{m.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: DRS / HA ────────────────────────────────────────────────────────────

function DRSTab() {
  const [drsData, setDrsData] = useState(null);

  useEffect(() => {
    api.getEsxiDrsHa().then(setDrsData).catch(() => {});
  }, []);

  if (!drsData) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement DRS/HA...</div>;

  const { drs: DRS_CFG, ha: HA_CFG } = drsData;
  const balColor = DRS_CFG.score < 40 ? '#10b981' : DRS_CFG.score < 70 ? '#f5a623' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>DRS — Distributed Resource Scheduler</span>
            <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: DRS_CFG.enabled ? 'rgba(34,211,163,0.12)' : 'rgba(245,83,75,0.12)',
              color: DRS_CFG.enabled ? '#10b981' : '#ef4444' }}>
              {DRS_CFG.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </span>
          </div>
          {[
            { label: 'Mode',         value: DRS_CFG.mode },
            { label: 'Niveau cible', value: DRS_CFG.target },
            { label: 'Dernier passage', value: new Date(DRS_CFG.lastRun).toLocaleTimeString() },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Score déséquilibre cluster</span>
              <span style={{ fontWeight: 700, color: balColor }}>{DRS_CFG.score} / 100</span>
            </div>
            <div style={{ background: 'var(--bg-hover)', borderRadius: 4, height: 8 }}>
              <div style={{ width: `${DRS_CFG.score}%`, height: '100%', background: balColor, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>HA — High Availability</span>
            <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: HA_CFG.enabled ? 'rgba(34,211,163,0.12)' : 'rgba(245,83,75,0.12)',
              color: HA_CFG.enabled ? '#10b981' : '#ef4444' }}>
              {HA_CFG.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </span>
          </div>
          {[
            { label: 'Admission Control',  value: HA_CFG.admissionControl },
            { label: 'Failover CPU', value: `${HA_CFG.failoverCapacityCPU}%` },
            { label: 'Failover RAM', value: `${HA_CFG.failoverCapacityRAM}%` },
            { label: 'VMs protégées', value: `${HA_CFG.vmsProtected}` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: vSAN ────────────────────────────────────────────────────────────────

function VSanTab({ hostId }) {
  const [vsanData, setVsanData] = useState(null);

  useEffect(() => {
    api.getEsxiVSan('cl-prod').then(setVsanData).catch(() => {});
  }, [hostId]);

  if (!vsanData) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement vSAN...</div>;

  const usedPct = Math.round((vsanData.usedGB / vsanData.capacityGB) * 100);
  const col = usedPct > 85 ? '#ef4444' : usedPct > 70 ? '#f5a623' : '#4f8ef7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Database size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>vSAN Cluster Status</span>
            <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: vsanData.health === 'OK' ? 'rgba(34,211,163,0.12)' : 'rgba(245,166,35,0.12)',
              color: vsanData.health === 'OK' ? '#10b981' : '#f5a623' }}>
              {vsanData.health}
            </span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Utilisation capacité globale</span>
              <span style={{ fontWeight: 700, color: col }}>{usedPct}%</span>
            </div>
            <div style={{ background: 'var(--bg-hover)', borderRadius: 4, height: 8 }}>
              <div style={{ width: `${usedPct}%`, height: '100%', background: col, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{fmtBytes(vsanData.usedGB)} utilisé</span>
              <span>{fmtBytes(vsanData.capacityGB)} total</span>
            </div>
          </div>
          <div style={{ fontSize: 12, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Ratio Dédoublonnage / Compression</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{vsanData.dedupRatio}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Santé par hôte</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vsanData.hosts.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Server size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{h.id}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                  <span>{h.latency}ms lat.</span>
                  <span>{h.iops} IOPS</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Multipathing ────────────────────────────────────────────────────────

function MultipathingTab({ hostId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEsxiMultipathing(hostId).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [hostId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement Multipathing...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Aucun stockage externe détecté.</div>
      ) : (
        data.map((m, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link size={16} color="var(--accent)" />
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{m.target}</div>
              </div>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(34,211,163,0.1)', color: '#10b981' }}>{m.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Chemins totaux</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{m.paths}</div>
              </div>
              <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Chemins actifs</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{m.activePaths}</div>
              </div>
              <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Politique PSP</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{m.policy}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Tab: NSX-T ───────────────────────────────────────────────────────────────

function NSXTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getEsxiNsx().then(setData).catch(() => {});
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement NSX...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Cloud size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Réseau Logique NSX-T</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--bg-hover)', padding: 15, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{data.logicalSwitches}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Segments logiques</div>
            </div>
            <div style={{ background: 'var(--bg-hover)', padding: 15, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{data.distributedRouters}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Routeurs distribués</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>NSX Edges (Gateways)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.edges.map(e => (
              <div key={e.id} style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{e.id}</span>
                  <span style={{ fontSize: 10, color: '#10b981' }}>{e.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{e.tunnels} Tunnels Geneve</span>
                  <span>{e.throughputMbps} Mbps</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Documentation ───────────────────────────────────────────────────────

function DocsTab({ host }) {
  const specs = [
    { label: 'Fabricant',         value: 'Hewlett Packard Enterprise' },
    { label: 'Modèle',            value: host?.model || 'HPE ProLiant DL380 Gen10' },
    { label: 'Hyperviseur',       value: host?.version || 'VMware ESXi 7.0 U3' },
    { label: 'BIOS',              value: 'U30 v2.62 (04/15/2024)' },
    { label: 'iLO Firmware',      value: 'iLO 5 v3.00' },
    { label: 'Processeur',        value: '2× Intel Xeon Gold 5218R @ 2.10 GHz' },
    { label: 'RAM',               value: `${host?.ram?.totalGB || 192} GB DDR4-2933` },
    { label: 'Réseau',            value: '4× 10GbE SFP+' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench size={16} color="var(--accent)" /> Spécifications Techniques
        </div>
        {specs.map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontWeight: 600 }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} color="#10b981" /> Architecture Logique
        </div>
        <div style={{ padding: 40, border: '2px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Schéma d'architecture généré dynamiquement</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>(Indisponible en mode simulation)</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ESXiHostDetail() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('vms');
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEsxiHost(hostId)
      .then(h => { setHost(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, [hostId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement de l'hôte…</div>;
  if (!host) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <AlertTriangle size={32} color="var(--warning)" style={{ marginBottom: 12 }} />
      <div style={{ color: 'var(--text-secondary)' }}>Hôte introuvable : <code>{hostId}</code></div>
      <button onClick={() => navigate('/infrastructure')} style={{ marginTop: 16, padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer' }}>
        Retour à l'infrastructure
      </button>
    </div>
  );

  const cpuPct = Math.round((host.cpu.usedCores / host.cpu.totalCores) * 100);
  const ramPct = Math.round((host.ram.usedGB / host.ram.totalGB) * 100);

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate('/infrastructure')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, padding: 0 }}>
        <ArrowLeft size={14} /> Infrastructure
      </button>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(79,142,247,0.12)', borderRadius: 12, padding: 16 }}>
              <Server size={32} color="var(--accent)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{host.name}</h1>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: 'rgba(34,211,163,0.12)', color: '#10b981', border: '1px solid rgba(34,211,163,0.3)' }}>
                  ● EN LIGNE
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{host.model} · {host.version}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{host.ip} · Cluster : {host.cluster}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatPill label="Uptime" value={fmtUptime(host.uptime)} color="#10b981" />
            <StatPill label="VMs" value={host.vmCount} color="var(--accent)" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>CPU</span>
              <span style={{ fontWeight: 700 }}>{host.cpu.usedCores} / {host.cpu.totalCores} vCores ({cpuPct}%)</span>
            </div>
            <UsageBar value={cpuPct} color="var(--accent)" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>RAM</span>
              <span style={{ fontWeight: 700 }}>{host.ram.usedGB} / {host.ram.totalGB} GB ({ramPct}%)</span>
            </div>
            <UsageBar value={ramPct} color="#c45ef7" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 4, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap'
            }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'vms'     && <VMsTab     hostId={hostId} />}
        {tab === 'perf'    && <PerfTab    hostId={hostId} host={host} />}
        {tab === 'storage' && <StorageTab hostId={hostId} />}
        {tab === 'network' && <NetworkTab hostId={hostId} />}
        {tab === 'vsan'    && <VSanTab    hostId={hostId} />}
        {tab === 'vmotion' && <VMotionTab hostId={hostId} />}
        {tab === 'drs'     && <DRSTab />}
        {tab === 'multipathing' && <MultipathingTab hostId={hostId} />}
        {tab === 'nsx'     && <NSXTab />}
        {tab === 'docs'    && <DocsTab    host={host} />}
      </div>
    </div>
  );
}
