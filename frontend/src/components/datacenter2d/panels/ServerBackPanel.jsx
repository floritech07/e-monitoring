import { statusLedColor } from '../constants';

/**
 * Face arrière d'un serveur rack 1U / 2U (style HPE ProLiant DL380, Dell PowerEdge R640,
 * Huawei FusionServer, Lenovo ThinkSystem).
 *
 * Éléments physiques représentés :
 *  - 2 alimentations hot-swap (PSU1/PSU2) avec prise IEC C14 + LED
 *  - Grille de ventilation fans gauche
 *  - Motherboard I/O : 4× RJ45 1GbE, 1× RJ45 iLO/iDRAC, 1× VGA, 2× USB
 *  - 2U : rangée de slots PCIe en bas
 */
export default function ServerBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const is2U = (device.uSize || 1) >= 2;
  const statusLed = statusLedColor(device.status, theme);

  return (
    <g>
      <defs>
        <linearGradient id={`srvb-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      {/* Carrosserie */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#srvb-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Grille aération gauche */}
      <g>
        {Array.from({ length: 14 }).map((_, i) =>
          Array.from({ length: Math.max(2, Math.floor((height - 6) / 4)) }).map((_, j) => (
            <circle
              key={`vent-${i}-${j}`}
              cx={4 + i * 4.5}
              cy={4 + j * 4}
              r={0.9}
              fill="#050608"
              opacity={0.85}
            />
          ))
        )}
      </g>

      {/* PSU 1 + PSU 2 à droite */}
      <g transform={`translate(${width - 108}, 2.5)`}>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${i * 52}, 0)`}>
            <rect x={0} y={0} width={48} height={height - 5} fill="#141619" stroke={brand.bezel} strokeWidth={0.6} rx={2} />
            {/* IEC C14 */}
            <g transform={`translate(3, 3)`}>
              <rect x={0} y={0} width={13} height={7} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.6} />
              <rect x={2} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
              <rect x={9} y={2} width={2} height={2.5} fill="#050608" rx={0.3} />
              <rect x={5.5} y={4.5} width={2} height={1.8} fill="#050608" rx={0.3} />
            </g>
            <text x={18} y={8.5} fontSize={3.5} fontFamily="monospace" fontWeight={700} fill="#c0c4cb">
              PSU{i + 1}
            </text>
            {/* Grand ventilateur rond */}
            <circle cx={35} cy={height / 2} r={Math.min(7, height / 3)} fill="none" stroke="#2a2f37" strokeWidth={0.5} />
            <circle cx={35} cy={height / 2} r={Math.min(5.5, height / 3.5)} fill="none" stroke="#2a2f37" strokeWidth={0.3} opacity={0.7} />
            <circle cx={35} cy={height / 2} r={1.2} fill="#0a0c0f" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <line
                key={a}
                x1={35}
                y1={height / 2}
                x2={35 + Math.cos((a * Math.PI) / 180) * Math.min(6, height / 3.5)}
                y2={height / 2 + Math.sin((a * Math.PI) / 180) * Math.min(6, height / 3.5)}
                stroke="#2a2f37"
                strokeWidth={0.4}
                opacity={0.6}
              />
            ))}
            {/* LED PSU */}
            <circle
              cx={10} cy={height - 8} r={1}
              fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
              className={device.status === 'online' ? 'dc2d-led-online' : ''}
              opacity={0.95}
            />
          </g>
        ))}
      </g>

      {/* Zone I/O centrale */}
      <g transform={`translate(${width * 0.31}, ${is2U ? 3.5 : (height - 11) / 2})`}>
        {/* 4 NICs RJ45 */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${i * 10.5}, 0)`}>
            <rect x={0} y={0} width={9.5} height={8} fill="#050608" stroke="#2a2f37" strokeWidth={0.45} rx={0.7} />
            <rect x={1.5} y={1.2} width={6.5} height={4.2} fill="#1a1d22" />
            <circle
              cx={2.8} cy={6.7} r={0.55}
              fill={device.status === 'online' ? P.ledOnline : '#2a2f37'}
              className={device.status === 'online' ? 'dc2d-led-activity' : ''}
            />
            <circle cx={6.7} cy={6.7} r={0.55} fill="#facc15" opacity={device.status === 'online' ? 0.7 : 0.2} />
          </g>
        ))}
        {/* iLO / iDRAC management */}
        <g transform={`translate(48, 0)`}>
          <rect x={0} y={0} width={9.5} height={8} fill="#050608" stroke="#22d3ee" strokeWidth={0.55} rx={0.7} />
          <rect x={1.5} y={1.2} width={6.5} height={4.2} fill="#1a1d22" />
          <text x={4.7} y={14.5} textAnchor="middle" fontSize={3} fontFamily="monospace" fill="#22d3ee" fontWeight={700}>
            {brandKey === 'dell' ? 'iDRAC' : brandKey === 'huawei' ? 'iBMC' : 'iLO'}
          </text>
        </g>
        {/* VGA DB15 */}
        <g transform={`translate(62, 1)`}>
          <path d="M 0 1 L 13 1 L 12 6 L 1 6 Z" fill="#050608" stroke="#2a2f37" strokeWidth={0.4} />
          <text x={6.5} y={14} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fill="#8e93a0">VGA</text>
        </g>
        {/* 2× USB */}
        <g transform={`translate(79, 1)`}>
          <rect x={0} y={0} width={7} height={2.8} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.3} />
          <rect x={0} y={3.6} width={7} height={2.8} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.3} />
          <text x={3.5} y={14} textAnchor="middle" fontSize={2.8} fontFamily="monospace" fill="#8e93a0">USB</text>
        </g>
      </g>

      {/* 2U : rangée slots PCIe */}
      {is2U && (
        <g transform={`translate(${width * 0.31}, ${height - 10})`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 17}, 0)`}>
              <rect x={0} y={0} width={15} height={6} fill="#0a0c0f" stroke={brand.bezel} strokeWidth={0.4} rx={0.5} />
              {/* 2 des 6 ont une carte PCIe */}
              {(i === 0 || i === 3) && (
                <>
                  <rect x={1.5} y={1.5} width={12} height={3} fill="#1a1d22" />
                  <circle cx={3} cy={3} r={0.4} fill={P.ledOnline} opacity={device.status === 'online' ? 0.85 : 0.3} />
                </>
              )}
            </g>
          ))}
        </g>
      )}

      {/* Label marque + REAR */}
      <text x={5} y={height - 2.5} fontSize={3.2} fontFamily="Inter, system-ui, sans-serif" fontWeight={700}
            fill={brand.logoText} opacity={0.55} letterSpacing={0.4}>
        REAR
      </text>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
