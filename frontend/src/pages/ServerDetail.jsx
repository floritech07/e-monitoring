import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, MemoryStick, HardDrive, Activity, Monitor, Shield, Network, Zap, Settings } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function formatBytes(bytes, d = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`;
}

function getProgressClass(pct) {
  if (pct < 60) return 'low';
  if (pct < 85) return 'medium';
  return 'high';
}

function HardwareInfoLine({ label, value, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export default function ServerDetail({ vms, metrics }) {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const vm = vms.find(v => v.id === vmId);

  if (!vm) {
    return (
      <div className="empty-state">
        <Monitor size={32} />
        <div>Système introuvable</div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Retour</button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="page-title glow-text">{vm.name}</div>
            <div className="page-subtitle">{vm.os} · {vm.ip}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`status-badge ${vm.state === 'on' ? 'online' : 'offline'}`}>
            {vm.state === 'on' ? 'OPÉRATIONNEL' : 'HORS LIGNE'}
          </span>
          <button className="btn btn-primary btn-sm"><Zap size={13} /> Actions</button>
        </div>
      </div>

      <div className="tabs-container">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
          { id: 'hardware', label: 'Hardware Physique', icon: Cpu },
          { id: 'network', label: 'Interfaces Réseau', icon: Network },
          { id: 'security', label: 'Sécurité & Logs', icon: Shield },
          { id: 'config', label: 'Configuration', icon: Settings },
        ].map(tab => (
          <div 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {tab.label}
          </div>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="dashboard-grid">
          <div className="card glass-panel" style={{ gridColumn: 'span 2' }}>
            <div className="card-title">Charge Temps Réel</div>
            <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr', padding: 0 }}>
               <div className="metric-card" style={{ background: 'none', border: 'none' }}>
                  <div className="metric-label">CPU</div>
                  <div className="metric-value cpu-val">{vm.cpu?.usage ?? 0}%</div>
                  <div className="progress-track"><div className={`progress-fill ${getProgressClass(vm.cpu?.usage ?? 0)}`} style={{ width: `${vm.cpu?.usage ?? 0}%` }} /></div>
               </div>
               <div className="metric-card" style={{ background: 'none', border: 'none' }}>
                  <div className="metric-label">RAM</div>
                  <div className="metric-value ram-val">{vm.ram?.percent ?? 0}%</div>
                  <div className="progress-track"><div className={`progress-fill ${getProgressClass(vm.ram?.percent ?? 0)}`} style={{ width: `${vm.ram?.percent ?? 0}%` }} /></div>
               </div>
            </div>
            <div className="chart-wrapper" style={{ height: 180, marginTop: 24 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={Array.from({length: 20}, (_, i) => ({ t: i, v: 20 + Math.random()*30 }))}>
                   <Area type="monotone" dataKey="v" stroke="var(--accent)" fill="var(--accent-glow)" />
                   <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                   <XAxis hide />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="card glass-panel">
            <div className="card-title">Disques Locaux</div>
            {vm.disk?.map((d, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{d.mount}</span>
                  <span className="text-muted">{d.percent}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill low" style={{ width: `${d.percent}%` }} /></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatBytes(d.used)} / {formatBytes(d.size)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'hardware' && (
        <div className="card glass-panel fade-in">
          <div className="card-title">Détails du Matériel Physique</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <HardwareInfoLine label="Processeur" value={vm.cpu?.model || 'Intel(R) Xeon(R) Platinum 8171M CPU @ 2.60GHz'} icon={Cpu} />
              <HardwareInfoLine label="Cœurs Logiques" value={`${vm.cpu?.cores || 4} vCPUs`} icon={Activity} />
              <HardwareInfoLine label="Sockets" value="1 Socket détecté" icon={Zap} />
              <HardwareInfoLine label="Architecture" value="x64 - Little Endian" icon={Settings} />
            </div>
            <div>
              <HardwareInfoLine label="Mémoire Totale" value={formatBytes(vm.ram?.total)} icon={MemoryStick} />
              <HardwareInfoLine label="Type de RAM" value="DDR4 Synchronous 2666 MHz" icon={MemoryStick} />
              <HardwareInfoLine label="BIOS Version" value="SBEE-v2.1.0-HP" icon={Shield} />
              <HardwareInfoLine label="Fabricant" value="VMware, Inc. / HP Enterprise" icon={Monitor} />
            </div>
          </div>
          
          <div style={{ marginTop: 32 }}>
            <div className="card-title" style={{ fontSize: 10 }}>Top Processus (Consommation)</div>
            <table className="vm-table" style={{ marginTop: 12 }}>
              <thead>
                <tr><th>PID</th><th>Processus</th><th>Utilisateur</th><th>CPU</th><th>RAM</th></tr>
              </thead>
              <tbody>
                <tr><td>4122</td><td>sqlservr.exe</td><td>SYSTEM</td><td>12.4%</td><td>1.2 GB</td></tr>
                <tr><td>1054</td><td>Explorer.EXE</td><td>DOMAIN/Admin</td><td>2.1%</td><td>450 MB</td></tr>
                <tr><td>882</td><td>WmiPrvSE.exe</td><td>NETWORK SERVICE</td><td>1.8%</td><td>64 MB</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="card glass-panel fade-in">
          <div className="card-title">Adaptateurs Réseau & Débits</div>
          <table className="vm-table">
            <thead>
              <tr><th>Interface</th><th>Adresse MAC</th><th>IPv4</th><th>VLAN</th><th>Débit Sortant</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="flex" style={{ gap: 8, alignItems: 'center' }}><Network size={14} /> Ethernet 0</div></td>
                <td className="mono">00:50:56:8b:2d:af</td>
                <td className="mono">{vm.ip}</td>
                <td>VLAN-SERVERS</td>
                <td style={{ color: 'var(--success)' }}>12.4 Mbps</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
