import { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Trash2, Filter } from 'lucide-react';
import { api } from '../api';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `il y a ${s}s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)}m`;
  return `il y a ${Math.floor(s / 3600)}h`;
}

const levelIcon = {
  critical: <AlertTriangle size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />,
};

const levelLabel = {
  critical: 'Critique',
  warning: 'Attention',
  info: 'Info',
};

export default function AlertsPage({ alerts }) {
  const [filter, setFilter] = useState('all'); // all | critical | warning | info
  const [cleared, setCleared] = useState(false);

  const allAlerts = alerts || [];
  const filtered = filter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.level === filter);

  const criticalCount = allAlerts.filter(a => a.level === 'critical').length;
  const warningCount = allAlerts.filter(a => a.level === 'warning').length;

  async function handleClear() {
    try {
      await api.clearAlerts();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch { }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Alertes & Événements</div>
          <div className="page-subtitle">{allAlerts.length} alerte(s) active(s)</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {criticalCount > 0 && <span className="status-badge offline">{criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>}
          {warningCount > 0 && <span className="status-badge warning">{warningCount} attention</span>}
          <button className="btn btn-ghost btn-sm" onClick={handleClear}>
            <Trash2 size={13} /> Tout effacer
          </button>
        </div>
      </div>

      {cleared && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,211,163,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} /> Alertes effacées avec succès
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['all', 'Toutes'], ['critical', 'Critiques'], ['warning', 'Attention'], ['info', 'Info']].map(([val, label]) => (
          <button
            key={val}
            className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 64 }}>
            <CheckCircle size={40} style={{ color: 'var(--success)', opacity: 0.5 }} />
            <div>Aucune alerte {filter !== 'all' ? `de niveau "${filter}"` : 'active'}</div>
          </div>
        ) : (
          <table className="vm-table">
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Catégorie</th>
                <th>Message</th>
                <th>Source</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(alert => (
                <tr key={alert.id}>
                  <td>
                    <span className={`status-badge ${alert.level === 'critical' ? 'offline' : alert.level === 'warning' ? 'warning' : 'online'}`}>
                      {levelIcon[alert.level]} {levelLabel[alert.level]}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{alert.category}</td>
                  <td style={{ maxWidth: 360 }}>{alert.message}</td>
                  <td><span className="mono text-sm text-muted">{alert.source}</span></td>
                  <td><span className="text-muted text-sm">{timeAgo(alert.timestamp)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
