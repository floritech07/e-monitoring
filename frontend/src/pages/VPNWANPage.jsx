import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Globe, RefreshCw, Shield, AlertTriangle, CheckCircle, Wifi, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TUNNEL_STATUS = {
  up:         { color: '#10B981', label: 'Actif' },
  down:       { color: '#EA580C', label: 'Hors ligne' },
  renegotiate:{ color: '#F59E0B', label: 'Renégociation' },
};

const WAN_LINKS_SIM = [
  {
    id: 'wan-1', name: 'Orange Bénin — MPLS', type: 'MPLS', provider: 'Orange Bénin',
    bandwidth: '100 Mbps', latencyMs: 8, lossPercent: 0.01, uptime: 99.97,
    status: 'up', rxMbps: 34.2, txMbps: 18.7, sla: 99.9,
    history: Array.from({length: 24}, (_, i) => ({ t: `${i}h`, rx: 20+Math.random()*30, tx: 10+Math.random()*20 })),
  },
  {
    id: 'wan-2', name: 'MTN Bénin — Internet', type: 'Internet', provider: 'MTN Bénin',
    bandwidth: '50 Mbps', latencyMs: 22, lossPercent: 0.1, uptime: 99.12,
    status: 'up', rxMbps: 12.8, txMbps: 8.4, sla: 99.0,
    history: Array.from({length: 24}, (_, i) => ({ t: `${i}h`, rx: 8+Math.random()*15, tx: 4+Math.random()*10 })),
  },
  {
    id: 'wan-3', name: 'SBEE — Lien interne BO', type: 'Fiber', provider: 'Réseau interne',
    bandwidth: '1 Gbps', latencyMs: 2, lossPercent: 0, uptime: 100,
    status: 'up', rxMbps: 156, txMbps: 94, sla: 99.99,
    history: Array.from({length: 24}, (_, i) => ({ t: `${i}h`, rx: 100+Math.random()*120, tx: 60+Math.random()*80 })),
  },
];

const VPN_TUNNELS_SIM = [
  { id: 'vpn-1', name: 'SBEE-HQ ↔ Abomey-Calavi',    type: 'IPsec/IKEv2', peer: '105.234.12.8',   status: 'up',   rxGB: 12.4, txGB: 8.2,  created: '2026-01-10', lastRekey: '2026-04-24 06:00', cipher: 'AES-256/SHA-256' },
  { id: 'vpn-2', name: 'SBEE-HQ ↔ Parakou',           type: 'IPsec/IKEv2', peer: '41.203.194.22',  status: 'up',   rxGB: 5.8,  txGB: 3.1,  created: '2026-01-10', lastRekey: '2026-04-24 06:15', cipher: 'AES-256/SHA-256' },
  { id: 'vpn-3', name: 'SBEE-HQ ↔ Porto-Novo',        type: 'SSL/OpenVPN', peer: '102.89.44.18',   status: 'up',   rxGB: 8.1,  txGB: 4.7,  created: '2026-02-01', lastRekey: '2026-04-24 05:45', cipher: 'AES-256-GCM' },
  { id: 'vpn-4', name: 'SBEE-HQ ↔ Natitingou',        type: 'IPsec/IKEv2', peer: '197.234.88.41',  status: 'down', rxGB: 0,    txGB: 0,    created: '2026-01-10', lastRekey: '2026-04-23 22:00', cipher: 'AES-256/SHA-256' },
  { id: 'vpn-5', name: 'Admin remote SSL (collectif)', type: 'SSL/TLS',     peer: 'dynamic',         status: 'up',   rxGB: 2.3,  txGB: 1.1,  created: 'multiple',   lastRekey: '—', cipher: 'TLS 1.3/AES-256-GCM', sessions: 4 },
];

