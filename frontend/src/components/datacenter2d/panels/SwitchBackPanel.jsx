import { statusLedColor } from '../constants';

/**
 * Face arrière d'un switch rack (Cisco Catalyst 9300 / SG500 / Meraki / HPE OfficeConnect).
 *
 * Les ports réseau sont généralement en FAÇADE pour ce type d'équipement — la
 * face arrière porte : 2 alimentations redondantes (module FRU), un port console
 * management, des grilles de ventilation et éventuellement les ports de stacking.
 */
export default function SwitchBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);
  const isCisco = brandKey === 'cisco';

  return (
    <g>
      <defs>
        <linearGradient id={`swb-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#swb-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {isCisco && <rect x={0} y={2} width={2.5} height={height - 4} fill={brand.accent} rx={1.2} opacity={0.9} />}

      {/* 2 PSUs hot-swap à gauche */}
      <g transform={`translate(6, 3)`}>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${i * 54}, 0)`}>
            <rect x={0} y={0} width={50} height={height - 6} fill="#141619" stroke={brand.bezel} strokeWidth={0.5} rx={2} />
            {/* IEC C14 */}
            <g transform={`translate(4, ${(height - 6) / 2 - 4})`}>
              <rect x={0} y={0} width={13} height={7} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.6} />
              <rect x={2} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
              <rect x={9} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
              <rect x={5.5} y={4.5} width={2} height={1.8} fill="#050608" rx={0.3} />
            </g>
            <text x={20} y={(height - 6) / 2 - 1} fontSize={3.5} fontFamily="monospace" fontWeight={700} fill="#c0c4cb">
              PSU-{i === 0 ? 'A' : 'B'}
            </text>
            <text x={20} y={(height - 6) / 2 + 3.5} fontSize={2.8} fontFamily="monospace" fill="#8e93a0">
              AC 100-240V
            </text>
            {/* LED PSU */}
            <circle
              cx={44} cy={(height - 6) / 2}
              r={1.1}
              fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
              className={device.status === 'online' ? 'dc2d-led-online' : ''}
            />
          </g>
        ))}
      </g>

      {/* Zone centrale : grilles de ventilation */}
      <g transform={`translate(${width * 0.48}, 3)`}>
        <rect x={0} y={0} width={width * 0.27} height={height - 6} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={1.5} />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={3 + i * 5}
            y={2.5}
            width={2}
            height={height - 11}
            fill="#050608"
            rx={0.8}
          />
        ))}
        <text x={width * 0.135} y={height - 2.5} textAnchor="middle" fontSize={3} fontFamily="monospace" fill="#8e93a0">
          FANS
        </text>
      </g>

      {/* Console + stacking à droite */}
      <g transform={`translate(${width - 58}, 3)`}>
        {/* Console RJ45 */}
        <rect x={0} y={2} width={10} height={8} fill="#050608" stroke="#2a2f37" strokeWidth={0.45} rx={0.7} />
        <rect x={1.5} y={3.2} width={7} height={4.2} fill="#1a1d22" />
        <text x={5} y={height - 4} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#8e93a0">
          CONSOLE
        </text>
        {/* USB mgmt */}
        <rect x={14} y={3} width={7} height={3} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.3} />
        <text x={17.5} y={height - 4} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#8e93a0">
          USB
        </text>
        {/* Stacking ports */}
        <g transform={`translate(26, 2)`}>
          <rect x={0} y={0} width={24} height={10} fill="#050608" stroke={brand.accent} strokeWidth={0.5} rx={1} />
          <rect x={1.5} y={1.5} width={9.5} height={7} fill="#1a1d22" rx={0.5} />
          <rect x={13} y={1.5} width={9.5} height={7} fill="#1a1d22" rx={0.5} />
          <text x={12} y={height - 4} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill={brand.accent}>
            STACK
          </text>
        </g>
      </g>

      {/* Mention REAR */}
      <text x={5} y={height - 2.5} fontSize={3} fontFamily="Inter, system-ui, sans-serif" fontWeight={700}
            fill={brand.logoText} opacity={0.55} letterSpacing={0.5}>
        REAR
      </text>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
