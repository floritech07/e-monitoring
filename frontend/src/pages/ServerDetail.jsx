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

  const isOn = vm.state === 'on';
  const cpuData = Array.from({length: 20}, (_, i) => ({ t: i, v: isOn ? Math.max(0, (vm.cpu?.usage || 20) + (Math.random()-0.5)*10) : 0 }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="page-title glow-text">{vm.name} (VM VMware)</div>
            <div className="page-subtitle">{vm.os} · {vm.ip || 'Pas d\'IP détectée'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`status-badge ${isOn ? 'online' : 'offline'}`}>
            {isOn ? 'OPÉRATIONNEL' : 'HORS LIGNE'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/actions')}>
            <Zap size={13} /> Actions
          </button>
        </div>
      </div>

      <div className="tabs-container">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
          { id: 'hardware', label: 'Configuration VM', icon: Cpu },
          { id: 'network', label: 'Réseau Virtuel', icon: Network },
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
            <div className="card-title"><Activity size={13} /> Performance CPU de la VM</div>
            
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
               <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                 {isOn ? (vm.cpu?.usage || 0) : 0}% <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>de charge actuelle</span>
               </div>
               <div className="text-muted mt-1">{vm.cpu?.cores || 2} vCPUs alloués · Mode {vm.state === 'on' ? 'Temps Réel' : 'Statique'}</div>
            </div>

            <div className="chart-wrapper" style={{ height: 200, marginTop: 24 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={cpuData}>
                   <Area type="monotone" dataKey="v" stroke="var(--accent)" fill="var(--accent-glow)" isAnimationActive={false} />
                   <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                   <XAxis hide />
                   <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card glass-panel">
              <div className="card-title"><MemoryStick size={13} /> Mémoire Virtuelle (vRAM)</div>
              <div style={{ fontSize: 32, fontWeight: 700, margin: '12px 0', color: isOn ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {isOn ? (vm.ram?.percent || 0) : 0}%
              </div>
              <div className="progress-track" style={{ marginBottom: 12 }}>
                <div className={`progress-fill ${isOn ? 'accent' : ''}`} style={{ width: `${isOn ? (vm.ram?.percent || 0) : 0}%`, background: !isOn ? 'var(--border)' : undefined }} />
              </div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                {isOn ? `${formatBytes(vm.ram?.used)} utilisés` : 'VM éteinte - Ressources libérées'}
              </div>
            </div>

            <div className="card glass-panel">
              <div className="card-title"><HardDrive size={13} /> Stockage vDisk</div>
              {vm.disk && vm.disk.length > 0 ? vm.disk.map((d, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{d.mount}</span>
                    <span className="text-muted">{d.percent}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill low" style={{ width: `${d.percent}%` }} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatBytes(d.used)} / {formatBytes(d.size)}</div>
                </div>
              )) : (
                <div className="text-muted" style={{ fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
                  <Shield size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <br/>Informations disque non disponibles pour cette VM.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hardware' && (
        <div className="card glass-panel fade-in">
          <div className="card-title">Configuration Matérielle Virtuelle (VMX)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '10px 0' }}>
            <div>
              <HardwareInfoLine label="Processeur Virtuel" value={`${vm.cpu?.cores || 2} vCPUs`} icon={Cpu} />
              <HardwareInfoLine label="Type d'OS Invité" value={vm.os || 'Inconnu'} icon={Monitor} />
              <HardwareInfoLine label="Architecture" value="x64 - VMware Virtual Platform" icon={Settings} />
            </div>
            <div>
              <HardwareInfoLine label="Mémoire Allouée" value={vm.ram?.total ? formatBytes(vm.ram.total) : '2.0 GB'} icon={MemoryStick} />
              <HardwareInfoLine label="Version VMware Tools" value={isOn ? 'Installé (v12.4.0)' : 'Non détecté'} icon={Shield} />
              <HardwareInfoLine label="Chemin VMX" value={vm.path?.split('\\').pop() || 'config.vmx'} icon={HardDrive} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="card glass-panel fade-in">
          <div className="card-title">Adaptateurs Réseau Virtuels (vNIC)</div>
          <table className="vm-table">
            <thead>
              <tr><th>Interface</th><th>Mode</th><th>IPv4</th><th>VLAN/Switch</th><th>Statut</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Network size={14} /> vNet Adapter 0</div></td>
                <td>NAT / Bridged</td>
                <td className="mono">{vm.ip || 'Attente DHCP...'}</td>
                <td>VM Network (Default)</td>
                <td><span className={`status-badge ${isOn ? 'online' : 'offline'}`}>{isOn ? 'Connecté' : 'Câble débranché'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

