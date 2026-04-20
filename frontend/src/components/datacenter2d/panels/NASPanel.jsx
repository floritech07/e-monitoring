import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'un NAS Synology.
 *
 * Note : le DS1520+ est un boîtier DESKTOP vertical (pas rack) qu'on pose
 * sur une étagère. En vue 2D rack on le couche horizontalement : on voit
 * donc les 5 baies alignées en ligne, logo à gauche, LEDs + bouton power à droite.
 */
export default function NASPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.synology;
  const statusLed = statusLedColor(device.status);

  const bayCount  = detectBayCount(device);
  const bayAreaX  = 52;
  const bayAreaW  = width - bayAreaX - 50;
  const bayW      = bayAreaW / bayCount;

  return (
    <g>
      {/* Corps plastique mat texturé */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={2} />
      {/* Texture subtile : 3 lignes horizontales discrètes */}
      {[0.3, 0.5, 0.7].map((p, i) => (
        <line
          key={i}
          x1={0} x2={width}
          y1={height * p} y2={height * p}
          stroke={palette.stripe} strokeWidth={0.3} opacity={0.4}
        />
      ))}

      {/* Logo Synology */}
      <g transform={`translate(6, ${height / 2})`}>
        <text
          x={0} y={0}
          dominantBaseline="middle"
          fontSize={8}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={palette.logoText}
          letterSpacing={0.5}
        >
          Synology
        </text>
        <text
          x={0} y={8}
          dominantBaseline="middle"
          fontSize={4}
          fill={palette.labelDim || '#71717a'}
          fontFamily="monospace"
        >
          {extractModel(device.name)}
        </text>
      </g>

      {/* Baies disques */}
      <g transform={`translate(${bayAreaX}, 3)`}>
        {Array.from({ length: bayCount }).map((_, i) => {
          const x = i * bayW + 0.5;
          const bayInnerH = height - 6;
          const active = device.status === 'online';
          return (
            <g key={`bay-${i}`}>
              <rect
                x={x} y={0}
                width={bayW - 1} height={bayInnerH}
                fill={palette.driveBay || '#0d0d0d'}
                stroke={palette.bezel}
                strokeWidth={0.4}
                rx={0.5}
              />
              {/* Poignée push-pull centrale */}
              <rect
                x={x + (bayW - 1) / 2 - 0.5}
                y={bayInnerH * 0.15}
                width={1}
                height={bayInnerH * 0.7}
                fill={palette.bezel}
              />
              {/* 2 LEDs baie : status + activité */}
              <circle cx={x + 2} cy={2} r={0.6} fill={active ? '#22c55e' : '#2a2f37'} opacity={0.9} />
              <circle cx={x + 2} cy={4.5} r={0.6} fill={active && (i % 3 !== 0) ? '#f59e0b' : '#2a2f37'} opacity={0.7} />
            </g>
          );
        })}
      </g>

      {/* Bloc LEDs + power à droite */}
      <g transform={`translate(${width - 46}, 2)`}>
        {['STATUS', 'LAN1', 'LAN2'].map((lbl, i) => (
          <g key={lbl} transform={`translate(0, ${i * 4 + 2})`}>
            <circle cx={2} cy={0} r={0.7} fill={i === 0 ? statusLed : '#22c55e'} opacity={device.status === 'online' ? 0.9 : 0.25} />
            <text x={5} y={0} dominantBaseline="middle" fontSize={2.8} fill={palette.labelDim || '#71717a'} fontFamily="monospace">{lbl}</text>
          </g>
        ))}
        {/* Bouton Power */}
        <g transform={`translate(28, 6)`}>
          <circle r={3} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.5} />
          <circle r={1.5} fill="none" stroke="#38bdf8" strokeWidth={0.8} opacity={device.status === 'online' ? 1 : 0.3} />
        </g>
        {/* Port USB façade */}
        <rect x={16} y={height - 8} width={6} height={2.5} fill="#050608" stroke={palette.bezel} strokeWidth={0.3} />
      </g>

      {/* Halo sélection */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={2} />
      )}
    </g>
  );
}

function detectBayCount(device) {
  const name = (device.name || '').toLowerCase();
  const m = name.match(/ds(\d)/);
  if (m) return parseInt(m[1], 10);
  if (/1520/.test(name)) return 5;
  if (/1821/.test(name) || /1823/.test(name)) return 8;
  if (/1621/.test(name)) return 6;
  return 4;
}

function extractModel(name) {
  if (!name) return '';
  const m = name.match(/(DS\d{3,4}\+?|RS\d{3,4}\+?)/i);
  return m ? m[1] : name.length > 14 ? name.substring(0, 12) + '…' : name;
}
