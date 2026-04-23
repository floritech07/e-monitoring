import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Server, Monitor, Building2, ChevronRight, ChevronDown, Globe, Box, Cpu } from 'lucide-react';
import { api } from '../api';
import '../Topology.css';

const typeIcons = {
  organization: Building2,
  site: Globe,
  host: Server,
  vm: Monitor,
};

function statusColor(status) {
  if (status === 'online') return 'var(--success)';
  if (status === 'warning') return 'var(--warning)';
  return 'var(--danger)';
}

function TreeNode({ node, depth = 0, selectedId, onSelect }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children?.length > 0;
  const Icon = typeIcons[node.type] || Server;
  const navigate = useNavigate();

  function handleClick() {
    onSelect(node.id);
    if (node.type === 'vm') navigate(`/infrastructure/${node.id}`);
    if (node.type === 'host' || node.type === 'hypervisor') navigate(`/infrastructure/esxi/${node.id}`);
    if (hasChildren) setExpanded(e => !e);
  }

  return (
    <div>
      <div
        className={`tree-row${selectedId === node.id ? ' selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="tree-toggle">
          {hasChildren ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
        </span>
        <Icon size={14} style={{ color: node.status ? statusColor(node.status) : 'var(--accent)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{node.name}</span>
        {node.status && (
          <span className={`status-badge ${node.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>
            {node.status === 'online' ? 'En ligne' : node.status === 'warning' ? 'Attn.' : 'Hors ligne'}
          </span>
        )}
        {node.ip && <span className="mono text-muted text-sm">{node.ip}</span>}
      </div>
      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--border)', marginLeft: `${depth * 16 + 20}px` }}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Infrastructure({ vms, metrics }) {
  const [tree, setTree] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('topology'); // 'tree' or 'topology'
  const [showVMware, setShowVMware] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getInfrastructure()
      .then(setTree)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vms]);

  const onlineCount = vms.filter(v => v.state === 'on').length;
  const offlineCount = vms.filter(v => v.state !== 'on').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title glow-text">Infrastructure SBEE</div>
          <div className="page-subtitle">Vue logique et topologie physique du système</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => console.log('New Site')}>
            + Nouveau Site / SI
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/infrastructure/new')}>
            + Ajouter un système
          </button>
          <span className="status-badge online">{onlineCount} en ligne</span>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: 20 }}>
        <div className={`tab-btn ${viewMode === 'topology' ? 'active' : ''}`} onClick={() => setViewMode('topology')}>
          <Box size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Topologie 3D Physique
        </div>
        <div className={`tab-btn ${viewMode === 'tree' ? 'active' : ''}`} onClick={() => setViewMode('tree')}>
          <GitBranch size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Arborescence Logique
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div className="dashboard-grid fade-in">
          {/* Tree */}
          <div className="card glass-panel" style={{ padding: '12px 0' }}>
            <div className="card-title" style={{ padding: '0 16px 8px' }}>
              <GitBranch size={13} /> Hiérarchie
            </div>
            {loading ? (
              <div className="empty-state"><div className="loading-spin" /></div>
            ) : tree ? (
              <TreeNode node={tree} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <div className="empty-state">Impossible de charger l'arborescence</div>
            )}
          </div>

          {/* VM list */}
          <div className="card glass-panel">
            <div className="card-title"><Monitor size={13} /> Liste des Machines</div>
            {vms.map(vm => (
              <div
                key={vm.id}
                onClick={() => navigate(`/infrastructure/${vm.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <Monitor size={15} style={{ color: vm.state === 'on' ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="vm-name truncate" style={{ fontWeight: 500 }}>{vm.name}</div>
                  <div className="vm-os" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vm.os} · <span className="mono">{vm.ip}</span></div>
                </div>
                <span className={`status-badge ${vm.state === 'on' ? 'online' : vm.state === 'suspended' ? 'suspended' : 'offline'}`}>
                  {vm.state === 'on' ? 'On' : vm.state === 'suspended' ? 'Sus.' : 'Off'}
                </span>
              </div>
            ))}
            {vms.length === 0 && (
              <div className="empty-state">Aucune VM détectée</div>
            )}
          </div>
        </div>
      ) : (
        <div className="card glass-panel fade-in" style={{ padding: 0 }}>
          <div className="topology-container">
            
            {/* Host PC Node (Premium Image) */}
            <div className="node-host-img" onClick={() => navigate('/infrastructure/host-details')} title="Voir les détails de l'hôte physique">
              <img 
                src="/uc-hp.png" 
                alt="HP Central Unit" 
                style={{ 
                  width: 220, 
                  height: 'auto', 
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                  transition: '0.3s transform ease'
                }} 
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
              />
              
              <div className="host-labels" style={{ bottom: -60 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {metrics?.host?.hostname || 'PCSIRGMFCHAKOUN'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>UNITÉ CENTRALE PHYSIQUE HP</div>
              </div>
            </div>

            <div className="topology-line-vertical" style={{ marginTop: 50 }} />

            {/* Hypervisor Node */}
            <div className="node-hypervisor" onClick={() => setShowVMware(!showVMware)}>
              <Cpu size={18} /> VMware Workstation / ESXi
              <ChevronDown size={14} style={{ transform: showVMware ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>

            {/* VMs Node */}
            {showVMware && (
              <div className="vms-container fade-in">
                {vms.map(vm => (
                  <div key={vm.id} style={{ position: 'relative' }}>
                    <div className="vm-drop-line" />
                    <div className="node-vm" onClick={() => navigate(`/infrastructure/${vm.id}`)} style={{ padding: '20px 15px' }}>
                      <div className="vm-image-container" style={{ marginBottom: 15 }}>
                        <img 
                          src={
                            vm.os?.toLowerCase().includes('ubuntu') ? '/vm-ubuntu.png' :
                            vm.os?.toLowerCase().includes('debian') ? '/vm-debian.png' :
                            vm.os?.toLowerCase().includes('redhat') || vm.os?.toLowerCase().includes('rhel') ? '/vm-redhat.png' :
                            '/vm-windows.png'
                          } 
                          alt={vm.os}
                          style={{ 
                            width: 80, 
                            height: 80, 
                            objectFit: 'contain',
                            filter: vm.state === 'on' ? 'drop-shadow(0 0 10px rgba(79, 142, 247, 0.3))' : 'grayscale(1) opacity(0.5)'
                          }}
                        />
                      </div>
                      <h4 className="truncate" style={{ fontSize: 14, fontWeight: 700 }}>{vm.name}</h4>
                      <div className="vm-os truncate" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{vm.os}</div>
                      <div className="mono text-muted text-sm mt-1" style={{ fontSize: 11, color: 'var(--accent)' }}>{vm.ip || '0.0.0.0'}</div>
                      <div className="mt-2">
                        <span className={`status-badge ${vm.state === 'on' ? 'online' : 'offline'}`} style={{ display: 'inline-block', fontSize: 9 }}>
                          {vm.state === 'on' ? 'INSTANCE ACTIVE' : 'HORS LIGNE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {vms.length === 0 && (
                  <div className="text-muted" style={{ padding: 20 }}>Aucune VM liée.</div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
