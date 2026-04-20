import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'un onduleur rack (APC / Eaton / Socomec).
 * Caractérisé par un grand LCD central + boutons navigation + LEDs état.
 */
export default function UPSPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.apc;
  const statusLed = statusLedColor(device.status);

  // LCD occupe ~40% de la largeur, centré-gauche
  const lcdX = 70;
  const lcdY = 4;
  const lcdW = width * 0.35;
  const lcdH = height - 8;

  return (
    <g>
      {/* Corps */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.5} fill={palette.bezel} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={palette.bezel} />

      {/* Grille de ventilation à gauche */}
      <g transform="translate(4, 4)">
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x={0} y={i * (height - 8) / 6}
            width={14} height={(height - 8) / 6 - 1}
            fill="none" stroke={palette.stripe} strokeWidth={0.5}
          />
        ))}
      </g>

      {/* Logo marque */}
      <g transform={`translate(22, ${height / 2 - 6})`}>
        <text
          x={0} y={0}
          fontSize={8}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fill={palette.logoText}
          letterSpacing={0.5}
        >
          {brandLabel(brand)}
        </text>
        <text
          x={0} y={8}
          fontSize={4.2}
          fontFamily="Inter, system-ui, sans-serif"
          fill={palette.labelDim || '#71717a'}
        >
          {brandSubtitle(brand)}
        </text>
      </g>

      {/* LCD */}
      <g>
        <rect
          x={lcdX} y={lcdY}
          width={lcdW} height={lcdH}
          fill={palette.lcd || '#89b15b'}
          rx={1}
          opacity={device.status === 'online' ? 0.95 : 0.3}
        />
        {/* Cadre LCD */}
        <rect
          x={lcdX} y={lcdY}
          width={lcdW} height={lcdH}
          fill="none" stroke="#0a0c0f" strokeWidth={1}
          rx={1}
        />
        {/* Barres de charge simulées */}
        <g transform={`translate(${lcdX + 4}, ${lcdY + 4})`}>
          <text x={0} y={5} fontSize={4.5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            INPUT  230V
          </text>
          <text x={0} y={12} fontSize={4.5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            LOAD   {device.status === 'online' ? '42%' : '—'}
          </text>
          <text x={0} y={19} fontSize={4.5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            BATT   {device.status === 'online' ? '98%' : '—'}
          </text>
          {/* Mini graphique de charge */}
          <g transform={`translate(0, 22)`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={i}
                x={i * 4}
                y={0}
                width={3}
                height={3}
                fill="#0a0c0f"
                opacity={i < 4 ? 1 : 0.2}
              />
            ))}
          </g>
        </g>
      </g>

      {/* Boutons navigation */}
      <g transform={`translate(${lcdX + lcdW + 8}, ${height / 2 - 6})`}>
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={i * 6}
            cy={0}
            r={2.2}
            fill={palette.stripe}
            stroke={palette.bezel}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* LEDs état à droite */}
      <g transform={`translate(${width - 44}, 4)`}>
        {[
          { lbl: 'ONLINE',  color: device.status === 'online' ? '#22c55e' : '#2a2f37' },
          { lbl: 'BATTERY', color: '#f59e0b' },
          { lbl: 'BYPASS',  color: '#38bdf8' },
          { lbl: 'FAULT',   color: device.status === 'critical' ? '#ef4444' : '#2a2f37' },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4})`}>
            <circle cx={2} cy={0} r={0.8} fill={led.color} opacity={device.status === 'online' || led.lbl === 'ONLINE' ? 0.9 : 0.3} />
            <text x={5} y={0} dominantBaseline="middle" fontSize={2.8} fill={palette.labelDim || '#71717a'} fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {/* Bouton Power */}
      <g transform={`translate(${width - 10}, ${height / 2})`}>
        <circle r={3} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.5} />
        <circle r={1.5} fill="none" stroke={statusLed} strokeWidth={0.8} opacity={device.status === 'online' ? 1 : 0.3} />
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}

function brandLabel(brand) {
  switch (brand) {
    case 'apc':     return 'APC';
    case 'eaton':   return 'EATON';
    case 'socomec': return 'SOCOMEC';
    default:        return 'UPS';
  }
}

function brandSubtitle(brand) {
  switch (brand) {
    case 'apc':     return 'Smart-UPS';
    case 'eaton':   return '9PX Series';
    case 'socomec': return 'ITYS';
    default:        return '';
  }
}
