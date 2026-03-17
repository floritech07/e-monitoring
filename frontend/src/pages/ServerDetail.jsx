import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, MemoryStick, HardDrive, Activity, 
  Monitor, Shield, Network, Zap, Settings, Info 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function formatBytes(bytes, d = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`;
}

const HardwareInfoLine = ({ label, value, icon: Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
      <Icon size={16} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
    </div>
  </div>
);

const MetricCircle = ({ value, label, subLabel, color, icon: Icon }) => {
  const radius = 42; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', textAlign: 'center', border: '1px solid var(--border-bright)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: color, opacity: 0.5 }} />
      <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 16 }}>
        <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
          <circle 
            cx="45" cy="45" r={radius} 
            fill="transparent" stroke={color} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" style={{ transition: '1.5s' }} 
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: 20 }}>{Math.round(value)}%</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{subLabel}</div>
    </div>
  );
};

export default function ServerDetail({ vms, metrics }) {
  const { vmId } = useParams();
  const navigate = useNavigate();
  const vm = vms.find(v => v.id === vmId);

  if (!vm) return <div className="empty-state">Machine virtuelle introuvable.</div>;

  const isOn = vm.state === 'on';
  
  // Construct real chart data based on history sent by backend
  // We align the VM history with the most recent timestamps from the host
  const vmCpuHistory = vm.history?.cpu || [];
  const vmRamHistory = vm.history?.ram || [];
  const hostTimestamps = metrics?.timestamps || [];
  
  const chartData = vmCpuHistory.map((val, i) => {
    // Aligner avec la fin des timestamps de l'hôte
    const tsIdx = hostTimestamps.length - vmCpuHistory.length + i;
    const ts = hostTimestamps[tsIdx];
    const timeLabel = ts ? new Date(ts).toLocaleTimeString('fr-FR') : '--:--';
    
    return {
      time: timeLabel,
      CPU: val,
      RAM: vmRamHistory[i] || 0,
      RX: parseFloat(((vm.history?.netRx?.[i] || 0) / 1024 / 1024).toFixed(2)),
      TX: parseFloat(((vm.history?.netTx?.[i] || 0) / 1024 / 1024).toFixed(2))
    };
  }).slice(-30);


  // If we have no history yet, show a loading placeholder in the chart
  const hasData = chartData.length > 0;


  return (
    <div className="fade-in server-detail-dashboard">
      <div className="page-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: 8 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title glow-text" style={{ fontSize: 24 }}>Console d'Instance: {vm.name}</h1>
            <p className="page-subtitle">Ressources virtuelles et monitoring matériel local</p>
          </div>
        </div>
        <div className={`header-badge ${isOn ? 'online' : 'offline'}`} style={{ padding: '8px 20px' }}>
          <Activity size={14} className={isOn ? 'pulse' : ''} />
          <span style={{ fontWeight: 700 }}>{isOn ? 'OPÉRATIONNEL' : 'HORS LIGNE'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: 24 }}>
        
        {/* COLONNE GAUCHE : IDENTITE VM (REPLICATION DU STYLE DASHBOARD) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card glass-panel" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="card-title" style={{ width: '100%', marginBottom: 30, justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Monitor size={14} color="var(--accent)" /> ÉMULATEUR DE TERMINAL SBEE
            </div>
            
            <div className={`node-host-premium ${isOn ? 'pulse-soft' : ''}`} style={{ marginBottom: 60, cursor: 'default' }}>
              <div style={{ 
                width: 250, height: 180, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                filter: isOn ? 'drop-shadow(0 0 20px rgba(79, 142, 247, 0.4))' : 'none',
                position: 'relative'
              }}>
                <Monitor size={100} strokeWidth={1} color={isOn ? 'var(--accent)' : 'var(--text-muted)'} />
                {isOn && <div style={{ position: 'absolute', top: 20, right: 20, width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />}
              </div>
              
              <div className="host-labels-modern" style={{ textAlign: 'center', marginTop: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{vm.name}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 4, opacity: 0.8 }}>ENVIRONNEMENT VIRTUEL - ID {vm.id}</div>
              </div>
            </div>

            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 32 }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Système</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{vm.os}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Adresse IP</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>{vm.ip || '0.0.0.0'}</div>
                  </div>
               </div>
               
               <div style={{ marginTop: 28 }}>
                 <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Actions Pré-configurées</div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--success-bg)', color: 'var(--success)', justifyContent: 'center' }} onClick={() => navigate('/actions')}>
                      <Zap size={14} /> Power On
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }} onClick={() => navigate('/actions')}>
                      <Settings size={14} /> Paramètres
                    </button>
                 </div>
               </div>
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: 24 }}>
             <div className="card-title"><Info size={13} /> Description Technique</div>
             <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.6' }}>
               Cette instance virtuelle est hébergée sur l'infrastructure VMware du siège. Elle assure les services critiques de supervision pour le secteur Porto-Novo.
             </p>
             <div style={{ marginTop: 20 }}>
               <HardwareInfoLine label="Chemin du Fichier" value={vm.path?.split('\\').pop()} icon={HardDrive} />
               <HardwareInfoLine label="vCPUs" value={vm.cpu?.cores || 2} icon={Cpu} />
               <HardwareInfoLine label="vRAM" value={vm.ram?.total ? formatBytes(vm.ram.total) : '2 Go'} icon={MemoryStick} />
             </div>
          </div>
        </div>

        {/* COLONNE DROITE : METRIQUES (STYLE DASHBOARD) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
             <MetricCircle 
                value={isOn ? (vm.cpu?.usage || 0) : 0} 
                label="vCPU Usage" 
                subLabel={`${vm.cpu?.cores || 2} cœurs virtuels`} 
                color="#4f8ef7" icon={Cpu} 
              />
              <MetricCircle 
                value={isOn ? (vm.ram?.percent || 0) : 0} 
                label="vRAM Usage" 
                subLabel={isOn ? `${formatBytes(vm.ram?.used)} utilisés` : 'Hors ligne'} 
                color="#a78bfa" icon={MemoryStick} 
              />
              <MetricCircle 
                value={isOn ? 45 : 0} 
                label="IOPS Disque" 
                subLabel="Opérations d'E/S" 
                color="#f59c23" icon={HardDrive} 
              />
          </div>

          {/* Graphique CPU/RAM combiné */}
          <div className="card glass-panel" style={{ padding: 24, minHeight: 350, display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div className="card-title" style={{ margin: 0 }}><Activity size={13} /> Synthèse Performance</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 700 }}>
                   <span style={{ color: '#4f8ef7' }}>● CPU</span>
                   <span style={{ color: '#22d3a3' }}>● RAM</span>
                </div>
             </div>
             <div style={{ flex: 1, position: 'relative' }}>
                {!hasData ? (
                  <div className="empty-state" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <div className="loading-spin-sm" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 11 }}>Acquisition des données en cours...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="pCPU" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="pRAM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3a3" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3a3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="time" 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: 'var(--text-muted)'}} 
                        interval={Math.max(0, Math.floor(chartData.length / 5))}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="CPU" stroke="#4f8ef7" strokeWidth={3} fill="url(#pCPU)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="RAM" stroke="#22d3a3" strokeWidth={3} fill="url(#pRAM)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>

          {/* Graphique Réseau */}
          <div className="card glass-panel" style={{ padding: 24, minHeight: 230, display: 'flex', flexDirection: 'column' }}>
             <div className="card-title"><Network size={13} /> Trafic Réseau Virtuel</div>
             <div style={{ flex: 1, position: 'relative' }}>
                {!hasData ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 10, color: 'var(--text-muted)' }}>
                    Synchronisation flux réseau...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="time" 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: 'var(--text-muted)'}} 
                        interval={Math.max(0, Math.floor(chartData.length / 5))}
                      />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} unit=" Mb" />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="RX" stroke="#f59c23" fill="rgba(245, 156, 35, 0.1)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="TX" stroke="#a78bfa" fill="rgba(167, 139, 250, 0.1)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>


        </div>

      </div>
    </div>
  );
}