export default function VPNWANPage() {
  const [tab, setTab] = useState('wan');
  const [wanLinks, setWanLinks] = useState(WAN_LINKS_SIM);
  const [vpnTunnels, setVpnTunnels] = useState(VPN_TUNNELS_SIM);

  useEffect(() => {
    Promise.all([api.getSnmpWan().catch(() => null), api.getSnmpVpn().catch(() => null)]).then(([wan, vpn]) => {
      // Pour une démo, on simule l'historique au besoin ou on map les données
      if (vpn) {
        setVpnTunnels(vpn.map(v => ({
          id: v.id, name: v.name, type: 'IPsec', peer: v.peerIp, status: v.status.toLowerCase(), rxGB: v.rxBytes / 1073741824, txGB: v.txBytes / 1073741824, created: 'N/A', lastRekey: 'N/A', cipher: 'AES-256'
        })));
      }
      if (wan) {
        setWanLinks(wan.map((w, i) => ({
          id: w.linkId, name: w.isp, type: 'WAN', provider: w.isp, bandwidth: `${w.bandwidthMbps} Mbps`, latencyMs: w.latencyMs, lossPercent: w.packetLossPct, uptime: 99.9,
          status: w.status === 'Active' ? 'up' : 'down', rxMbps: w.bandwidthMbps * (w.utilizationPct / 100) * 0.7, txMbps: w.bandwidthMbps * (w.utilizationPct / 100) * 0.3, sla: 99.9,
          history: WAN_LINKS_SIM[i % WAN_LINKS_SIM.length]?.history || []
        })));
      }
    });
  }, []);

  const downTunnels = vpnTunnels.filter(t => t.status === 'down').length;
  const totalBwRx = wanLinks.reduce((s, l) => s + l.rxMbps, 0);
  const totalBwTx = wanLinks.reduce((s, l) => s + l.txMbps, 0);

  return (
    <div className="fade-in" style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={22} style={{ color: 'var(--accent)' }} />
            Réseau WAN & VPN
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Liens opérateurs · Tunnels IPsec/SSL · SLA · QoS
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Liens WAN actifs', value: wanLinks.filter(l=>l.status==='up').length + '/' + wanLinks.length, color: '#10B981' },
          { label: 'Tunnels VPN actifs', value: vpnTunnels.filter(t=>t.status==='up').length + '/' + vpnTunnels.length, color: downTunnels > 0 ? '#F59E0B' : '#10B981' },
          { label: 'Bande passante RX', value: `${totalBwRx.toFixed(0)} Mbps`, color: 'var(--accent)' },
          { label: 'Bande passante TX', value: `${totalBwTx.toFixed(0)} Mbps`, color: 'var(--accent)' },
          { label: 'Tunnels DOWN', value: downTunnels, color: downTunnels > 0 ? '#EA580C' : '#10B981' },
        ].map(k => (
          <div key={k.label} className="card glass-panel" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[{k:'wan',label:'Liens WAN / Opérateurs'},{k:'vpn',label:'Tunnels VPN'},{k:'qos',label:'QoS'}].map(t=>(
          <button key={t.k} className={`btn btn-sm ${tab===t.k?'btn-primary':'btn-ghost'}`} onClick={()=>setTab(t.k)}>{t.label}</button>
        ))}
      </div>

      {tab === 'wan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {wanLinks.map(link => (
            <div key={link.id} className="card glass-panel" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: TUNNEL_STATUS[link.status]?.color, flexShrink: 0, display: 'inline-block' }} />
                    {link.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    {link.type} · {link.provider} · {link.bandwidth}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{link.latencyMs} ms</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Latence</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: link.lossPercent > 0.5 ? '#EA580C' : '#10B981' }}>{link.lossPercent}%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Perte</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: link.uptime >= link.sla ? '#10B981' : '#EA580C' }}>{link.uptime}%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Uptime (SLA: {link.sla}%)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#4F8EF7' }}>↓ {link.rxMbps.toFixed(1)}</div>
                    <div style={{ fontWeight: 700, color: '#A855F7' }}>↑ {link.txMbps.toFixed(1)}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Mbps</div>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={link.history} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fill: '#6B7280', fontSize: 8 }} interval={3} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 8 }} />
                  <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #2a4060', fontSize: 10 }} />
                  <Area type="monotone" dataKey="rx" stroke="#4F8EF7" fill="#4F8EF720" strokeWidth={1.5} dot={false} name="RX Mbps" />
                  <Area type="monotone" dataKey="tx" stroke="#A855F7" fill="#A855F720" strokeWidth={1.5} dot={false} name="TX Mbps" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {tab === 'vpn' && (
        <div className="card glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                {['Tunnel', 'Type', 'Peer IP', 'Statut', 'RX', 'TX', 'Dernier rekey', 'Chiffrement'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vpnTunnels.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 10 }}>{t.type}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 10 }}>{t.peer}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: `${TUNNEL_STATUS[t.status]?.color}20`, color: TUNNEL_STATUS[t.status]?.color }}>
                      {TUNNEL_STATUS[t.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', color: '#4F8EF7' }}>{t.rxGB.toFixed(1)} GB</td>
                  <td style={{ padding: '9px 12px', color: '#A855F7' }}>{t.txGB.toFixed(1)} GB</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 10 }}>{t.lastRekey}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 9, fontFamily: 'monospace' }}>{t.cipher}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'qos' && (
        <div className="card glass-panel" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>QoS — Classes de trafic</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { name: 'Voix/RTC', priority: 'EF', bwPct: 15, color: '#EA580C', dscp: 'EF (46)' },
              { name: 'Gestion réseau', priority: 'CS6', bwPct: 10, color: '#F59E0B', dscp: 'CS6 (48)' },
              { name: 'Métier critique', priority: 'AF41', bwPct: 30, color: '#4F8EF7', dscp: 'AF41 (34)' },
              { name: 'Best Effort', priority: 'BE', bwPct: 45, color: '#6B7280', dscp: 'BE (0)' },
            ].map(cls => (
              <div key={cls.name} className="card glass-panel" style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{cls.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>DSCP: {cls.dscp}</div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${cls.bwPct}%`, height: '100%', background: cls.color, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: cls.color, marginTop: 4, fontWeight: 600 }}>{cls.bwPct}% bande passante réservée</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
