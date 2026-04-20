import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'un HSM rack — PRISM TSM 500i (STS prépaiement électricité).
 * Layout : logo PRISM | LCD alphanumérique 2×16 | pavé 6 touches | LEDs tamper/status
 */
export default function HSMPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.prism;
  const statusLed = statusLedColor(device.status);

  const lcdX = 64;
  const lcdY = 4;
  const lcdW = width * 0.38;
  const lcdH = height - 8;

  return (
    <g>
      {/* Corps noir profond */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.5} fill={palette.bezel} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={palette.bezel} />

      {/* Bande accent violette (notre convention HSM) */}
      <rect x={0} y={2} width={2.5} height={height - 4} fill={palette.accent} opacity={0.9} />

      {/* Logo PRISM */}
      <g transform={`translate(8, ${height / 2 - 5})`}>
        <text
          x={0} y={0}
          fontSize={8}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={900}
          fill={palette.accent}
          letterSpacing={1.5}
        >
          PRISM
        </text>
        <text
          x={0} y={7}
          fontSize={3.8}
          fontFamily="monospace"
          fill={palette.labelDim || '#71717a'}
          letterSpacing={0.3}
        >
          TSM 500i · STS
        </text>
      </g>

      {/* LCD alphanumérique 2×16 (bleu industriel) */}
      <g>
        <rect x={lcdX} y={lcdY} width={lcdW} height={lcdH} fill="#0a1838" stroke="#000" strokeWidth={0.8} rx={0.8} />
        <rect x={lcdX + 1} y={lcdY + 1} width={lcdW - 2} height={lcdH - 2} fill="#12306e" opacity={device.status === 'online' ? 0.9 : 0.15} />
        {/* Texte LCD rétro */}
        <text
          x={lcdX + 4}
          y={lcdY + lcdH / 2 - 3}
          fontSize={3.8}
          fontFamily="monospace"
          fill="#a5d8ff"
          fontWeight={700}
          opacity={device.status === 'online' ? 1 : 0.2}
        >
          READY STS 06
        </text>
        <text
          x={lcdX + 4}
          y={lcdY + lcdH / 2 + 3}
          fontSize={3.8}
          fontFamily="monospace"
          fill="#a5d8ff"
          fontWeight={700}
          opacity={device.status === 'online' ? 1 : 0.2}
        >
          KEY OK  VEND ▸
        </text>
      </g>

      {/* Pavé 6 touches (2×3) */}
      <g transform={`translate(${lcdX + lcdW + 6}, ${lcdY})`}>
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`k-${row}-${col}`}
              x={col * 7}
              y={row * 6}
              width={6} height={5}
              fill={palette.stripe}
              stroke={palette.bezel}
              strokeWidth={0.4}
              rx={0.5}
            />
          ))
        )}
      </g>

      {/* Smart card slot (fente) */}
      <g transform={`translate(${width - 42}, ${height / 2 + 6})`}>
        <rect x={0} y={0} width={18} height={2} fill="#050608" stroke={palette.bezel} strokeWidth={0.4} />
        <text x={0} y={6} fontSize={2.8} fontFamily="monospace" fill={palette.labelDim || '#71717a'}>SMART CARD</text>
      </g>

      {/* LEDs état à droite (Power/Status/Tamper/Comms) */}
      <g transform={`translate(${width - 22}, 4)`}>
        {[
          { lbl: 'PWR', color: device.status === 'online' ? '#22c55e' : '#2a2f37' },
          { lbl: 'STA', color: statusLed },
          { lbl: 'TMP', color: '#ef4444' },
          { lbl: 'COM', color: '#38bdf8' },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4})`}>
            <circle cx={2} cy={0} r={0.8} fill={led.color} opacity={device.status === 'online' ? 0.9 : led.lbl === 'TMP' ? 0.2 : 0.3} />
            <text x={5} y={0} dominantBaseline="middle" fontSize={2.8} fill={palette.labelDim || '#71717a'} fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}
