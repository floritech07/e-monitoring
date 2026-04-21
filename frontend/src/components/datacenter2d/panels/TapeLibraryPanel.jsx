import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'une librairie à bandes LTO (HPE StoreEver MSL2024 / IBM TS3100).
 */
export default function TapeLibraryPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  return (
    <g>
      <defs>
        <linearGradient id={`tl-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#tl-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.8} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.8} width={width} height={1.8} fill={brand.bezel} rx={2} />

      {brandKey === 'hpe' && (
        <rect x={0} y={3} width={4} height={height - 6} fill={brand.accent} rx={2} />
      )}

      {/* Logo + modèle */}
      <g transform={`translate(10, ${height / 2 - 10})`}>
        <text fontSize={9} fontFamily="Inter, system-ui, sans-serif" fontWeight={800} fill={brand.logoText} letterSpacing={1}>
          {brandKey === 'ibm' ? 'IBM' : 'HPE'}
        </text>
        <text y={12} fontSize={4.5} fontFamily="monospace" fill="#a1a1aa">
          {brandKey === 'ibm' ? 'TS3100' : 'StoreEver'}
        </text>
        <text y={20} fontSize={3.8} fontFamily="monospace" fill="#a1a1aa">
          LTO Tape
        </text>
      </g>

      {/* LCD */}
      <g transform={`translate(68, 6)`}>
        <rect x={0} y={0} width={80} height={height - 12} fill="#0a1838" stroke="#000" strokeWidth={0.7} rx={2} />
        <rect x={1.5} y={1.5} width={77} height={height - 15} fill="#1a4a28" opacity={device.status === 'online' ? 0.92 : 0.15} rx={1.5} />
        <text x={5} y={height / 2 - 7} fontSize={4.5} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          LTO6 · READY
        </text>
        <text x={5} y={height / 2 - 1} fontSize={4.5} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          SLOTS 18/24
        </text>
        <text x={5} y={height / 2 + 5} fontSize={4.5} fontFamily="monospace" fontWeight={700} fill="#a8f0c0" opacity={device.status === 'online' ? 1 : 0.2}>
          DRV 0 IDLE
        </text>
      </g>

      {/* Boutons navigation */}
      <g transform={`translate(160, ${height / 2 - 7})`}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 7} y={0} width={5.5} height={14} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.4} rx={1.2} />
        ))}
      </g>

      {/* Mail-slot */}
      <g transform={`translate(198, 5)`}>
        <rect x={0} y={0} width={24} height={height - 10} fill="#050608" stroke={brand.bezel} strokeWidth={0.6} rx={1.5} />
        <text x={12} y={height / 2 - 3} textAnchor="middle" fontSize={3.8} fontFamily="monospace" fill="#a1a1aa">MAIL</text>
        <text x={12} y={height / 2 + 3} textAnchor="middle" fontSize={3.8} fontFamily="monospace" fill="#a1a1aa">SLOT</text>
      </g>

      {/* LEDs état */}
      <g transform={`translate(${width - 50}, 5)`}>
        {[
          { lbl: 'READY', color: device.status === 'online' ? P.ledOnline : '#2a2f37', anim: 'online' },
          { lbl: 'CLEAN', color: P.ledWarning, anim: null },
          { lbl: 'ATTN',  color: P.ledIdle, anim: null },
          { lbl: 'ERROR', color: statusLed, anim: device.status === 'critical' ? 'critical' : null },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4.5})`}>
            <circle
              cx={2} cy={0} r={0.9}
              fill={led.color}
              className={
                led.anim === 'online' && device.status === 'online' ? 'dc2d-led-online'
                : led.anim === 'critical' ? 'dc2d-led-critical'
                : ''
              }
              opacity={0.88}
            />
            <text x={5.5} y={0} dominantBaseline="middle" fontSize={3} fill="#a1a1aa" fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {/* Magasins */}
      <g transform={`translate(${width - 15}, ${height / 2 - 9})`}>
        <rect x={0} y={0} width={11} height={18} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.5} rx={1} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={1.5} y={1.5 + i * 4} width={8} height={2.8} fill="#0a0c0f" stroke={brand.bezel} strokeWidth={0.2} rx={0.4} />
        ))}
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}
