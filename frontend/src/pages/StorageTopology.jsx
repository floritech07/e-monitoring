import { useState, useEffect } from 'react';
import {
  HardDrive, Database, Server, Network, RefreshCw,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle,
  Layers, BarChart2, Zap
} from 'lucide-react';
import { api } from '../api';

const TYPE_CONFIG = {
  SAN:   { color: '#4f8ef7', icon: Database,  label: 'SAN — Fibre Channel' },
  NAS:   { color: '#22d3a3', icon: Server,     label: 'NAS — NFS / SMB'    },
  Local: { color: '#f5a623', icon: HardDrive,  label: 'Stockage local'      },
};

const PROTOCOL_COLORS = {
  'FC':         '#4f8ef7',
  'NFS':        '#22d3a3',
  'NFS v4.1':   '#22d3a3',
  'iSCSI':      '#c45ef7',
  'Local SATA': '#f5a623',
  'SATA/SAS Local': '#f5a623',
};

function fmtGB(gb) {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb} GB`;
}

function CapBar({ used, total, color, height = 8 }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const col = pct > 85 ? '#f5534b' : pct > 70 ? '#f5a623' : color;
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: 4, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: col, height: '100%', borderRadius: 4, transition: 'width 0.5s' }} />
    </div>
  );
}

function ControllerCard({ ctrl, selected, onClick }) {
  const cfg = TYPE_CONFIG[ctrl.type] || TYPE_CONFIG.Local;
  const Icon = cfg.icon;
  const usedPct = ctrl.totalCapacityGB > 0 ? Math.round((ctrl.usedCapacityGB / ctrl.totalCapacityGB) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        padding: 16, cursor: 'pointer',
        borderLeft: `3px solid ${selected ? 'var(--accent)' : cfg.color}`,
        background: selected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        transition: 'all 0.15s',
      }}
      onMouseOver={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseOut={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-surface)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ background: `${cfg.color}18`, borderRadius: 8, padding: 8 }}>
          <Icon size={18} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctrl.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{ctrl.vendor} · {ctrl.model}</div>
        </div>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: ctrl.status === 'online' ? '#22d3a3' : '#f5534b',
          flexShrink: 0,
        }} />
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
          <span style={{ color: 'var(--text-muted)' }}>{fmtGB(ctrl.usedCapacityGB)} / {fmtGB(ctrl.totalCapacityGB)}</span>
          <span style={{ fontWeight: 700, color: usedPct > 85 ? '#f5534b' : 'var(--text-primary)' }}>{usedPct}%</span>
        </div>
        <CapBar used={ctrl.usedCapacityGB} total={ctrl.totalCapacityGB} color={cfg.color} />
      </div>

      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
        <span><Zap size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} />{ctrl.iopsTotal.toLocaleString()} IOPS</span>
        <span style={{ marginLeft: 'auto' }}>{ctrl.protocol}</span>
      </div>
    </div>
  );
}

function VolumeTree({ volumes, selectedControllerId }) {
  const [expanded, setExpanded] = useState({});
  const filtered = selectedControllerId
    ? volumes.filter(v => v.controllerId === selectedControllerId)
    : volumes;

  function toggle(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  }

  if (filtered.length === 0) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      Aucun volume pour cette baie.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {filtered.map(vol => {
        const usedPct = vol.capacityGB > 0 ? Math.round((vol.usedGB / vol.capacityGB) * 100) : 0;
        const col = usedPct > 85 ? '#f5534b' : usedPct > 70 ? '#f5a623' : PROTOCOL_COLORS[vol.protocol] || '#4f8ef7';
        const isOpen = expanded[vol.id];

        return (
          <div key={vol.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              onClick={() => toggle(vol.id)}
              style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              {isOpen ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}

              <HardDrive size={15} color={col} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{vol.name}</span>
                  <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: `${PROTOCOL_COLORS[vol.protocol] || '#4f8ef7'}18`, color: PROTOCOL_COLORS[vol.protocol] || '#4f8ef7' }}>
                    {vol.type}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{vol.protocol}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <CapBar used={vol.usedGB} total={vol.capacityGB} color={col} height={5} />
                  </div>
                  <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {fmtGB(vol.usedGB)} / {fmtGB(vol.capacityGB)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: col, minWidth: 36, textAlign: 'right' }}>{usedPct}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                <span title="Latence"><Zap size={10} style={{ verticalAlign: 'middle' }} /> {vol.latencyMs}ms</span>
                <span title="IOPS"><BarChart2 size={10} style={{ verticalAlign: 'middle' }} /> {vol.iops.toLocaleString()}</span>
                <span title="Hôtes montés"><Server size={10} style={{ verticalAlign: 'middle' }} /> {vol.mountedOn.length}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)', padding: '12px 16px 16px 42px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                  Hôtes montant ce volume ({vol.mountedOn.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {vol.mountedOn.map(hostId => (
                    <div key={hostId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <Server size={12} color="var(--accent)" />
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{hostId}</span>
                    </div>
                  ))}
                </div>
                {vol.vms.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                      VMs utilisant ce volume ({vol.vms.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {vol.vms.map(vm => (
                        <span key={vm} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(79,142,247,0.1)', borderRadius: 10, color: 'var(--accent)', border: '1px solid rgba(79,142,247,0.2)' }}>
                          {vm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StorageTopology() {
  const [data, setData] = useState(null);
  const [selectedCtrl, setSelectedCtrl] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const topo = await api.getStorageTopology();
      setData(topo);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <HardDrive size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div>Chargement de la topologie de stockage…</div>
    </div>
  );
  if (!data) return null;

  const { summary, controllers, volumes } = data;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HardDrive size={22} color="var(--accent)" /> Topologie de stockage
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {summary.controllerCount} baies · {summary.volumeCount} volumes · {fmtGB(summary.totalCapacityGB)} total
          </div>
        </div>
        <button onClick={load}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Capacité totale',  value: fmtGB(summary.totalCapacityGB),  color: 'var(--accent)',   icon: HardDrive },
          { label: 'Espace utilisé',   value: fmtGB(summary.usedCapacityGB),   color: '#f5a623',         icon: BarChart2 },
          { label: 'Espace libre',     value: fmtGB(summary.freeCapacityGB),   color: '#22d3a3',         icon: CheckCircle },
          { label: 'Remplissage',      value: `${summary.usedPercent}%`,       color: summary.usedPercent > 80 ? '#f5534b' : '#22d3a3', icon: Layers },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: `${kpi.color}18`, borderRadius: 8, padding: 10 }}>
                <Icon size={18} color={kpi.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global capacity bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Utilisation globale du stockage</span>
          <span style={{ fontWeight: 700 }}>{fmtGB(summary.usedCapacityGB)} utilisé sur {fmtGB(summary.totalCapacityGB)}</span>
        </div>
        <div style={{ background: 'var(--bg-hover)', borderRadius: 6, height: 14, overflow: 'hidden', display: 'flex' }}>
          {controllers.map(ctrl => {
            const pct = (ctrl.usedCapacityGB / summary.totalCapacityGB) * 100;
            const cfg = TYPE_CONFIG[ctrl.type] || TYPE_CONFIG.Local;
            return (
              <div key={ctrl.id} title={`${ctrl.name}: ${fmtGB(ctrl.usedCapacityGB)}`}
                style={{ width: `${pct}%`, background: cfg.color, height: '100%', transition: 'width 0.5s' }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {controllers.map(ctrl => {
            const cfg = TYPE_CONFIG[ctrl.type] || TYPE_CONFIG.Local;
            return (
              <div key={ctrl.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color, display: 'inline-block' }} />
                {ctrl.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: controllers list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Baies & contrôleurs
          </div>
          <button
            onClick={() => setSelectedCtrl(null)}
            style={{
              width: '100%', marginBottom: 8, padding: '10px 14px', background: !selectedCtrl ? 'rgba(79,142,247,0.1)' : 'var(--bg-surface)',
              border: `1px solid ${!selectedCtrl ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', color: !selectedCtrl ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left',
            }}>
            Tous les volumes ({volumes.length})
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {controllers.map(ctrl => (
              <ControllerCard
                key={ctrl.id}
                ctrl={ctrl}
                selected={selectedCtrl === ctrl.id}
                onClick={() => setSelectedCtrl(selectedCtrl === ctrl.id ? null : ctrl.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: volumes tree */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Volumes & datastores
            {selectedCtrl && (
              <span style={{ marginLeft: 8, color: 'var(--accent)', textTransform: 'none', fontSize: 11 }}>
                — {controllers.find(c => c.id === selectedCtrl)?.name}
              </span>
            )}
          </div>
          <VolumeTree volumes={volumes} selectedControllerId={selectedCtrl} />
        </div>
      </div>
    </div>
  );
}
