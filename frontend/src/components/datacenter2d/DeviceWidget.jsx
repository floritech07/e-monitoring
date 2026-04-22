import { useState, useEffect } from 'react';
import { X, Trash2, ExternalLink, RotateCw, Zap, Network, Server, Cpu, HardDrive } from 'lucide-react';
import Device2D from './Device2D';
import { getPalette, statusLedColor, detectBrand } from './constants';
import { useTheme } from './useTheme';

/**
 * Widget flottant qui apparaît au clic sur un équipement — remplace l'ancien
 * panneau latéral.
 *
 *  • Centré à l'écran, 640×430 px, backdrop flouté
 *  • Aperçu façade + fond côte à côte (SVG fidèle)
 *  • Bloc identité (marque / modèle / série / hostname / IP)
 *  • Bloc position (rack / U / slot / montage)
 *  • Bouton « Détails complets → » qui ouvre /datacenter/device/:id
 *  • Bouton « Retirer » qui supprime l'équipement
 */
export default function DeviceWidget({ device, rack, typeMeta, onClose, onDelete, onOpenDetails }) {
  const theme = useTheme();
  const P     = getPalette(theme);
  const statusColor = statusLedColor(device.status, theme);
  const brandKey = detectBrand(device);

  // Fermeture clavier (Echap)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Rendu SVG miniature — même rendu que dans le rack, mais dimensionné pour tenir dans le widget
  const previewW = 280;
  const previewH = Math.max(52, Math.min(140, (device.uSize || 1) * 28));

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={widgetStyle(P, theme)} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={headerStyle(P)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 6, height: 28, borderRadius: 3,
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}80`,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 16, fontWeight: 700, color: P.labelLight,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {device.name}
              </div>
              <div style={{ fontSize: 11, color: P.labelDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {typeMeta?.label || device.type} · {brandKey !== 'generic' ? brandKey.toUpperCase() : 'Générique'} · {rack?.name}
              </div>
            </div>
          </div>
          <button style={closeBtnStyle(P)} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Aperçus façade + fond */}
        <div style={previewRowStyle(P)}>
          <PreviewCard P={P} label="Façade" device={device} side="front" theme={theme} w={previewW} h={previewH} />
          <PreviewCard P={P} label="Fond"   device={device} side="back"  theme={theme} w={previewW} h={previewH} />
        </div>

        {/* Blocs d'infos */}
        <div style={infosGridStyle}>
          <InfoBlock P={P} title="Identité">
            <Row P={P} k="Constructeur" v={device.manufacturer || '—'} />
            <Row P={P} k="Modèle"       v={device.model || '—'} />
            <Row P={P} k="Série"        v={device.serial || '—'} />
            <Row P={P} k="Hostname"     v={device.hostname || '—'} />
            <Row P={P} k="IP mgmt"      v={device.ip || '—'} mono />
          </InfoBlock>

          <InfoBlock P={P} title="Position physique">
            <Row P={P} k="Rack"        v={rack?.name || '—'} />
            <Row P={P} k="Unité"       v={`U${device.uStart}${device.uSize > 1 ? `–U${device.uStart + device.uSize - 1}` : ''} (${device.uSize}U)`} mono />
            <Row P={P} k="Largeur"     v={device.slot === 'left' ? '½ gauche' : device.slot === 'right' ? '½ droite' : 'Pleine'} />
            <Row P={P} k="Profondeur"  v={device.depth === 'front' ? 'Façade' : device.depth === 'back' ? 'Fond' : 'Pleine'} />
            <Row P={P} k="Montage"     v={device.mounting === 'shelf' ? 'Étagère' : device.mounting === 'loose' ? 'Posé' : 'Rails 19″'} />
          </InfoBlock>
        </div>

        {/* Status */}
        <div style={statusBarStyle(P, device.status)}>
          <span className={`dc2d-led-${statusAnim(device.status)}`}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: statusColor,
                  boxShadow: `0 0 6px ${statusColor}`,
                  display: 'inline-block',
                }} />
          <span style={{ fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{device.status}</span>
          <span style={{ color: P.labelDim, marginLeft: 'auto', fontSize: 10 }}>
            SBEE · temps réel
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={primaryBtnStyle} onClick={() => onOpenDetails?.(device)}>
            <ExternalLink size={14} />
            Détails complets & monitoring
          </button>
          <button style={dangerBtnStyle} onClick={onDelete}>
            <Trash2 size={13} />
            Retirer
          </button>
        </div>

        {/* Info astuce drag */}
        <div style={{ marginTop: 10, fontSize: 10, color: P.labelDim, textAlign: 'center', lineHeight: 1.5 }}>
          💡 Glissez l'équipement dans le rack pour le déplacer vers un autre U libre.
          Cliquez sur <kbd style={kbdStyle(P)}>↺ FAÇADE/FOND</kbd> en haut du rack pour voir sa face arrière.
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function PreviewCard({ P, label, device, side, theme, w, h }) {
  return (
    <div style={{
      flex: 1,
      border: `1px solid ${P.badgeBorder}`,
      borderRadius: 8,
      padding: 8,
      background: theme === 'light' ? '#f8fafc' : '#0a0c10',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 0.6,
        color: P.labelDim, textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>{side === 'back' ? <><RotateCw size={9} style={{ verticalAlign: -1, marginRight: 3 }} /> {label}</> : label}</span>
        <span style={{ color: side === 'back' ? '#22d3ee' : '#a3e635', fontSize: 8 }}>
          {side === 'back' ? 'REAR' : 'FRONT'}
        </span>
      </div>
      <svg width={w - 20} height={h} viewBox={`0 0 ${w - 20} ${h}`} style={{ display: 'block' }}>
        <Device2D
          device={device}
          x={0} y={0}
          width={w - 20}
          height={h}
          theme={theme}
          side={side}
          selected={false}
        />
      </svg>
    </div>
  );
}

function InfoBlock({ P, title, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 0.7,
        color: P.labelDim, textTransform: 'uppercase', marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{ background: P.badgeBg, border: `1px solid ${P.badgeBorder}`, borderRadius: 6, padding: '6px 10px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ P, k, v, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '3px 0', fontSize: 11,
      borderBottom: `1px dashed ${P.badgeBorder}`,
    }}>
      <span style={{ color: P.labelDim }}>{k}</span>
      <span style={{ color: P.labelLight, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {v}
      </span>
    </div>
  );
}

function statusAnim(status) {
  if (status === 'online') return 'online';
  if (status === 'warning') return 'warning';
  if (status === 'critical') return 'critical';
  return '';
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const backdropStyle = {
  position: 'fixed', inset: 0, zIndex: 2100,
  background: 'rgba(5, 10, 18, 0.55)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  animation: 'fadeIn 0.18s ease-out',
};

const widgetStyle = (P, theme) => ({
  width: 680,
  maxWidth: 'calc(100vw - 40px)',
  maxHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  background: theme === 'light' ? '#ffffff' : '#12151b',
  border: `1px solid ${P.badgeBorder}`,
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.25)',
  fontFamily: 'Inter, system-ui, sans-serif',
});

const headerStyle = (P) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: 14,
  paddingBottom: 12,
  borderBottom: `1px solid ${P.badgeBorder}`,
});

const closeBtnStyle = (P) => ({
  background: 'transparent', border: `1px solid ${P.badgeBorder}`,
  color: P.labelMid, cursor: 'pointer',
  width: 28, height: 28, borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const previewRowStyle = (P) => ({
  display: 'flex', gap: 10, marginBottom: 14,
});

const infosGridStyle = {
  display: 'flex', gap: 10, marginBottom: 10,
};

const statusBarStyle = (P, status) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 12px',
  background: statusBgFor(status),
  border: `1px solid ${statusBorderFor(status)}`,
  borderRadius: 6,
  fontSize: 11,
  color: P.labelLight,
});

function statusBgFor(s) {
  if (s === 'online')   return 'rgba(34, 197, 94, 0.10)';
  if (s === 'warning')  return 'rgba(245, 158, 11, 0.12)';
  if (s === 'critical') return 'rgba(239, 68, 68, 0.12)';
  return 'rgba(100, 116, 139, 0.10)';
}
function statusBorderFor(s) {
  if (s === 'online')   return 'rgba(34, 197, 94, 0.35)';
  if (s === 'warning')  return 'rgba(245, 158, 11, 0.40)';
  if (s === 'critical') return 'rgba(239, 68, 68, 0.40)';
  return 'rgba(100, 116, 139, 0.30)';
}

const primaryBtnStyle = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 14px',
  background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
  border: 'none',
  color: '#ffffff',
  borderRadius: 8,
  fontSize: 12, fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
};

const dangerBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '10px 14px',
  background: 'transparent',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  color: '#ef4444',
  borderRadius: 8,
  fontSize: 11, fontWeight: 600,
  cursor: 'pointer',
};

const kbdStyle = (P) => ({
  padding: '1px 5px',
  border: `1px solid ${P.badgeBorder}`,
  borderRadius: 3,
  fontFamily: 'monospace',
  fontSize: 9,
  background: P.badgeBg,
});
