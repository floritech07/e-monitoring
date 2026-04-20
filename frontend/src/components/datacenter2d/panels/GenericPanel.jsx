import { BRANDS, statusLedColor } from '../constants';

/**
 * Panneau fallback pour les types non spécialisés (firewall, routeur, console KVM, etc.).
 */
export default function GenericPanel({ device, brand, width, height, label, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.generic;
  const statusLed = statusLedColor(device.status);

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.2} fill={palette.bezel} />
      <rect x={0} y={height - 1.2} width={width} height={1.2} fill={palette.bezel} />

      {/* Bande accent */}
      <rect x={0} y={2} width={2.5} height={height - 4} fill={palette.accent} opacity={0.8} />

      {/* Nom de l'équipement centré */}
      <text
        x={10}
        y={height / 2 - 3}
        dominantBaseline="middle"
        fontSize={7}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={palette.logoText}
        letterSpacing={0.3}
      >
        {label || shortName(device.name)}
      </text>
      <text
        x={10}
        y={height / 2 + 6}
        dominantBaseline="middle"
        fontSize={4}
        fontFamily="monospace"
        fill={palette.labelDim || '#71717a'}
      >
        {device.type || ''}
      </text>

      {/* LED status à droite */}
      <g transform={`translate(${width - 12}, ${height / 2})`}>
        <circle r={1.5} fill={statusLed} opacity={device.status === 'online' ? 0.9 : 0.4} />
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}

function shortName(name) {
  if (!name) return 'Device';
  return name.length > 28 ? name.substring(0, 26) + '…' : name;
}
