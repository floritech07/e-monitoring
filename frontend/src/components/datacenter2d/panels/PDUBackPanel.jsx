import { statusLedColor } from '../constants';

/**
 * Face arrière d'un PDU 1U horizontal (Eaton ePDU, APC AP8xxx, Raritan).
 * Généralement les prises sont sur UNE face (souvent dessus pour une PDU 0U
 * verticale, ou devant pour une 1U). Ici on montre : prises IEC C13 monolignes,
 * un jeu de C19, le câble d'entrée (IEC C20 ou CEE 32A), un afficheur LCD courant,
 * et le port RJ45 management.
 */
export default function PDUBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  const outletCount = 12;
  const outletSpacing = (width - 120) / outletCount;

  return (
    <g>
      <defs>
        <linearGradient id={`pdub-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#pdub-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Câble d'entrée à gauche — gros connecteur IEC C20 ou CEE */}
      <g transform={`translate(3, ${height / 2 - 6})`}>
        <rect x={0} y={0} width={22} height={12} fill="#0a0c0f" stroke={brand.bezel} strokeWidth={0.6} rx={1.5} />
        <rect x={2} y={2} width={18} height={8} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.8} />
        {/* 3 trous gros */}
        <rect x={4} y={4} width={2.5} height={3} fill="#141619" rx={0.3} />
        <rect x={13.5} y={4} width={2.5} height={3} fill="#141619" rx={0.3} />
        <rect x={9} y={7.5} width={3} height={2.2} fill="#141619" rx={0.3} />
        <text x={11} y={height / 2 + 14} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fontWeight={700} fill="#c0c4cb">
          INPUT 32A
        </text>
      </g>

      {/* LCD courant / tension */}
      <g transform={`translate(28, ${height / 2 - 5})`}>
        <rect x={0} y={0} width={28} height={10} fill="#0a1838" stroke="#000" strokeWidth={0.5} rx={1} />
        <rect x={1} y={1} width={26} height={8} fill={brand.lcd || '#1a4a28'} opacity={device.status === 'online' ? 0.92 : 0.2} rx={0.8} />
        <text x={14} y={5} textAnchor="middle" fontSize={3.2} fontFamily="monospace" fontWeight={700}
              fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.3}>
          {device.status === 'online' ? '14.2 A' : '-- A'}
        </text>
        <text x={14} y={8.5} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#a8f0c0" opacity={device.status === 'online' ? 0.85 : 0.2}>
          {device.status === 'online' ? '3.2 kW' : '--'}
        </text>
      </g>

      {/* Rangée de C13 */}
      <g transform={`translate(62, ${height / 2 - 6})`}>
        {Array.from({ length: outletCount }).map((_, i) => (
          <g key={i} transform={`translate(${i * outletSpacing}, 0)`}>
            <rect x={0} y={0} width={outletSpacing - 1.5} height={12} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.8} />
            {/* 3 trous C13 (configuration typique) */}
            <rect x={2} y={2.5} width={1.2} height={1.6} fill="#050608" rx={0.2} />
            <rect x={outletSpacing - 4.5} y={2.5} width={1.2} height={1.6} fill="#050608" rx={0.2} />
            <rect x={(outletSpacing - 1.5) / 2 - 0.5} y={6} width={1.2} height={1} fill="#050608" rx={0.2} />
            {/* Petit LED d'outlet */}
            <circle
              cx={(outletSpacing - 1.5) / 2} cy={10}
              r={0.5}
              fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
              className={device.status === 'online' ? 'dc2d-led-online' : ''}
              opacity={0.7}
            />
          </g>
        ))}
      </g>

      {/* Port management RJ45 */}
      <g transform={`translate(${width - 28}, ${height / 2 - 4})`}>
        <rect x={0} y={0} width={9} height={7} fill="#050608" stroke="#22d3ee" strokeWidth={0.5} rx={0.7} />
        <rect x={1.5} y={1.2} width={6} height={3.5} fill="#1a1d22" />
        <text x={4.5} y={11} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#22d3ee">
          MGMT
        </text>
      </g>

      {/* Bouton reset */}
      <g transform={`translate(${width - 14}, ${height / 2 - 3})`}>
        <circle cx={2} cy={2} r={1.5} fill="#050608" stroke="#ef4444" strokeWidth={0.4} />
        <text x={2} y={10} textAnchor="middle" fontSize={2.3} fontFamily="monospace" fill="#ef4444">
          RST
        </text>
      </g>

      <text x={5} y={height - 2.5} fontSize={3} fontFamily="Inter, system-ui, sans-serif" fontWeight={700}
            fill={brand.logoText} opacity={0.55} letterSpacing={0.5}>
        REAR · {outletCount} × C13
      </text>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
