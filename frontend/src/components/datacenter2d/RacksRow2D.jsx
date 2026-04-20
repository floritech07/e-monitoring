import { useRef, useState, useEffect } from 'react';
import Rack2D from './Rack2D';
import { PALETTE } from './constants';

/**
 * Affiche tous les racks d'une salle côte à côte avec scroll horizontal
 * (vue classique "rangée de racks" style Netbox / RackTables / Device42).
 *
 * Un clic dans le vide désélectionne ; clic sur un rack ou un équipement
 * remonte la sélection au parent.
 */
export default function RacksRow2D({
  room,
  selectedRackId,
  selectedDeviceId,
  onSelectRack,
  onSelectDevice,
  onBackgroundClick,
}) {
  const scrollerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  // Adapter le zoom pour que tous les racks tiennent dans la largeur dispo
  useEffect(() => {
    if (!scrollerRef.current || !room) return;
    const el = scrollerRef.current;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const rackCount = room.racks.length || 1;
      // Chaque rack fait ~700px + 20px margin. Si ça rentre pas on zoom out.
      const neededWidth = rackCount * 720;
      if (neededWidth > w * 1.8) setZoom(Math.max(0.55, w * 1.8 / neededWidth));
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
        background: 'linear-gradient(180deg, #0b0d11 0%, #050608 100%)',
        padding: '24px 20px',
        position: 'relative',
      }}
      onClick={onBackgroundClick}
    >
      {/* Grille de fond (effet dalle technique) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(35, 40, 47, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(35, 40, 47, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 20,
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
      <div style={legendStyle}>
        <div style={{ fontSize: 10, color: PALETTE.labelMid, marginBottom: 4, letterSpacing: 1 }}>
          VUE RACK
        </div>
        <LegendItem color="#22c55e" label="En ligne" />
        <LegendItem color="#f59e0b" label="Avertissement" />
        <LegendItem color="#ef4444" label="Critique" />
        <LegendItem color="#64748b" label="Hors ligne" />
        <div style={{ height: 1, background: '#2c3235', margin: '6px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: PALETTE.labelMid }}>
          <span style={{
            display: 'inline-block', width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderBottom: '5px solid #38bdf8',
            opacity: 0.8,
          }} />
          Monté au fond
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: PALETTE.labelMid, lineHeight: 1.8 }}>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
      {label}
    </div>
  );
}

const legendStyle = {
  position: 'fixed',
  right: 320,
  bottom: 24,
  background: 'rgba(10, 12, 15, 0.92)',
  border: '1px solid #2c3235',
  borderRadius: 4,
  padding: '10px 12px',
  fontFamily: 'Inter, system-ui, sans-serif',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(6px)',
  zIndex: 10,
};
