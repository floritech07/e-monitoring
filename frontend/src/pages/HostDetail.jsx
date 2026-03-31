import React, { useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Activity, Zap, HardDrive, MemoryStick, Server, 
  Monitor, Info, Network, Globe, Clock, ShieldCheck, Database, LayoutGrid, Shield
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
    const timestamps = metrics.timestamps || [];
    const cpuHist = metrics.cpu?.history || [];
    const ramHist = metrics.ram?.history || [];
    const rxHist = metrics.network?.rx_history || [];
    const txHist = metrics.network?.tx_history || [];

    return timestamps.map((ts, i, arr) => {
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

  const { host = {}, cpu = {}, ram = {}, disk = [], network = {}, processes = [], gpu = [], logs = [], health = {} } = metrics || {};
  const hStatus = health.status || 'STATION SAINE';
  const hAdvice = health.advice || 'Système opérationnel.';
  const hColor = hStatus.includes('SAINE') ? 'var(--success)' : hStatus.includes('CRITIQUE') ? 'var(--danger)' : 'var(--warning)';
  const hBgColor = hStatus.includes('SAINE') ? 'var(--success-bg)' : hStatus.includes('CRITIQUE') ? 'var(--danger-bg)' : 'var(--warning-bg)';

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
               <ResponsiveContainer width="100%" height={400} minWidth={0} minHeight={400}>
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
               <ResponsiveContainer width="100%" height={400} minWidth={0} minHeight={400}>
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
                <div className="card-title"><Network size={13} color="var(--warning)" /> INTERFACES RÉSEAU — DÉTAIL COMPLET</div>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                   {(network.allInterfaces || network.interfaces || []).map((iface, idx) => (
                      <div key={`iface-${iface.iface}-${idx}`} style={{
                        padding: 14, border: `1px solid ${iface.operstate === 'up' ? 'rgba(34,211,163,0.25)' : 'var(--border)'}`,
                        borderRadius: 10, background: iface.operstate === 'up' ? 'rgba(34,211,163,0.04)' : 'rgba(255,255,255,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ background: iface.operstate === 'up' ? 'rgba(34,211,163,0.15)' : 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>
                              <Globe size={16} color={iface.operstate === 'up' ? 'var(--success)' : 'var(--text-muted)'} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{iface.iface}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{iface.type || 'N/A'}{iface.virtual ? ' · Virtuel' : ''}</div>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: iface.operstate === 'up' ? 'rgba(34,211,163,0.15)' : 'rgba(255,90,90,0.15)',
                            color: iface.operstate === 'up' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${iface.operstate === 'up' ? 'rgba(34,211,163,0.3)' : 'rgba(255,90,90,0.3)'}`
                          }}>{(iface.operstate || 'N/A').toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IPv4</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{iface.ip4 || iface.ip || 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Adresse MAC</div>
                            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{iface.mac || 'N/A'}</div>
                          </div>
                          {iface.speed > 0 && <div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vitesse</div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{iface.speed} Mbps</div>
                          </div>}
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DHCP</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: iface.dhcp ? 'var(--warning)' : 'var(--text-secondary)' }}>{iface.dhcp ? 'Automatique' : 'Statique'}</div>
                          </div>
                          {iface.ip6 && iface.ip6 !== '::' && <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IPv6</div>
                            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{iface.ip6}</div>
                          </div>}
                        </div>
                      </div>
                   ))}
                   {(network.allInterfaces || network.interfaces || []).length === 0 && (
                     <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune interface réseau détectée.</div>
                   )}
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
              {/* TASK MANAGER SECTION */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title">
                  <LayoutGrid size={13} color="var(--accent)" /> 
                  PROCESSUS & APPLICATIONS ACTIVES
                </div>
                
                <div style={{ marginTop: 20, maxHeight: 800, overflowY: 'auto', paddingRight: 4 }}>
                   {(() => {
                      const apps = [];
                      const back = [];
                      (processes || []).forEach(p => {
                         if (!p) return;
                         const pathStr = typeof p.path === 'string' ? p.path.toLowerCase() : '';
                         const isSystem = pathStr.includes('system32') || pathStr.includes('windows') || (p.cpu <= 0.1 && p.mem < 2);
                         
                         if (!isSystem && p.cpu > 0.01) {
                            apps.push(p);
                         } else {
                            back.push(p);
                         }
                      });
                      
                      const sections = [
                        { label: 'Applications de premier plan', icon: Monitor, data: apps, color: 'var(--accent)' },
                        { label: 'Processus système & arrière-plan', icon: ShieldCheck, data: back, color: 'var(--text-muted)' }
                      ];

                      return sections.map((section, sidx) => (
                        <div key={section.label} style={{ marginBottom: 32 }}>
                           <div style={{ 
                             display: 'flex', 
                             alignItems: 'center', 
                             gap: 10, 
                             fontSize: 12, 
                             fontWeight: 700, 
                             color: section.color,
                             marginBottom: 16,
                             padding: '0 8px',
                             opacity: 0.8
                           }}>
                             <section.icon size={14} />
                             {section.label.toUpperCase()} ({section.data.length})
                           </div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {section.data.length > 0 ? section.data.slice(0, 40).map((p, idx) => (
                                <div 
                                  key={`proc-${sidx}-${p.pid}-${idx}`}
                                  className="fade-in"
                                  style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr auto auto', 
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all 0.2s',
                                    cursor: 'default'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.borderColor = 'var(--border-bright)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name || 'Processus Inconnu'}
                                      </span>
                                      <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 2 }}>
                                        PID {p.pid}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                                      <span>Utilisateur: {p.user}</span>
                                      {p.path && <span title={p.path} style={{ opacity: 0.5 }}>• {p.path.split('\\').pop().split('/').pop()}</span>}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU</div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: p.cpu > 20 ? 'var(--danger)' : p.cpu > 5 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                        {p.cpu.toFixed(1)}%
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: 70 }}>
                                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAM</div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {p.rss ? `${p.rss} Mo` : `${p.mem.toFixed(1)}%`}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <div 
                                      style={{ width: 3, height: 24, borderRadius: 2, background: p.cpu > 10 ? 'var(--danger)' : 'var(--accent)', opacity: 0.3 }} 
                                      title="Charge CPU"
                                    />
                                    <div 
                                      style={{ width: 3, height: 24, borderRadius: 2, background: 'var(--success)', opacity: 0.3 }} 
                                      title="Charge RAM"
                                    />
                                  </div>
                                </div>
                              )) : (
                                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Aucun processus actif détecté dans cette catégorie.
                                </div>
                              )}
                           </div>
                        </div>
                      ));
                   })()}
                </div>
              </div>

              {/* LOGS SYSTEME RECENTS */}
              <div className="card glass-panel" style={{ padding: 24 }}>
                <div className="card-title"><Info size={13} color="var(--accent)" /> ÉVÉNEMENTS SYSTÈME RÉCENTS</div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {logs.length > 0 ? logs.map((l, i) => (
                      <div key={`log-${l.ts}-${i}`} style={{ fontSize: 12, display: 'flex', gap: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
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
                <div key={`disk-${d.mount}-${i}`} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12 }}>
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
              <div style={{ padding: '16px 20px', background: hBgColor, borderRadius: 12, border: `1px solid ${hColor}`, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                 <ShieldCheck size={28} color={hColor} />
                 <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: hColor }}>{hStatus}</div>
                    <div style={{ fontSize: 10, opacity: 0.8, color: hColor }}>Démarrée le {new Date(Date.now() - (host.uptime * 1000)).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</div>
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
                       <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Architecture & Gen</div>
                       <div style={{ fontSize: 14, fontWeight: 700 }}>{(host.arch || 'x64').toUpperCase()} · {host.hardware?.family || 'PC'}</div>
                    </div>
                 </div>
              </div>

              <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    <Zap size={14} color="var(--warning)" fill="var(--warning)" /> CONSEILLER DE SANTÉ & ALIMENTATION
                 </div>
                 <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {hAdvice}
                 </p>
              </div>
           </div>

           {/* ─── BIOS + CARTE MÈRE + INSTALLATION + RAM ─── */}
           <div className="card glass-panel" style={{ padding: 24 }}>
             <div className="card-title"><Database size={13} color="var(--accent)" /> MATÉRIEL &amp; INSTALLATION</div>
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr)', gap: 16, marginTop: 20 }}>
               
               {/* 1. Identification système */}
               <div style={{ display: 'flex', gap: 14 }}>
                 <div style={{ background: 'var(--accent-glow)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <Monitor size={17} color="var(--accent)" />
                 </div>
                 <div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modèle & Génération</div>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>{host.hardware?.manufacturer} {host.hardware?.model}</div>
                   <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{host.hardware?.family}</div>
                 </div>
               </div>

               {/* 2. Dispo Mémoire RAM */}
               {host.ramLayout && (
                 <div style={{ display: 'flex', gap: 14 }}>
                   <div style={{ background: 'rgba(34,211,163,0.1)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <MemoryStick size={17} color="var(--success)" />
                   </div>
                   <div>
                     <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Architecture Mémoire (RAM)</div>
                     <div style={{ fontSize: 13, fontWeight: 700 }}>{host.ramLayout.usedSlots} slots utilisés sur {host.ramLayout.totalSlots}</div>
                     <div style={{ fontSize: 11, color: host.ramLayout.canUpgrade ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                       {host.ramLayout.canUpgrade ? '✅ Extension possible' : '⚠️ Slots maximisés ou non détectés'}
                     </div>
                     {host.ramLayout.sticks.length > 0 && (
                       <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                         {host.ramLayout.sticks.map((s,i) => `${s.size > 0 ? formatBytes(s.size) : 'Inconnu'} ${s.type !== 'N/A' && s.type !== 'Unknown' ? s.type : ''} ${s.clockSpeed ? `(${s.clockSpeed}MHz)` : ''}`).join(' + ')}
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* 3. Carte Mère & BIOS */}
               <div style={{ display: 'flex', gap: 14 }}>
                 <div style={{ background: 'rgba(167,139,250,0.1)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <Server size={17} color="#a78bfa" />
                 </div>
                 <div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carte Mère & BIOS</div>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>{host.motherboard?.manufacturer || 'Inconnu'} {host.motherboard?.model || ''}</div>
                   <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>BIOS v{host.bios?.version} {host.bios?.releaseDate ? `(${host.bios.releaseDate})` : ''}</div>
                 </div>
               </div>

               {/* 4. Support Virtualisation */}
               <div style={{ display: 'flex', gap: 14 }}>
                 <div style={{ background: 'rgba(79,142,247,0.1)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <Cpu size={17} color="var(--accent)" />
                 </div>
                 <div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Virtualisation Matérielle</div>
                   <div style={{ fontSize: 13, fontWeight: 700, color: host.hardware?.virtualization?.includes('Activée') ? 'var(--success)' : 'var(--warning)' }}>
                     {host.hardware?.virtualization || 'Inconnu'}
                   </div>
                 </div>
               </div>

               {/* 5. Alimentation Batterie / Secteur */}
               {host.battery && (
                 <div style={{ display: 'flex', gap: 14 }}>
                   <div style={{ background: host.battery.hasBattery && !host.battery.isCharging ? 'rgba(245,155,0,0.1)' : 'rgba(34,211,163,0.1)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <Zap size={17} color={host.battery.hasBattery && !host.battery.isCharging ? 'var(--warning)' : 'var(--success)'} />
                   </div>
                   <div>
                     <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source d'Alimentation</div>
                     <div style={{ fontSize: 13, fontWeight: 700 }}>
                       {!host.battery.hasBattery ? '🔌 Sur secteur continu (Stationnaire)' : host.battery.isCharging ? `🔌 Branché / En charge (${host.battery.percent}%)` : `🔋 Sur Batterie (${host.battery.percent}%)`}
                     </div>
                     {host.battery.hasBattery && host.battery.designedCapacity && (
                       <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Santé batterie: {Math.round((host.battery.currentCapacity / host.battery.designedCapacity)*100)}%</div>
                     )}
                   </div>
                 </div>
               )}

               {/* 6. OS Install & Update */}
               <div style={{ display: 'flex', gap: 14 }}>
                 <div style={{ background: 'var(--accent-glow)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <Clock size={17} color="var(--accent)" />
                 </div>
                 <div>
                   {host.installDate && typeof host.installDate === 'string' && (
                     <div style={{ fontSize: 12, fontWeight: 600 }}>Installé le: <span style={{color: 'var(--text-primary)'}}>{host.installDate.split(' ')[0]}</span></div>
                   )}
                   {host.lastUpdate && (
                     <div style={{ fontSize: 12, fontWeight: 600 }}>
                       Dernière MAJ: <span style={{color: 'var(--text-primary)'}}>
                         {typeof host.lastUpdate.date === 'string' ? host.lastUpdate.date : 'Récemment'} ({host.lastUpdate.id})
                       </span>
                     </div>
                   )}
                 </div>
               </div>

               {/* ─── SÉCURITÉ & SANTÉ DISQUES ─── */}
               {(host.security || (host.physicalDisks && host.physicalDisks.length > 0)) && (
                 <div className="card glass-panel" style={{ padding: 24 }}>
                   <div className="card-title"><Shield size={13} color="var(--success)" /> SÉCURITÉ &amp; ÉTAT PHYSIQUE</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                     
                     {/* Disques Physiques */}
                     {host.physicalDisks && host.physicalDisks.map((disk, idx) => (
                       <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                           <HardDrive size={16} color={disk.type?.includes('SSD') ? 'var(--accent)' : 'var(--text-muted)'} />
                           <div style={{ fontWeight: 700, fontSize: 13 }}>{disk.name}</div>
                         </div>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                               <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type / Capacité</div>
                               <div style={{ fontSize: 11, fontWeight: 600 }}>{disk.type} · {formatBytes(disk.size)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Santé SMART</div>
                               <div style={{ fontSize: 11, fontWeight: 800, color: disk.smartStatus === 'OK' ? 'var(--success)' : 'var(--danger)' }}>
                                  {disk.smartStatus === 'OK' ? 'Sain' : '⚠️ Critique'}
                               </div>
                            </div>
                         </div>
                       </div>
                     ))}

                     {/* Sécurité BIOS */}
                     {host.security && (
                       <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                         <div style={{ padding: 10, background: 'rgba(34,211,163,0.05)', borderRadius: 8, border: '1px solid rgba(34,211,163,0.1)' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Secure Boot</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: host.security.secureBoot === 'Activé' ? 'var(--success)' : 'var(--warning)' }}>
                              {host.security.secureBoot}
                            </div>
                         </div>
                         <div style={{ padding: 10, background: 'rgba(79,142,247,0.05)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.1)' }}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Puce TPM</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: host.security.tpm?.includes('tivé') ? 'var(--accent)' : 'var(--warning)' }}>
                               {host.security.tpm}
                            </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}


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
