import { useRef, useState, useEffect } from 'react';
import { RotateCw, ArrowLeftRight } from 'lucide-react';
import Rack2D from './Rack2D';
import { getPalette } from './constants';
import { useTheme } from './useTheme';
import './datacenter2d.css';

/**
 * Affiche tous les racks d'une salle côte à côte avec scroll horizontal
 * et grille technique en fond — style Netbox / RackTables / Device42.
 *
 * Toggle façade/fond : bouton ↺ en haut à droite. Chaque rack peut aussi être
 * flippé individuellement via une touche F quand il est sélectionné (voir footer).
 */
export default function RacksRow2D({
  room,
  selectedRackId,
  selectedDeviceId,
  onSelectRack,
  onSelectDevice,
  onBackgroundClick,
  onMoveDevice,
}) {
  const theme = useTheme();
  const P     = getPalette(theme);
  const scrollerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  // Vue globale façade ('front') ou fond ('back'). Persistée en localStorage.
  const [side, setSide] = useState(() => {
    try { return localStorage.getItem('datacenter.rackSide') || 'front'; }
    catch { return 'front'; }
  });
  useEffect(() => {
    try { localStorage.setItem('datacenter.rackSide', side); } catch {}
  }, [side]);

  // Vue individuelle par rack (override du global). Map rackId → 'front'|'back'
  const [perRackSide, setPerRackSide] = useState({});
  const sideOf = (rackId) => perRackSide[rackId] || side;
  const flipRack = (rackId) => {
    setPerRackSide(prev => ({ ...prev, [rackId]: sideOf(rackId) === 'front' ? 'back' : 'front' }));
  };

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

      {/* Toggle global façade/fond — barre d'outils flottante en haut */}
      <div style={toolbarStyle(P)} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 10, color: P.labelMid, fontWeight: 600, letterSpacing: 0.6, marginRight: 4 }}>
          VUE
        </div>
        <button
          style={side === 'front' ? toolbarBtnActive(P) : toolbarBtn(P)}
          onClick={() => { setSide('front'); setPerRackSide({}); }}
          title="Voir la façade de tous les racks"
        >
          Façade
        </button>
        <button
          style={side === 'back' ? toolbarBtnActive(P) : toolbarBtn(P)}
          onClick={() => { setSide('back'); setPerRackSide({}); }}
          title="Voir le fond de tous les racks (ports / alimentations / câbles)"
        >
          <ArrowLeftRight size={11} style={{ marginRight: 4, verticalAlign: '-1px' }} />
          Fond
        </button>
      </div>

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
        {room.racks.map((rack) => {
          const rackSide = sideOf(rack.id);
          return (
            <div key={rack.id} style={{ flexShrink: 0, position: 'relative' }}>
              <Rack2D
                rack={rack}
                devices={rack.devices || []}
                selectedRackId={selectedRackId}
                selectedDeviceId={selectedDeviceId}
                onSelectRack={onSelectRack}
                onSelectDevice={onSelectDevice}
                onMoveDevice={onMoveDevice}
                side={rackSide}
              />
              {/* Bouton flip individuel sous le rack */}
              <div style={{
                position: 'absolute',
                top: 2, right: 8,
                display: 'flex', alignItems: 'center', gap: 4,
                pointerEvents: 'auto',
              }}>
                <button
                  style={flipBtn(P)}
                  onClick={(e) => { e.stopPropagation(); flipRack(rack.id); }}
                  title={`Retourner ce rack (actuellement : ${rackSide === 'back' ? 'fond' : 'façade'})`}
                >
                  <RotateCw size={10} />
                  {rackSide === 'back' ? 'FOND' : 'FAÇADE'}
                </button>
              </div>
            </div>
          );
        })}
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
          Face opposée
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

// ─── Styles ─────────────────────────────────────────────────────────────────

const toolbarStyle = (P) => ({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 12px',
  background: P.badgeBg,
  border: `1px solid ${P.badgeBorder}`,
  borderRadius: 8,
  marginBottom: 18,
  width: 'fit-content',
  boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(6px)',
});

const toolbarBtn = (P) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '5px 12px',
  fontSize: 11, fontWeight: 600,
  background: 'transparent',
  border: 'none',
  color: P.labelMid,
  borderRadius: 5,
  cursor: 'pointer',
  transition: 'background 0.12s',
});
const toolbarBtnActive = (P) => ({
  ...toolbarBtn(P),
  background: '#3274d9',
  color: '#ffffff',
});

const flipBtn = (P) => ({
  display: 'inline-flex', alignItems: 'center', gap: 3,
  padding: '3px 6px',
  fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
  background: P.badgeBg,
  border: `1px solid ${P.badgeBorder}`,
  color: P.labelMid,
  borderRadius: 4,
  cursor: 'pointer',
  opacity: 0.85,
});

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
