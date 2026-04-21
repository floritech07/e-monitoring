import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'un switch rack 1U (style Cisco SG500 / Catalyst).
 */
export default function SwitchPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  const portCount = detectPortCount(device);
  const sfpCount  = detectSfpCount(device);

  const portsAreaX = 108;
  const portsAreaW = width - portsAreaX - (sfpCount * 11) - 22;
  const portsPerRow = Math.ceil(portCount / 2);
  const portW = Math.min(portsAreaW / portsPerRow, 9);
  const portH = (height - 10) / 2;
  const portsRealW = portW * portsPerRow;

  return (
    <g>
      <defs>
        <linearGradient id={`sw-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#sw-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Bande accent fine */}
      <rect x={0} y={height - 2.5} width={width} height={1} fill={brand.accent} opacity={0.7} />

      {/* Logo Cisco */}
      <g transform={`translate(8, ${height / 2})`}>
        <rect x={-1} y={-6} width={38} height={12} fill={brand.accent} rx={2} opacity={0.15} />
        <text
          x={3} y={0}
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={brand.logoText}
          letterSpacing={0.5}
        >
          cisco
        </text>
      </g>
      <text
        x={50} y={height / 2}
        dominantBaseline="middle"
        fontSize={6}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#a1a1aa"
      >
        {shortModel(device.name)}
      </text>

      {/* LEDs système */}
      <g transform={`translate(86, ${height / 2})`}>
        {['SYST', 'STAT', 'POE'].map((lbl, i) => (
          <g key={lbl} transform={`translate(0, ${(i - 1) * 5.5})`}>
            <circle
              cx={0} cy={0} r={1.3}
              fill={i === 0 ? statusLed : brand.accent}
              className={i === 0 ? ledAnimClass(device.status) : (device.status === 'online' ? 'dc2d-led-activity' : '')}
              opacity={device.status === 'online' ? 0.95 : 0.25}
            />
            <text x={3.5} y={0} dominantBaseline="middle" fontSize={3.4} fill="#a1a1aa" fontFamily="monospace">{lbl}</text>
          </g>
        ))}
      </g>

      {/* Grille de ports RJ45 */}
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
                x={x + 0.6} y={y + 0.6}
                width={portW - 1.2} height={portH - 1.2}
                fill={brand.portFill || '#0a0e14'}
                stroke={brand.stripe}
                strokeWidth={0.3}
                rx={1}
              />
              {/* Broches RJ45 */}
              <rect
                x={x + 1.8} y={y + portH - 2.8}
                width={portW - 3.6} height={1.3}
                fill="#1a1f28"
                rx={0.3}
              />
              {/* LED port */}
              <circle
                cx={x + portW / 2}
                cy={y + 1.7}
                r={0.65}
                fill={active ? (brand.portLed || '#facc15') : '#2a2f37'}
                className={active ? 'dc2d-led-activity' : ''}
                opacity={active ? 0.95 : 0.5}
              />
            </g>
          );
        })}
      </g>

      {/* Slots SFP à droite */}
      <g transform={`translate(${portsAreaX + portsRealW + 6}, 5)`}>
        {Array.from({ length: sfpCount }).map((_, i) => (
          <g key={`sfp-${i}`} transform={`translate(${i * 10}, 0)`}>
            <rect x={0} y={0} width={9} height={height - 10} fill="#050608" stroke={brand.bezel} strokeWidth={0.4} rx={1} />
            <rect x={1} y={2} width={7} height={height - 14} fill="#0e1319" rx={0.5} />
            <circle
              cx={4.5} cy={height - 13} r={0.8}
              fill={device.status === 'online' ? '#22c55e' : '#2a2f37'}
              className={device.status === 'online' ? 'dc2d-led-online' : ''}
            />
          </g>
        ))}
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
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
  return cleaned.length > 22 ? cleaned.substring(0, 20) + '…' : cleaned;
}
