import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { HardDrive, RefreshCw, Search, ChevronRight, ChevronDown, Database, Folder, File, Server } from 'lucide-react';

const TYPE_COLOR = { vmdk: '#4F8EF7', iso: '#F59E0B', log: '#6B7280', snapshot: '#A855F7', other: '#374151' };

function fileExt(name) {
  const m = name?.match(/\.(\w+)$/);
  return m ? m[1].toLowerCase() : 'other';
}

function fmtSize(gb) {
  if (gb >= 1000) return `${(gb/1000).toFixed(1)} TB`;
  if (gb >= 1)    return `${gb.toFixed(1)} GB`;
  return `${(gb*1024).toFixed(0)} MB`;
}

// Simulation datastores
const DATASTORES_SIM = [
  {
    id: 'ds-san-01', name: 'SAN-HPE-MSA-Datastore01', type: 'VMFS 6', host: 'esxi-01-sbee',
    totalGB: 2048, usedGB: 1380, iops: 4200, latencyMs: 1.2,
    files: [
      { name: 'VM-AD-01.vmdk',       sizeGB: 80,  type: 'vmdk', vm: 'VM-AD-01' },
      { name: 'VM-AD-01-flat.vmdk',  sizeGB: 78,  type: 'vmdk', vm: 'VM-AD-01' },
      { name: 'VM-EXCHANGE.vmdk',    sizeGB: 200, type: 'vmdk', vm: 'VM-EXCHANGE' },
      { name: 'VM-VCENTER.vmdk',     sizeGB: 350, type: 'vmdk', vm: 'VM-VCENTER' },
      { name: 'VM-VEEAM.vmdk',       sizeGB: 150, type: 'vmdk', vm: 'VM-VEEAM' },
      { name: 'Win2019-template.vmdk',sizeGB: 45, type: 'vmdk', vm: null },
      { name: 'WinServer2022.iso',   sizeGB: 5.4, type: 'iso',  vm: null },
      { name: 'VMware-ESXi-8.0.iso', sizeGB: 0.8, type: 'iso',  vm: null },
    ],
  },
  {
    id: 'ds-nas-01', name: 'NAS-Synology-NFS01', type: 'NFS 4.1', host: 'esxi-02-sbee',
    totalGB: 4096, usedGB: 2150, iops: 1800, latencyMs: 3.5,
    files: [
      { name: 'VM-ESXi-02-LOCAL.vmdk', sizeGB: 120, type: 'vmdk', vm: 'VM-ESXi-02' },
      { name: 'VM-SGBD-PROD.vmdk',    sizeGB: 500, type: 'vmdk', vm: 'VM-SGBD-PROD' },
      { name: 'backups-veeam',         sizeGB: 900, type: 'folder', vm: null },
      { name: 'ISO-Library',           sizeGB: 48,  type: 'folder', vm: null },
    ],
  },
  {
    id: 'ds-local-01', name: 'ESXi-03-LocalSSD', type: 'VMFS 6 (Local)', host: 'esxi-03-sbee',
    totalGB: 500, usedGB: 320, iops: 12000, latencyMs: 0.4,
    files: [
      { name: 'VM-MONITORING.vmdk',   sizeGB: 80,  type: 'vmdk', vm: 'VM-MONITORING' },
      { name: 'VM-PROXY-VEEAM.vmdk',  sizeGB: 60,  type: 'vmdk', vm: 'VM-PROXY-VEEAM' },
      { name: 'swap',                  sizeGB: 12,  type: 'other', vm: null },
    ],
  },
];

function UsageBar({ usedGB, totalGB }) {
  const pct = Math.min(100, Math.round(usedGB / totalGB * 100));
  const col  = pct > 85 ? '#EA580C' : pct > 70 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: col, fontWeight: 600, minWidth: 38 }}>{pct}%</span>
    </div>
  );
}

export default function DatastoreBrowserPage() {
  const [datastores, setDatastores] = useState(DATASTORES_SIM);
  const [selected,   setSelected]   = useState(null);
  const [expanded,   setExpanded]   = useState({});
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStorageTopology();
      if (data?.datastores?.length) setDatastores(data.datastores);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedDS = datastores.find(d => d.id === selected);
  const filteredFiles = selectedDS
    ? selectedDS.files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const totalCap = datastores.reduce((s, d) => s + d.totalGB, 0);
  const totalUsed = datastores.reduce((s, d) => s + d.usedGB, 0);

  return (
    <div className="fade-in" style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={22} style={{ color: 'var(--accent)' }} />
            Datastore Browser
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Exploration des datastores — VMFS · NFS · Local · IOPS · Latence
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={13} /></button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Datastores', value: datastores.length, color: 'var(--accent)' },
          { label: 'Capacité totale', value: fmtSize(totalCap), color: '#4F8EF7' },
          { label: 'Utilisé', value: fmtSize(totalUsed), color: '#F59E0B' },
          { label: 'Libre', value: fmtSize(totalCap - totalUsed), color: '#10B981' },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 320px)', minHeight: 400 }}>
        {/* Liste datastores */}
        <div className="card glass-panel" style={{ width: 320, flexShrink: 0, overflowY: 'auto', padding: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            DATASTORES ({datastores.length})
          </div>
          {datastores.map(ds => {
            const usedPct = Math.round(ds.usedGB / ds.totalGB * 100);
            const col = usedPct > 85 ? '#EA580C' : usedPct > 70 ? '#F59E0B' : '#10B981';
            return (
              <div key={ds.id}
                style={{
                  padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: selected === ds.id ? 'rgba(79,142,247,0.1)' : 'transparent',
                  borderLeft: selected === ds.id ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
                onClick={() => setSelected(ds.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <HardDrive size={14} style={{ color: col, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ds.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ds.type}</div>
                  </div>
                </div>
                <UsageBar usedGB={ds.usedGB} totalGB={ds.totalGB} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4, color: 'var(--text-muted)' }}>
                  <span>{fmtSize(ds.usedGB)} / {fmtSize(ds.totalGB)}</span>
                  <span>{ds.iops.toLocaleString()} IOPS · {ds.latencyMs} ms</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Browser fichiers */}
        <div className="card glass-panel" style={{ flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
          {!selectedDS ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Database size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              Sélectionner un datastore pour explorer son contenu
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10 }}>
                <HardDrive size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{selectedDS.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({selectedDS.type} · {selectedDS.host})</span>
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Filtrer fichiers…"
                    style={{ paddingLeft: 26, paddingRight: 8, height: 28, background: 'var(--bg-base)',
                      border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)',
                      fontSize: 11, width: 180 }} />
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                      {['Nom', 'Type', 'Taille', 'VM associée'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left',
                          fontWeight: 600, color: 'var(--text-muted)', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((f, i) => {
                      const ext = fileExt(f.name);
                      const col = TYPE_COLOR[f.type] || TYPE_COLOR[ext] || '#6B7280';
                      const Icon = f.type === 'folder' ? Folder : File;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)',
                          transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Icon size={13} style={{ color: col, flexShrink: 0 }} />
                              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{f.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ padding: '1px 6px', borderRadius: 8, fontSize: 10,
                              background: `${col}20`, color: col }}>
                              {f.type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                            {fmtSize(f.sizeGB)}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            {f.vm ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                                <Server size={11} style={{ color: '#4F8EF7' }} />
                                {f.vm}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
