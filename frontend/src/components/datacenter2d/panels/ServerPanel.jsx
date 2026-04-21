import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'un serveur rack 1U/2U/4U.
 * Reçoit `brand` (palette fabricant) et `P` (palette thème) depuis Device2D.
 */
export default function ServerPanel({ device, brandKey, brand, P, theme, width, height, uSize, selected, hovered }) {
  const u = device.uSize || 1;
  const bayRows   = u >= 4 ? 3 : u >= 2 ? 2 : 1;
  const bayCols   = u >= 2 ? 12 : 8;
  const statusLed = statusLedColor(device.status, theme);

  const bayAreaX = 68;
  const bayAreaW = width - 106;
  const bayAreaY = 5;
  const bayAreaH = height - 10;
  const bayW = bayAreaW / bayCols;
  const bayH = bayAreaH / bayRows;

  return (
    <g>
      {/* Corps avec gradient vertical pour relief */}
      <defs>
        <linearGradient id={`srv-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={brand.bodyLite || brand.body} />
          <stop offset="50%"  stopColor={brand.body} />
          <stop offset="100%" stopColor={brand.stripe} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#srv-body-${device.id})`} rx={4} />
      {/* Bezel haut/bas */}
      <rect x={0} y={0} width={width} height={1.8} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.8} width={width} height={1.8} fill={brand.bezel} rx={2} />

      {/* Bande accent verticale à gauche (signature HPE / Huawei) */}
      <rect x={0} y={3} width={4} height={height - 6} fill={brand.accent} rx={2} opacity={brandKey === 'hpe' ? 1 : 0.9} />

      {/* Zone logo / marque */}
      <g transform={`translate(10, ${height / 2})`}>
        <text
          x={0} y={0}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={u >= 2 ? 11 : 9}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fill={brand.logoText}
          letterSpacing={1}
        >
          {brandLabel(brandKey)}
        </text>
      </g>

      {/* Bouton power avec anneau LED */}
      <g transform={`translate(56, ${height / 2})`}>
        <circle r={4.5} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.7} />
        <circle
          r={3}
          fill="none"
          stroke={statusLed}
          strokeWidth={1.2}
          opacity={device.status === 'online' ? 1 : 0.35}
          className={ledAnimClass(device.status)}
          style={{ transformOrigin: 'center' }}
        />
      </g>

      {/* Grille de baies disques SFF */}
      {Array.from({ length: bayRows }).map((_, r) =>
        Array.from({ length: bayCols }).map((_, c) => {
          const x = bayAreaX + c * bayW + 0.6;
          const y = bayAreaY + r * bayH + 0.6;
          const w = bayW - 1.2;
          const h = bayH - 1.2;
          const hasDrive = device.status !== 'offline';
          return (
            <g key={`bay-${r}-${c}`}>
              <rect x={x} y={y} width={w} height={h} fill="#050608" stroke={brand.stripe} strokeWidth={0.4} rx={1} />
              {/* Poignée caddy */}
              {hasDrive && (
                <rect x={x + 1.2} y={y + h * 0.2} width={1.1} height={h * 0.6} fill={brand.bezel} rx={0.5} />
              )}
              {/* Activity LED */}
              {device.status === 'online' && (
                <circle
                  cx={x + w - 1.8}
                  cy={y + 1.7}
                  r={0.8}
                  fill="#22c55e"
                  className={((r * 7 + c * 3) % 5) === 0 ? 'dc2d-led-activity' : ''}
                  opacity={((r * 7 + c * 3) % 5) === 0 ? 1 : 0.3}
                />
              )}
            </g>
          );
        })
      )}

      {/* Bloc LEDs + ports à droite */}
      <g transform={`translate(${width - 32}, 0)`}>
        <rect x={0} y={2.5} width={30} height={height - 5} fill={brand.stripe} rx={2} />
        {/* LEDs status (health, NIC, power) */}
        {[
          { color: statusLed, anim: device.status },
          { color: P.ledOnline, anim: 'online' },
          { color: brand.accent, anim: null },
        ].map((led, i) => (
          <circle
            key={i}
            cx={5 + i * 5}
            cy={5}
            r={1.2}
            fill={led.color}
            className={led.anim === 'online' ? 'dc2d-led-activity' : ''}
            opacity={device.status === 'online' ? 0.95 : 0.35}
          />
        ))}
        {/* Ports USB + VGA */}
        <rect x={3.5} y={height - 8} width={6} height={3.5} fill="#050608" stroke={brand.bezel} strokeWidth={0.4} rx={0.8} />
        <rect x={11.5} y={height - 8} width={6} height={3.5} fill="#050608" stroke={brand.bezel} strokeWidth={0.4} rx={0.8} />
        <rect x={19.5} y={height - 8} width={8.5} height={3.5} fill="#050608" stroke={brand.bezel} strokeWidth={0.4} rx={0.8} />
      </g>

      {/* Halo sélection / hover */}
      {(selected || hovered) && (
        <rect
          x={0} y={0} width={width} height={height}
          fill="none"
          stroke={selected ? '#3b82f6' : '#60a5fa'}
          strokeWidth={1.8}
          rx={4}
        />
      )}
    </g>
  );
}

function brandLabel(brandKey) {
  switch (brandKey) {
    case 'hpe':     return 'HPE';
    case 'huawei':  return 'HUAWEI';
    case 'dell':    return 'DELL';
    case 'ibm':     return 'IBM';
    case 'lenovo':  return 'LENOVO';
    default:        return 'SERVER';
  }
}
