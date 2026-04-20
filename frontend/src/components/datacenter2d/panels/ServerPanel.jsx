import { BRANDS, statusLedColor } from '../constants';

/**
 * Façade SVG d'un serveur rack 1U/2U/4U.
 * S'adapte au fabricant via detectBrand(device) :
 *   - HPE ProLiant : gris charbon, bande verte, bezel gaufré, anneau power LED
 *   - Huawei       : noir profond, accent rouge, logo à gauche
 *   - Dell         : noir + liseré bleu Dell, baies SFF à droite
 *   - IBM/Lenovo   : noir + liseré bleu IBM / rouge Lenovo
 *
 * Le nombre de baies disques rendues suit uSize :
 *   1U → 8 baies SFF en ligne
 *   2U → 24 baies SFF en 2 rangées (HPE DL380-like) ou 12 LFF
 *   4U+ → 12 LFF en grille dense
 */
export default function ServerPanel({ device, brand, width, height, uSize, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.generic;
  const bayRows   = uSize >= 4 ? 3 : uSize >= 2 ? 2 : 1;
  const bayCols   = uSize >= 2 ? 12 : 8;
  const statusLed = statusLedColor(device.status);

  // Zone centrale pour les baies
  const bayAreaX = 62;
  const bayAreaW = width - 96;
  const bayAreaY = 4;
  const bayAreaH = height - 8;
  const bayW = bayAreaW / bayCols;
  const bayH = bayAreaH / bayRows;

  return (
    <g>
      {/* Corps */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      {/* Bezel haut/bas (liseré) */}
      <rect x={0} y={0} width={width} height={1.5} fill={palette.bezel} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={palette.bezel} />

      {/* Bande accent verticale à gauche (signature HPE / Huawei) */}
      <rect x={0} y={2} width={3} height={height - 4} fill={palette.accent} opacity={brand === 'hpe' ? 1 : 0.85} />

      {/* Zone logo / marque */}
      <g transform={`translate(8, ${height / 2})`}>
        <text
          x={0}
          y={0}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={uSize >= 2 ? 10 : 8}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={palette.logoText}
          letterSpacing={1}
        >
          {brandLabel(brand)}
        </text>
      </g>

      {/* Bouton power avec anneau LED (style HPE DL380) */}
      <g transform={`translate(50, ${height / 2})`}>
        <circle r={4} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.5} />
        <circle r={2.5} fill="none" stroke={statusLed} strokeWidth={1} opacity={device.status === 'online' ? 1 : 0.3} />
      </g>

      {/* Grille de baies disques SFF */}
      {Array.from({ length: bayRows }).map((_, r) =>
        Array.from({ length: bayCols }).map((_, c) => {
          const x = bayAreaX + c * bayW + 0.5;
          const y = bayAreaY + r * bayH + 0.5;
          const w = bayW - 1;
          const h = bayH - 1;
          return (
            <g key={`bay-${r}-${c}`}>
              <rect x={x} y={y} width={w} height={h} fill="#050608" stroke={palette.stripe} strokeWidth={0.4} />
              {/* Poignée caddy */}
              <rect x={x + 1} y={y + h * 0.2} width={1} height={h * 0.6} fill={palette.bezel} />
              {/* Activity LED (vert/ambre selon statut) */}
              {device.status === 'online' && (
                <circle
                  cx={x + w - 1.5}
                  cy={y + 1.5}
                  r={0.7}
                  fill="#22c55e"
                  opacity={((r * 7 + c * 3) % 5) === 0 ? 1 : 0.25}
                />
              )}
            </g>
          );
        })
      )}

      {/* Bloc LEDs + ports à droite (iLO, USB, VGA) */}
      <g transform={`translate(${width - 30}, 0)`}>
        <rect x={0} y={2} width={28} height={height - 4} fill={palette.stripe} />
        {/* LEDs status (health, NIC, power) */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={4 + i * 4}
            cy={4}
            r={1}
            fill={i === 0 ? statusLed : i === 1 ? '#22c55e' : palette.accent}
            opacity={device.status === 'online' ? 0.9 : 0.3}
          />
        ))}
        {/* Ports USB + VGA (rectangles) */}
        <rect x={3} y={height - 7} width={5} height={3} fill="#050608" stroke={palette.bezel} strokeWidth={0.3} />
        <rect x={10} y={height - 7} width={5} height={3} fill="#050608" stroke={palette.bezel} strokeWidth={0.3} />
        <rect x={17} y={height - 7} width={8} height={3} fill="#050608" stroke={palette.bezel} strokeWidth={0.3} />
      </g>

      {/* Halo sélection / hover */}
      {(selected || hovered) && (
        <rect
          x={0} y={0} width={width} height={height}
          fill="none"
          stroke={selected ? '#3b82f6' : '#60a5fa'}
          strokeWidth={1.5}
          rx={1.5}
        />
      )}
    </g>
  );
}

function brandLabel(brand) {
  switch (brand) {
    case 'hpe':     return 'HPE';
    case 'huawei':  return 'HUAWEI';
    case 'dell':    return 'DELL';
    case 'ibm':     return 'IBM';
    case 'lenovo':  return 'LENOVO';
    default:        return 'SERVER';
  }
}
