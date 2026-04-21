import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Panneau fallback pour les types non spécialisés.
 */
export default function GenericPanel({ device, brand, P, theme, width, height, label, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);

  return (
    <g>
      <defs>
        <linearGradient id={`gen-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#gen-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      <rect x={0} y={3} width={3} height={height - 6} fill={brand.accent} rx={1.5} opacity={0.85} />

      <text
        x={12}
        y={height / 2 - 3}
        dominantBaseline="middle"
        fontSize={8}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={brand.logoText}
        letterSpacing={0.3}
      >
        {label || shortName(device.name)}
      </text>
      <text
        x={12}
        y={height / 2 + 7}
        dominantBaseline="middle"
        fontSize={4.5}
        fontFamily="monospace"
        fill="#a1a1aa"
      >
        {device.type || ''}
      </text>

      <g transform={`translate(${width - 14}, ${height / 2})`}>
        <circle
          r={1.8}
          fill={statusLed}
          className={ledAnimClass(device.status)}
          opacity={device.status === 'online' ? 0.95 : 0.4}
        />
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
      )}
    </g>
  );
}

function shortName(name) {
  if (!name) return 'Device';
  return name.length > 32 ? name.substring(0, 30) + '…' : name;
}
