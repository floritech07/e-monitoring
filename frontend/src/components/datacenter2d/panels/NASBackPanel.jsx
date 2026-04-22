import { statusLedColor } from '../constants';

/**
 * Face arrière d'un NAS de bureau ou rack (Synology DS / RS, QNAP, WD).
 *  - Gros ventilateur(s) circulaire(s) dominant la face
 *  - 2× RJ45 GbE (parfois 1× 10GbE en module)
 *  - 2× USB 3.0 + 1× eSATA
 *  - Prise alim IEC C14 + bouton reset + kensington
 */
export default function NASBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  const fanR = Math.min(height / 2 - 3, 20);

  return (
    <g>
      <defs>
        <linearGradient id={`nasb-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#nasb-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Gros ventilateur principal */}
      <g transform={`translate(${width * 0.22}, ${height / 2})`}>
        <circle r={fanR} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.6} />
        <circle r={fanR - 2} fill="none" stroke="#2a2f37" strokeWidth={0.3} opacity={0.6} />
        <circle r={2} fill="#141619" stroke="#2a2f37" strokeWidth={0.3} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <path
              key={a}
              d={`M ${Math.cos(rad) * 2} ${Math.sin(rad) * 2} Q ${Math.cos(rad + 0.4) * (fanR / 2)} ${Math.sin(rad + 0.4) * (fanR / 2)} ${Math.cos(rad + 0.2) * (fanR - 1)} ${Math.sin(rad + 0.2) * (fanR - 1)}`}
              stroke="#2a2f37"
              strokeWidth={0.6}
              fill="none"
              opacity={0.7}
            />
          );
        })}
      </g>

      {/* Zone I/O à droite */}
      <g transform={`translate(${width * 0.48}, 3)`}>
        {/* 2× RJ45 */}
        <g transform={`translate(0, 2)`}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 11}, 0)`}>
              <rect x={0} y={0} width={10} height={8} fill="#050608" stroke="#2a2f37" strokeWidth={0.45} rx={0.7} />
              <rect x={1.5} y={1.2} width={7} height={4.2} fill="#1a1d22" />
              <circle
                cx={2.8} cy={6.5} r={0.55}
                fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
                className={device.status === 'online' ? 'dc2d-led-activity' : ''}
              />
              <circle cx={7.2} cy={6.5} r={0.55} fill="#facc15" opacity={device.status === 'online' ? 0.7 : 0.2} />
            </g>
          ))}
          <text x={11} y={height - 7} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fill="#8e93a0">
            LAN 1/2
          </text>
        </g>

        {/* 2× USB 3.0 */}
        <g transform={`translate(28, 2)`}>
          {[0, 1].map((i) => (
            <rect
              key={i}
              x={0} y={i * 4}
              width={9} height={3.2}
              fill="#050608"
              stroke="#38bdf8"
              strokeWidth={0.4}
              rx={0.3}
            />
          ))}
          <text x={4.5} y={height - 7} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fill="#38bdf8">
            USB 3.0
          </text>
        </g>

        {/* eSATA */}
        <g transform={`translate(42, 2)`}>
          <rect x={0} y={1.5} width={10} height={4.5} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.4} />
          <text x={5} y={height - 7} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fill="#8e93a0">
            eSATA
          </text>
        </g>

        {/* Reset + Kensington */}
        <g transform={`translate(58, 2)`}>
          <circle cx={2} cy={3} r={1.2} fill="#050608" stroke="#2a2f37" strokeWidth={0.3} />
          <text x={2} y={height - 7} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#8e93a0">
            RST
          </text>
          <rect x={6} y={1.5} width={5} height={3.5} fill="#050608" stroke="#2a2f37" strokeWidth={0.3} rx={1.8} />
          <text x={8.5} y={height - 7} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#8e93a0">
            KSG
          </text>
        </g>
      </g>

      {/* Prise alim à droite */}
      <g transform={`translate(${width - 22}, ${height / 2 - 5})`}>
        <rect x={0} y={0} width={17} height={10} fill="#141619" stroke={brand.bezel} strokeWidth={0.5} rx={1.2} />
        <rect x={2} y={2} width={13} height={6.5} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.3} rx={0.5} />
        <rect x={4} y={4} width={2} height={2} fill="#050608" rx={0.2} />
        <rect x={11} y={4} width={2} height={2} fill="#050608" rx={0.2} />
        <rect x={7.5} y={6} width={2} height={1.3} fill="#050608" rx={0.2} />
      </g>

      {/* REAR */}
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
