import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'une librairie à bandes LTO (HPE StoreEver MSL2024 / IBM TS3100).
 * 2U typique : LCD diagnostic + 4 boutons + mail-slot + 2 magasins de 12 slots.
 */
export default function TapeLibraryPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.hpe;
  const statusLed = statusLedColor(device.status);

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.5} fill={palette.bezel} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={palette.bezel} />

      {/* Bande accent (HPE vert) */}
      {brand === 'hpe' && (
        <rect x={0} y={2} width={3} height={height - 4} fill={palette.accent} />
      )}

      {/* Logo + modèle */}
      <g transform={`translate(8, ${height / 2 - 8})`}>
        <text fontSize={8} fontFamily="Inter, system-ui, sans-serif" fontWeight={700} fill={palette.logoText} letterSpacing={1}>
          {brand === 'ibm' ? 'IBM' : 'HPE'}
        </text>
        <text y={10} fontSize={4.2} fontFamily="monospace" fill={palette.labelDim || '#71717a'}>
          {brand === 'ibm' ? 'TS3100' : 'StoreEver'}
        </text>
        <text y={18} fontSize={3.5} fontFamily="monospace" fill={palette.labelDim || '#71717a'}>
          LTO Tape
        </text>
      </g>

      {/* LCD */}
      <g transform={`translate(60, 5)`}>
        <rect x={0} y={0} width={70} height={height - 10} fill="#0a1838" stroke="#000" strokeWidth={0.6} rx={0.8} />
        <rect x={1} y={1} width={68} height={height - 12} fill="#1a4a28" opacity={device.status === 'online' ? 0.9 : 0.15} />
        <text x={4} y={height / 2 - 6} fontSize={4} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          LTO6 · READY
        </text>
        <text x={4} y={height / 2 - 1} fontSize={4} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          SLOTS 18/24
        </text>
        <text x={4} y={height / 2 + 4} fontSize={4} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          DRV 0 IDLE
        </text>
      </g>

      {/* 4 boutons navigation */}
      <g transform={`translate(140, ${height / 2 - 6})`}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 6} y={0} width={5} height={12} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.4} rx={0.8} />
        ))}
      </g>

      {/* Mail-slot */}
      <g transform={`translate(175, 4)`}>
        <rect x={0} y={0} width={22} height={height - 8} fill="#050608" stroke={palette.bezel} strokeWidth={0.5} rx={0.5} />
        <text x={11} y={height / 2 - 2} textAnchor="middle" fontSize={3.5} fontFamily="monospace" fill={palette.labelDim || '#71717a'}>MAIL</text>
        <text x={11} y={height / 2 + 3} textAnchor="middle" fontSize={3.5} fontFamily="monospace" fill={palette.labelDim || '#71717a'}>SLOT</text>
      </g>

      {/* LEDs état à droite */}
      <g transform={`translate(${width - 44}, 4)`}>
        {[
          { lbl: 'READY', color: device.status === 'online' ? '#22c55e' : '#2a2f37' },
          { lbl: 'CLEAN', color: '#f59e0b' },
          { lbl: 'ATTN',  color: '#38bdf8' },
          { lbl: 'ERROR', color: statusLed },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4})`}>
            <circle cx={2} cy={0} r={0.8} fill={led.color} opacity={0.8} />
            <text x={5} y={0} dominantBaseline="middle" fontSize={2.8} fill={palette.labelDim || '#71717a'} fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {/* Magasins (petits rectangles sur les côtés) */}
      <g transform={`translate(${width - 14}, ${height / 2 - 8})`}>
        <rect x={0} y={0} width={10} height={16} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.4} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={1} y={1 + i * 4} width={8} height={2.5} fill="#0a0c0f" stroke={palette.bezel} strokeWidth={0.2} />
        ))}
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}
