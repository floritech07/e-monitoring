import { useRef, useState, useEffect } from 'react';
import Rack2D from './Rack2D';
import { getPalette } from './constants';
import { useTheme } from './useTheme';
import './datacenter2d.css';

/**
 * Affiche tous les racks d'une salle côte à côte avec scroll horizontal
 * et grille technique en fond — style Netbox / RackTables / Device42.
 * S'adapte au thème clair/sombre via useTheme().
 */
export default function RacksRow2D({
  room,
  selectedRackId,
  selectedDeviceId,
  onSelectRack,
  onSelectDevice,
  onBackgroundClick,
}) {
  const theme = useTheme();
  const P     = getPalette(theme);
  const scrollerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  // Adapter le zoom pour que tous les racks tiennent dans la largeur
  useEffect(() => {
    if (!scrollerRef.current || !room) return;
    const el = scrollerRef.current;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const rackCount = room.racks.length || 1;
      const neededWidth = rackCount * 720;
      if (neededWidth > w * 1.6) setZoom(Math.max(0.55, (w * 1.6) / neededWidth));
      else setZoom(1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [room?.racks?.length]);

  if (!room) return null;

  return (
    <div
      ref={scrollerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: `linear-gradient(180deg, ${P.pageBgTop} 0%, ${P.pageBgBot} 100%)`,
        padding: '28px 24px',
        position: 'relative',
      }}
      onClick={onBackgroundClick}
    >
      {/* Grille de fond technique */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${P.pageGrid} 1px, transparent 1px),
            linear-gradient(90deg, ${P.pageGrid} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
          position: 'relative',
          minWidth: 'max-content',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {room.racks.map((rack) => (
          <div key={rack.id} style={{ flexShrink: 0 }}>
            <Rack2D
              rack={rack}
              devices={rack.devices || []}
              selectedRackId={selectedRackId}
              selectedDeviceId={selectedDeviceId}
              onSelectRack={onSelectRack}
              onSelectDevice={onSelectDevice}
            />
          </div>
        ))}
      </div>

      {/* Légende flottante */}
      <div style={legendStyle(P)}>
        <div style={{ fontSize: 10, color: P.labelMid, marginBottom: 6, letterSpacing: 1, fontWeight: 600 }}>
          VUE RACK · {theme === 'light' ? 'CLAIR' : 'SOMBRE'}
        </div>
        <LegendItem P={P} color={P.ledOnline}   label="En ligne"     pulse />
        <LegendItem P={P} color={P.ledWarning}  label="Avertissement" />
        <LegendItem P={P} color={P.ledCritical} label="Critique"      />
        <LegendItem P={P} color={P.ledOffline}  label="Hors ligne"    />
        <div style={{ height: 1, background: P.badgeBorder, margin: '8px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: P.labelMid }}>
          <span style={{
            display: 'inline-block', width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderBottom: '6px solid #38bdf8',
            opacity: 0.85,
          }} />
          Monté au fond
        </div>
      </div>
    </div>
  );
}

function LegendItem({ P, color, label, pulse }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: P.labelMid, lineHeight: 1.9 }}>
      <span
        className={pulse ? 'dc2d-led-online' : ''}
        style={{
          display: 'inline-block',
          width: 9, height: 9, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 5px ${color}`,
        }}
      />
      {label}
    </div>
  );
}

const legendStyle = (P) => ({
  position: 'fixed',
  right: 340,
  bottom: 28,
  background: P.badgeBg,
  border: `1px solid ${P.badgeBorder}`,
  borderRadius: 8,
  padding: '12px 14px',
  fontFamily: 'Inter, system-ui, sans-serif',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
  backdropFilter: 'blur(8px)',
  zIndex: 10,
});
