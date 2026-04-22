import { statusLedColor } from '../constants';

/**
 * Face arrière générique — fallback pour les types qui n'ont pas de back-panel
 * dédié (routeur, firewall, HSM, librairie de bandes, étagère, etc.).
 *
 * Rendu minimaliste mais identifiable : alimentation IEC C14 + port réseau
 * management + grille de ventilation + label REAR.
 */
export default function GenericBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  return (
    <g>
      <defs>
        <linearGradient id={`genb-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#genb-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Grille ventilation à gauche (zone large) */}
      <g>
        {Array.from({ length: 20 }).map((_, i) =>
          Array.from({ length: Math.max(2, Math.floor((height - 8) / 4)) }).map((_, j) => (
            <circle
              key={`v-${i}-${j}`}
              cx={4 + i * 4}
              cy={4 + j * 4}
              r={0.8}
              fill="#050608"
              opacity={0.8}
            />
          ))
        )}
      </g>

      {/* PSU à droite */}
      <g transform={`translate(${width - 52}, 3)`}>
        <rect x={0} y={0} width={50} height={height - 6} fill="#141619" stroke={brand.bezel} strokeWidth={0.5} rx={1.5} />
        <g transform={`translate(4, ${(height - 6) / 2 - 4})`}>
          <rect x={0} y={0} width={13} height={7} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.6} />
          <rect x={2} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
          <rect x={9} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
          <rect x={5.5} y={4.5} width={2} height={1.8} fill="#050608" rx={0.3} />
        </g>
        <text x={20} y={(height - 6) / 2 + 1} fontSize={3.2} fontFamily="monospace" fontWeight={700} fill="#c0c4cb">
          PSU · AC
        </text>
        <circle
          cx={44} cy={(height - 6) / 2}
          r={1}
          fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
          className={device.status === 'online' ? 'dc2d-led-online' : ''}
        />
      </g>

      {/* Port mgmt RJ45 */}
      <g transform={`translate(${width - 70}, ${height / 2 - 4})`}>
        <rect x={0} y={0} width={9} height={7} fill="#050608" stroke="#22d3ee" strokeWidth={0.5} rx={0.7} />
        <rect x={1.5} y={1.2} width={6} height={3.5} fill="#1a1d22" />
        <text x={4.5} y={12} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#22d3ee">
          MGMT
        </text>
      </g>

      <text x={width - 105} y={height - 2.5} fontSize={3.2} fontFamily="monospace" fontWeight={700}
            fill={brand.logoText} opacity={0.55} letterSpacing={0.4}>
        {device.type || 'DEVICE'} · REAR
      </text>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
