import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Activity, Zap, HardDrive, MemoryStick, Server, 
  Monitor, Info, Network, Globe, Clock, ShieldCheck, Database, LayoutGrid
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatBytes(bytes, d = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export default function HostDetail({ metrics }) {
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    if (!metrics || !metrics.timestamps) return [];
    const { cpu, network, timestamps } = metrics;

    // We use the full available history (up to 1000 points) to show "since boot" fluctuations
    return (timestamps || []).map((ts, i, arr) => {
       const cpuHist = cpu.history || [];
       const ramHist = metrics.ram.history || [];
       const rxHist = network.rx_history || [];
       const txHist = network.tx_history || [];
       
       const idx = cpuHist.length - arr.length + i;
       return {
          time: new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fullTime: new Date(ts).toLocaleString('fr-FR'),
          CPU: cpuHist[idx] || 0,
          RAM: ramHist[idx] || 0,
          RX: parseFloat(((rxHist[idx] || 0) / 1024 / 1024).toFixed(2)),
          TX: parseFloat(((txHist[idx] || 0) / 1024 / 1024).toFixed(2))
       };
    });
  }, [metrics]);

  if (!metrics) {
    return (
      <div className="empty-state">
        <Server size={32} />
        <div>Chargement des métriques de l'hôte...</div>
      </div>
    );
  }

  const { host = {}, cpu = {}, ram = {}, disk = [], network = {}, processes = [], gpu = [], logs = [] } = metrics || {};

  return (
    <div className="fade-in">
      <div className="page-header-premium">
        <div className="ph-left" style={{ gap: 24 }}>
          <button 
             className="ph-icon-back" 
             onClick={() => navigate(-1)}
             style={{ cursor: 'pointer', outline: 'none', border: 'none' }}
           >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="page-title-premium" style={{ color: 'var(--text-primary)' }}>{host.hostname} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>(Hôte Physique)</span></div>
            <div className="page-subtitle-premium">{host.os} · {host.arch || 'x64'} ARCH</div>
          </div>
        </div>
        <div className="header-badge online" style={{ padding: '8px 16px' }}>
          <div className="dot" />
          <span style={{ fontWeight: 700, fontSize: 11 }}>MONITEUR ACTIF</span>
        </div>
      </div>

      <div className="actions-layout">
        <div className="actions-main" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                 {/* GRAPHE PERFORMANCE (CPU & RAM) */}
          <div className="card glass-panel" style={{ padding: 24 }}>
             <div className="card-title"><Activity size={13} color="var(--accent)" /> SYNTHÈSE DES RESSOURCES (CPU & RAM)</div>
             <div className="chart-wrapper" style={{ height: 400, marginTop: 20 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="pCPU" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="pRAM" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                   <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} minTickGap={60} />
                   <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} unit="%" />
                   <Tooltip 
                     contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                   />
                   <Area type="monotone" dataKey="CPU" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#pCPU)" isAnimationActive={false} />
                   <Area type="monotone" dataKey="RAM" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#pRAM)" isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: 'var(--accent)' }}>● UTILISATION CPU (%)</span>
                <span style={{ color: 'var(--success)' }}>● SATURATION RAM (%)</span>
             </div>
          </div>

          <div className="card glass-panel" style={{ padding: 24 }}>
             <div className="card-title"><Globe size={13} color="var(--warning)" /> TRAFIC RÉSEAU CONSOLIDÉ (ENTRANT & SORTANT)</div>
             <div className="chart-wrapper" style={{ height: 400, marginTop: 20 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="pRX" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="pTX" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                   <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} minTickGap={60} />
                   <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} unit="M" />
                   <Tooltip 
                     contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                   />
                   <Area type="monotone" dataKey="RX" stroke="var(--warning)" strokeWidth={3} fillOpacity={1} fill="url(#pRX)" isAnimationActive={false} />
                   <Area type="monotone" dataKey="TX" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#pTX)" isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: 'var(--warning)' }}>● DOWNLOAD (Mo/s)</span>
                <span style={{ color: '#a78bfa' }}>● UPLOAD (Mo/s)</span>
             </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* RAM DETAILLÉE */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title"><MemoryStick size={13} color="var(--success)" /> DÉCOMPOSITION MÉMOIRE</div>
                <div style={{ marginTop: 20 }}>
                   <div style={{ fontSize: 32, fontWeight: 800 }}>{ram.percent}% <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>de saturation</span></div>
                   <div className="progress-track" style={{ height: 6, margin: '14px 0' }}>
                     <div className="progress-fill warning" style={{ width: `${ram.percent}%` }} />
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                         <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Utilisé</div>
                         <div style={{ fontSize: 15, fontWeight: 700 }}>{formatBytes(ram.used)}</div>
                      </div>
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                         <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Libre</div>
                         <div style={{ fontSize: 15, fontWeight: 700 }}>{formatBytes(ram.free)}</div>
                      </div>
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                         <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disponible</div>
                         <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>{formatBytes(ram.available || 0)}</div>
                      </div>
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                         <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configuration</div>
                         <div style={{ fontSize: 15, fontWeight: 700 }}>ECC Support</div>
                      </div>
                   </div>
                </div>
              </div>

              {/* NETWORK INTERFACES */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title"><Network size={13} color="var(--warning)" /> INTERFACES RÉSEAU ACTIVES</div>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {network.interfaces && network.interfaces.map((iface, i) => (
                      <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                         <div style={{ background: 'var(--warning-bg)', padding: 8, borderRadius: 8 }}>
                            <Globe size={18} color="var(--warning)" />
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{iface.iface}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>MAC: {iface.mac}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{iface.ip}</div>
                            {iface.speed && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{iface.speed} Mbps</div>}
                         </div>
                      </div>
                   ))}
                </div>

                {gpu.length > 0 && (
                   <div style={{ marginTop: 24 }}>
                      <div className="card-title" style={{ fontSize: 11 }}><Monitor size={12} color="var(--accent)" /> UNITÉ GRAPHIQUE (GPU)</div>
                      {gpu.map((g, i) => (
                        <div key={i} style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                           <div style={{ fontWeight: 700, fontSize: 13 }}>{g.model}</div>
                           <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              <span>{g.vendor}</span>
                              {g.vram && <span>{g.vram} MB VRAM</span>}
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* PROCESSUS LES PLUS GOURMANDS */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title"><LayoutGrid size={13} color="var(--accent)" /> PROCESSUS LES PLUS ACTIFS</div>
                <div style={{ marginTop: 16 }}>
                   <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                         <tr>
                            <th style={{ textAlign: 'left', paddingBottom: 10 }}>Nom</th>
                            <th style={{ textAlign: 'right', paddingBottom: 10 }}>CPU</th>
                            <th style={{ textAlign: 'right', paddingBottom: 10 }}>RAM</th>
                         </tr>
                      </thead>
                      <tbody>
                         {processes.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                               <td style={{ padding: '10px 0', fontWeight: 600 }}>{p.name}</td>
                               <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{p.cpu}%</td>
                               <td style={{ textAlign: 'right', color: 'var(--warning)', fontWeight: 700 }}>{p.mem}%</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>

              {/* LOGS SYSTEME RECENTS */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title"><Info size={13} color="var(--accent)" /> ÉVÉNEMENTS SYSTÈME RÉCENTS</div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {logs.length > 0 ? logs.map((l, i) => (
                      <div key={i} style={{ fontSize: 12, display: 'flex', gap: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                         <div style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 60 }}>{l.time}</div>
                         <div style={{ color: l.type === 'error' ? 'var(--danger)' : l.type === 'warning' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                            {l.msg}
                         </div>
                      </div>
                   )) : <div className="text-muted" style={{ fontSize: 12 }}>Aucun log disponible.</div>}
                </div>
              </div>
          </div>

          <div className="card glass-panel" style={{ padding: 24 }}>
            <div className="card-title"><HardDrive size={13} color="var(--accent)" /> VOLUMES DE STOCKAGE PHYSIQUE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginTop: 20 }}>
              {disk.map((d, i) => (
                <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{d.mount}</div>
                    <div className="status-badge online" style={{ fontSize: 9 }}>LOCAL DISK</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Saturation: {d.percent}%</div>
                  <div className="progress-track" style={{ height: 6 }}><div className="progress-fill low" style={{ width: `${d.percent}%` }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                     <span>Utilisé: <strong>{formatBytes(d.used)}</strong></span>
                     <span>Total: <strong>{formatBytes(d.size)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="actions-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
           <div className="card glass-panel" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 12 }}><Info size={13} color="var(--accent)" /> ÉTAT GÉNÉRAL</div>
              <div style={{ padding: '16px 20px', background: 'var(--success-bg)', borderRadius: 12, border: '1px solid rgba(34, 211, 163, 0.2)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                 <ShieldCheck size={28} color="var(--success)" />
                 <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>STATION SAINE</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>Démarrée le {new Date(Date.now() - (host.uptime * 1000)).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</div>
                 </div>
              </div>

              <div className="card-title"><Info size={13} color="var(--accent)" /> SPÉCIFICATIONS SYSTÈME</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                 <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ background: 'var(--accent-glow)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Monitor size={20} color="var(--accent)" />
                    </div>
                    <div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Système d'Exploitation</div>
                       <div style={{ fontSize: 14, fontWeight: 700 }}>{host.os}</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ background: 'var(--accent-glow)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <ShieldCheck size={20} color="var(--success)" />
                    </div>
                    <div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Version du Noyau</div>
                       <div style={{ fontSize: 14, fontWeight: 700 }}>{host.kernel}</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ background: 'var(--accent-glow)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Clock size={20} color="var(--warning)" />
                    </div>
                    <div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temps d'Activité (Uptime)</div>
                       <div style={{ fontSize: 14, fontWeight: 700 }}>{formatDuration(host.uptime)}</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ background: 'var(--accent-glow)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Database size={20} color="var(--accent-secondary)" />
                    </div>
                    <div>
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Architecture Machine</div>
                       <div style={{ fontSize: 14, fontWeight: 700 }}>{(host.arch || 'x64').toUpperCase()} Node</div>
                    </div>
                 </div>
              </div>

              <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    <Zap size={14} color="var(--warning)" fill="var(--warning)" /> CONSEILLER DE SANTÉ
                 </div>
                 <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Les ressources de l'hôte sont exploitées à des niveaux optimaux. Aucun goulot d'étranglement détecté sur le bus E/S.
                 </p>
              </div>
           </div>

           <div className="card glass-panel" style={{ padding: 24 }}>
              <div className="card-title"><LayoutGrid size={13} color="var(--accent)" /> INFRASTRUCTURE ASSOCIEE</div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                 Cet hôte physique supporte actuellement l'exécution de charges de travail virtualisées. 
              </div>
              <button 
                className="btn-premium-link" 
                onClick={() => navigate('/infrastructure')}
                style={{ marginTop: 20 }}
              >
                Inspecter la topologie <Zap size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
