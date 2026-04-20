import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'un switch rack 1U.
 * Layout Cisco-like :
 *   [logo + modèle] [LEDs système + bouton Mode] [24 ou 48 ports RJ45 en 2 rangées]
 *   [uplinks SFP à droite] [LEDs link/act par port]
 *
 * Le nombre de ports est déduit du nom (SG500-28 → 28, Catalyst 2960-S → 24, 3750 → 24).
 */
export default function SwitchPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.cisco;
  const statusLed = statusLedColor(device.status);

  const portCount = detectPortCount(device);
  const sfpCount  = detectSfpCount(device);

  // Dimensions du bloc ports (2 rangées)
  const portsAreaX = 100;
  const portsAreaW = width - portsAreaX - (sfpCount * 10) - 20;
  const portsPerRow = Math.ceil(portCount / 2);
  const portW = Math.min(portsAreaW / portsPerRow, 8);
  const portH = (height - 10) / 2;
  const portsRealW = portW * portsPerRow;

  return (
    <g>
      {/* Corps */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.2} fill={palette.bezel} />
      <rect x={0} y={height - 1.2} width={width} height={1.2} fill={palette.bezel} />

      {/* Bande accent fine */}
      <rect x={0} y={height - 2} width={width} height={0.8} fill={palette.accent} opacity={0.6} />

      {/* Logo + nom modèle */}
      <g transform={`translate(6, ${height / 2})`}>
        <rect x={-1} y={-5} width={34} height={10} fill={palette.accent} rx={1} opacity={0.15} />
        <text
          x={2} y={0}
          dominantBaseline="middle"
          fontSize={8}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={palette.logoText}
          letterSpacing={0.5}
        >
          cisco
        </text>
      </g>
      <text
        x={44} y={height / 2}
        dominantBaseline="middle"
        fontSize={5.5}
        fontFamily="Inter, system-ui, sans-serif"
        fill={palette.labelMid || '#a1a1aa'}
      >
        {shortModel(device.name)}
      </text>

      {/* LEDs système + bouton Mode */}
      <g transform={`translate(78, ${height / 2})`}>
        {['SYST', 'STAT', 'POE'].map((lbl, i) => (
          <g key={lbl} transform={`translate(0, ${(i - 1) * 5})`}>
            <circle cx={0} cy={0} r={1.2} fill={i === 0 ? statusLed : palette.accent} opacity={device.status === 'online' ? 0.9 : 0.2} />
            <text x={3} y={0} dominantBaseline="middle" fontSize={3.2} fill={palette.labelDim || '#71717a'} fontFamily="monospace">{lbl}</text>
          </g>
        ))}
      </g>

      {/* Grille de ports RJ45 (2 rangées) */}
      <g transform={`translate(${portsAreaX}, 5)`}>
        {Array.from({ length: portCount }).map((_, i) => {
          const row = i % 2;
          const col = Math.floor(i / 2);
          const x = col * portW;
          const y = row * portH;
          const active = device.status === 'online' && ((i * 7 + 3) % 4) !== 0;
          return (
            <g key={`port-${i}`}>
              <rect
                x={x + 0.5} y={y + 0.5}
                width={portW - 1} height={portH - 1}
                fill={palette.portFill || '#0a0e14'}
                stroke={palette.stripe}
                strokeWidth={0.3}
              />
              {/* Fausse broche RJ45 (petit trapèze interne) */}
              <rect
                x={x + 1.5} y={y + portH - 2.5}
                width={portW - 3} height={1.2}
                fill="#1a1f28"
              />
              {/* LED port */}
              <circle
                cx={x + portW / 2}
                cy={y + 1.5}
                r={0.55}
                fill={active ? palette.portLed || '#facc15' : '#2a2f37'}
                opacity={active ? 0.9 : 0.5}
              />
            </g>
          );
        })}
      </g>

      {/* Slots SFP à droite */}
      <g transform={`translate(${portsAreaX + portsRealW + 4}, 5)`}>
        {Array.from({ length: sfpCount }).map((_, i) => (
          <g key={`sfp-${i}`} transform={`translate(${i * 9}, 0)`}>
            <rect x={0} y={0} width={8} height={height - 10} fill="#050608" stroke={palette.bezel} strokeWidth={0.4} />
            <rect x={1} y={2} width={6} height={height - 14} fill="#0e1319" />
            <circle cx={4} cy={height - 13} r={0.7} fill={device.status === 'online' ? '#22c55e' : '#2a2f37'} />
          </g>
        ))}
      </g>

      {/* Halo sélection */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}

function detectPortCount(device) {
  const name = (device.name || '').toLowerCase();
  const m = name.match(/(\d{2})(?:-p| port|$|\s)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 8 && n <= 48) return n;
  }
  if (/48/.test(name)) return 48;
  if (/28/.test(name)) return 24;
  return 24;
}

function detectSfpCount(device) {
  const name = (device.name || '').toLowerCase();
  if (/48/.test(name)) return 4;
  if (/10g|nexus/.test(name)) return 4;
  return 2;
}

function shortModel(name) {
  if (!name) return '';
  const cleaned = name.replace(/cisco/i, '').trim();
  return cleaned.length > 20 ? cleaned.substring(0, 18) + '…' : cleaned;
}
