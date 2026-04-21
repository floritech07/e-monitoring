import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG du HSM PRISM TSM 500i (STS prépaiement électricité).
 */
export default function HSMPanel({ device, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  const lcdX = 70;
  const lcdY = 5;
  const lcdW = width * 0.38;
  const lcdH = height - 10;

  return (
    <g>
      <defs>
        <linearGradient id={`hsm-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#hsm-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Bande accent violette */}
      <rect x={0} y={3} width={3} height={height - 6} fill={brand.accent} rx={1.5} opacity={0.95} />

      {/* Logo PRISM */}
      <g transform={`translate(10, ${height / 2 - 5})`}>
        <text
          x={0} y={0}
          fontSize={9}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={900}
          fill={brand.accent}
          letterSpacing={1.5}
        >
          PRISM
        </text>
        <text
          x={0} y={8}
          fontSize={4}
          fontFamily="monospace"
          fill="#a1a1aa"
          letterSpacing={0.3}
        >
          TSM 500i · STS
        </text>
      </g>

      {/* LCD alphanumérique 2×16 */}
      <g>
        <rect x={lcdX} y={lcdY} width={lcdW} height={lcdH} fill="#0a1838" stroke="#000" strokeWidth={0.8} rx={2} />
        <rect x={lcdX + 1} y={lcdY + 1} width={lcdW - 2} height={lcdH - 2} fill="#12306e" opacity={device.status === 'online' ? 0.92 : 0.15} rx={1.5} />
        <text
          x={lcdX + 5}
          y={lcdY + lcdH / 2 - 3}
          fontSize={4.2}
          fontFamily="monospace"
          fill="#a5d8ff"
          fontWeight={700}
          opacity={device.status === 'online' ? 1 : 0.2}
        >
          READY STS 06
        </text>
        <text
          x={lcdX + 5}
          y={lcdY + lcdH / 2 + 3.5}
          fontSize={4.2}
          fontFamily="monospace"
          fill="#a5d8ff"
          fontWeight={700}
          opacity={device.status === 'online' ? 1 : 0.2}
        >
          KEY OK  VEND ▸
        </text>
      </g>

      {/* Pavé 6 touches */}
      <g transform={`translate(${lcdX + lcdW + 8}, ${lcdY})`}>
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`k-${row}-${col}`}
              x={col * 8}
              y={row * 6.5}
              width={7} height={5.5}
              fill={brand.stripe}
              stroke={brand.bezel}
              strokeWidth={0.4}
              rx={1}
            />
          ))
        )}
      </g>

      {/* Smart card slot */}
      <g transform={`translate(${width - 46}, ${height / 2 + 6})`}>
        <rect x={0} y={0} width={20} height={2.5} fill="#050608" stroke={brand.bezel} strokeWidth={0.5} rx={0.5} />
        <text x={0} y={7} fontSize={3} fontFamily="monospace" fill="#a1a1aa">SMART CARD</text>
      </g>

      {/* LEDs état */}
      <g transform={`translate(${width - 24}, 5)`}>
        {[
          { lbl: 'PWR', color: device.status === 'online' ? P.ledOnline : '#2a2f37', anim: 'online' },
          { lbl: 'STA', color: statusLed, anim: device.status },
          { lbl: 'TMP', color: '#ef4444', anim: null },
          { lbl: 'COM', color: '#38bdf8', anim: 'activity' },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4.5})`}>
            <circle
              cx={2} cy={0} r={0.9}
              fill={led.color}
              className={
                led.anim === 'online' && device.status === 'online' ? 'dc2d-led-online'
                : led.anim === 'activity' && device.status === 'online' ? 'dc2d-led-activity'
                : led.anim === 'critical' ? 'dc2d-led-critical'
                : ''
              }
              opacity={device.status === 'online' ? 0.95 : led.lbl === 'TMP' ? 0.25 : 0.35}
            />
            <text x={5.5} y={0} dominantBaseline="middle" fontSize={3} fill="#a1a1aa" fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
