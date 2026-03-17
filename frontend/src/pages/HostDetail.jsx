import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Activity, Zap, HardDrive, MemoryStick, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatBytes(bytes, d = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`;
}

export default function HostDetail({ metrics }) {
  const navigate = useNavigate();

  if (!metrics) {
    return (
      <div className="empty-state">
        <Server size={32} />
        <div>Chargement des métriques de l'hôte...</div>
      </div>
    );
  }

  const { host, cpu, ram, disk } = metrics;
  
  const chartData = Array.from({length: 20}, (_, i) => ({ t: i, v: Math.max(0, cpu.usage + (Math.random()-0.5)*10) }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="page-title glow-text">{host.hostname} (Hôte Physique)</div>
            <div className="page-subtitle">{host.os} · {host.distro}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="status-badge online">EN LIGNE</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card glass-panel" style={{ gridColumn: 'span 2' }}>
          <div className="card-title"><Activity size={13} /> CPU Serveur Physique</div>
          
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
             <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{cpu.model}</div>
             <div className="text-muted mt-1">{cpu.cores} cœurs logiques · {cpu.speed} GHz</div>
          </div>

          <div className="chart-wrapper" style={{ height: 200, marginTop: 24 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <Area type="monotone" dataKey="v" stroke="#4f8ef7" fill="rgba(79, 142, 247, 0.2)" />
                 <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                 <XAxis hide />
                 <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card glass-panel">
            <div className="card-title"><MemoryStick size={13} /> Mémoire (RAM)</div>
            <div style={{ fontSize: 32, fontWeight: 700, margin: '12px 0' }}>
              {ram.percent}%
            </div>
            <div className="progress-track" style={{ marginBottom: 12 }}>
              <div className="progress-fill warning" style={{ width: `${ram.percent}%` }} />
            </div>
            <div className="text-muted">
              {formatBytes(ram.used)} utilisés sur {formatBytes(ram.total)}
            </div>
          </div>

          <div className="card glass-panel">
            <div className="card-title"><HardDrive size={13} /> Stockage Local</div>
            {disk.map((d, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{d.mount} ({d.fs})</span>
                  <span className="text-muted">{d.percent}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill low" style={{ width: `${d.percent}%` }} /></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatBytes(d.used)} / {formatBytes(d.size)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
