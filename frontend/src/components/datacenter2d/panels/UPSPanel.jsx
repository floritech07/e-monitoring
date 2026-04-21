import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'un onduleur rack (APC / Eaton / Socomec).
 */
export default function UPSPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  const lcdX = 76;
  const lcdY = 5;
  const lcdW = width * 0.34;
  const lcdH = height - 10;

  return (
    <g>
      <defs>
        <linearGradient id={`ups-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#ups-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.8} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.8} width={width} height={1.8} fill={brand.bezel} rx={2} />

      {/* Grille de ventilation à gauche */}
      <g transform="translate(5, 5)">
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x={0} y={i * (height - 10) / 6}
            width={16} height={(height - 10) / 6 - 1}
            fill="none" stroke={brand.stripe} strokeWidth={0.5} rx={0.8}
          />
        ))}
      </g>

      {/* Logo marque */}
      <g transform={`translate(26, ${height / 2 - 6})`}>
        <text
          x={0} y={0}
          fontSize={9}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fill={brand.logoText}
          letterSpacing={0.5}
        >
          {brandLabel(brandKey)}
        </text>
        <text
          x={0} y={9}
          fontSize={4.5}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#a1a1aa"
        >
          {brandSubtitle(brandKey)}
        </text>
      </g>

      {/* LCD */}
      <g>
        <rect
          x={lcdX} y={lcdY}
          width={lcdW} height={lcdH}
          fill={brand.lcd || '#89b15b'}
          rx={2}
          opacity={device.status === 'online' ? 0.95 : 0.3}
        />
        <rect
          x={lcdX} y={lcdY}
          width={lcdW} height={lcdH}
          fill="none" stroke="#0a0c0f" strokeWidth={1.2}
          rx={2}
        />
        <g transform={`translate(${lcdX + 5}, ${lcdY + 4})`}>
          <text x={0} y={5.5} fontSize={5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            INPUT  230V
          </text>
          <text x={0} y={13} fontSize={5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            LOAD   {device.status === 'online' ? '42%' : '—'}
          </text>
          <text x={0} y={20.5} fontSize={5} fontFamily="monospace" fill="#0a0c0f" fontWeight={700}>
            BATT   {device.status === 'online' ? '98%' : '—'}
          </text>
          <g transform={`translate(0, 24)`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={i}
                x={i * 4.2}
                y={0}
                width={3.2}
                height={3.2}
                fill="#0a0c0f"
                opacity={i < 4 ? 1 : 0.2}
                rx={0.4}
              />
            ))}
          </g>
        </g>
      </g>

      {/* Boutons navigation */}
      <g transform={`translate(${lcdX + lcdW + 10}, ${height / 2 - 6})`}>
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx={i * 6.5}
            cy={0}
            r={2.4}
            fill={brand.stripe}
            stroke={brand.bezel}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* LEDs état */}
      <g transform={`translate(${width - 50}, 5)`}>
        {[
          { lbl: 'ONLINE',  color: device.status === 'online' ? P.ledOnline : '#2a2f37', anim: 'online' },
          { lbl: 'BATTERY', color: P.ledWarning, anim: null },
          { lbl: 'BYPASS',  color: P.ledIdle, anim: null },
          { lbl: 'FAULT',   color: device.status === 'critical' ? P.ledCritical : '#2a2f37', anim: device.status === 'critical' ? 'critical' : null },
        ].map((led, i) => (
          <g key={led.lbl} transform={`translate(0, ${i * 4.5})`}>
            <circle
              cx={2} cy={0} r={0.9}
              fill={led.color}
              className={led.anim === 'online' && device.status === 'online' ? 'dc2d-led-online' : led.anim === 'critical' ? 'dc2d-led-critical' : ''}
              opacity={device.status === 'online' || led.lbl === 'ONLINE' ? 0.95 : 0.35}
            />
            <text x={5.5} y={0} dominantBaseline="middle" fontSize={3} fill="#a1a1aa" fontFamily="monospace">{led.lbl}</text>
          </g>
        ))}
      </g>

      {/* Bouton Power */}
      <g transform={`translate(${width - 11}, ${height / 2})`}>
        <circle r={3.5} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.6} />
        <circle
          r={1.8}
          fill="none"
          stroke={statusLed}
          strokeWidth={1}
          opacity={device.status === 'online' ? 1 : 0.35}
          className={ledAnimClass(device.status)}
        />
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}

function brandLabel(brandKey) {
  switch (brandKey) {
    case 'apc':     return 'APC';
    case 'eaton':   return 'EATON';
    case 'socomec': return 'SOCOMEC';
    default:        return 'UPS';
  }
}

function brandSubtitle(brandKey) {
  switch (brandKey) {
    case 'apc':     return 'Smart-UPS';
    case 'eaton':   return '9PX Series';
    case 'socomec': return 'ITYS';
    default:        return '';
  }
}
