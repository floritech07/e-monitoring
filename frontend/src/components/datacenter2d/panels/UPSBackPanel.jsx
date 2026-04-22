import { statusLedColor } from '../constants';

/**
 * Face arrière d'un UPS rack (APC Smart-UPS SRT, Eaton 9PX, Socomec ITYS).
 *
 * On y trouve le bloc de sorties (classiquement 8× IEC C13 + 2× IEC C19)
 * sectionné par banques commutables, l'entrée IEC C20 ou bornier, un port
 * réseau SNMP, un port série RJ45, un port USB et le connecteur batterie externe.
 */
export default function UPSBackPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  return (
    <g>
      <defs>
        <linearGradient id={`upsb-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#upsb-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Grille ventilation à gauche */}
      <g>
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={4 + i * 3}
            y={3}
            width={1.4}
            height={height - 6}
            fill="#050608"
            opacity={0.75}
            rx={0.4}
          />
        ))}
      </g>

      {/* Bloc sorties IEC C13 — 2 banques de 4 (commutables) */}
      <g transform={`translate(32, 3)`}>
        <text x={0} y={3.5} fontSize={3} fontFamily="monospace" fontWeight={700} fill="#c0c4cb" letterSpacing={0.4}>
          BANK 1 · OUT
        </text>
        <g transform={`translate(0, 5)`}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${i * 12}, 0)`}>
              <rect x={0} y={0} width={10} height={Math.min(10, height - 12)} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.8} />
              {/* 3 trous C13 */}
              <rect x={2} y={2} width={1.3} height={1.8} fill="#050608" rx={0.2} />
              <rect x={6.5} y={2} width={1.3} height={1.8} fill="#050608" rx={0.2} />
              <rect x={4.2} y={5} width={1.5} height={1.2} fill="#050608" rx={0.2} />
            </g>
          ))}
        </g>
      </g>

      <g transform={`translate(${32 + 4 * 12 + 8}, 3)`}>
        <text x={0} y={3.5} fontSize={3} fontFamily="monospace" fontWeight={700} fill="#c0c4cb" letterSpacing={0.4}>
          BANK 2
        </text>
        <g transform={`translate(0, 5)`}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${i * 12}, 0)`}>
              <rect x={0} y={0} width={10} height={Math.min(10, height - 12)} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.8} />
              <rect x={2} y={2} width={1.3} height={1.8} fill="#050608" rx={0.2} />
              <rect x={6.5} y={2} width={1.3} height={1.8} fill="#050608" rx={0.2} />
              <rect x={4.2} y={5} width={1.5} height={1.2} fill="#050608" rx={0.2} />
            </g>
          ))}
        </g>
      </g>

      {/* 2× IEC C19 (plus large, forte puissance) */}
      <g transform={`translate(${32 + 8 * 12 + 12}, 3)`}>
        <text x={0} y={3.5} fontSize={3} fontFamily="monospace" fontWeight={700} fill={brand.accent || '#c0c4cb'} letterSpacing={0.4}>
          C19
        </text>
        <g transform={`translate(0, 5)`}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 14}, 0)`}>
              <rect x={0} y={0} width={12} height={Math.min(10, height - 12)} fill="#0a0c0f" stroke={brand.accent || '#2a2f37'} strokeWidth={0.5} rx={0.8} />
              <rect x={3} y={2} width={1.5} height={2} fill="#050608" rx={0.2} />
              <rect x={7.5} y={2} width={1.5} height={2} fill="#050608" rx={0.2} />
              <rect x={5} y={5.5} width={2} height={1.2} fill="#050608" rx={0.2} />
            </g>
          ))}
        </g>
      </g>

      {/* Entrée secteur IEC C20 + mgmt */}
      <g transform={`translate(${width - 62}, 3)`}>
        <rect x={0} y={0} width={22} height={height - 6} fill="#141619" stroke={brand.bezel} strokeWidth={0.5} rx={1.5} />
        <text x={11} y={4} textAnchor="middle" fontSize={3} fontFamily="monospace" fill="#c0c4cb">INPUT</text>
        <rect x={4} y={6} width={14} height={7.5} fill="#0a0c0f" stroke="#2a2f37" strokeWidth={0.4} rx={0.5} />
        <rect x={6} y={8} width={2} height={2.5} fill="#050608" rx={0.2} />
        <rect x={14} y={8} width={2} height={2.5} fill="#050608" rx={0.2} />
        <rect x={10} y={11} width={2} height={1.5} fill="#050608" rx={0.2} />
        <text x={11} y={height - 4} textAnchor="middle" fontSize={2.5} fontFamily="monospace" fill="#8e93a0">
          C20 250V
        </text>
      </g>

      <g transform={`translate(${width - 36}, 3)`}>
        {/* RJ45 SNMP */}
        <rect x={0} y={2} width={9} height={7} fill="#050608" stroke="#22d3ee" strokeWidth={0.45} rx={0.7} />
        <rect x={1.5} y={3} width={6} height={3.5} fill="#1a1d22" />
        <text x={4.5} y={height - 7} textAnchor="middle" fontSize={2.3} fontFamily="monospace" fill="#22d3ee">
          SNMP
        </text>
        {/* USB */}
        <rect x={12} y={2.5} width={7} height={3} fill="#050608" stroke="#2a2f37" strokeWidth={0.4} rx={0.3} />
        <text x={15.5} y={height - 7} textAnchor="middle" fontSize={2.3} fontFamily="monospace" fill="#8e93a0">
          USB
        </text>
        {/* RJ45 Série */}
        <rect x={23} y={2} width={9} height={7} fill="#050608" stroke="#2a2f37" strokeWidth={0.45} rx={0.7} />
        <rect x={24.5} y={3} width={6} height={3.5} fill="#1a1d22" />
        <text x={27.5} y={height - 7} textAnchor="middle" fontSize={2.3} fontFamily="monospace" fill="#8e93a0">
          SER
        </text>
      </g>

      {/* LED bypass */}
      <circle
        cx={width - 8} cy={height / 2}
        r={1.2}
        fill={device.status === 'online' ? P.ledOnline : P.ledWarning}
        className={ledClass(device.status)}
      />

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

function ledClass(status) {
  if (status === 'online') return 'dc2d-led-online';
  if (status === 'warning') return 'dc2d-led-warning';
  if (status === 'critical') return 'dc2d-led-critical';
  return '';
}
