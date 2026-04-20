import { BRANDS } from '../constants';

/**
 * Façade SVG d'une PDU rack 1U horizontale (Eaton ePDU G3 / APC AP7xxx).
 * Série d'outlets C13/C19 alignés + LCD courant + disjoncteur.
 */
export default function PDUPanel({ device, brand, width, height, selected, hovered }) {
  const palette = BRANDS[brand] || BRANDS.eaton;
  const outletCount = detectOutletCount(device);

  const lcdX = 30;
  const lcdW = 28;
  const outletAreaX = lcdX + lcdW + 6;
  const outletAreaW = width - outletAreaX - 12;
  const outletW = outletAreaW / outletCount;

  return (
    <g>
      {/* Corps */}
      <rect x={0} y={0} width={width} height={height} fill={palette.body} rx={1.5} />
      <rect x={0} y={0} width={width} height={1.2} fill={palette.bezel} />
      <rect x={0} y={height - 1.2} width={width} height={1.2} fill={palette.bezel} />

      {/* Logo marque */}
      <g transform={`translate(4, ${height / 2})`}>
        <text
          x={0} y={-2}
          dominantBaseline="middle"
          fontSize={6}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fill={palette.accent}
          letterSpacing={0.5}
        >
          {brand === 'apc' ? 'APC' : 'EATON'}
        </text>
        <text
          x={0} y={4}
          dominantBaseline="middle"
          fontSize={2.8}
          fontFamily="monospace"
          fill={palette.labelDim || '#71717a'}
        >
          ePDU
        </text>
      </g>

      {/* Mini LCD ampérage */}
      <g>
        <rect x={lcdX} y={3} width={lcdW} height={height - 6} fill="#0a0f14" stroke="#000" strokeWidth={0.5} rx={0.5} />
        <rect x={lcdX + 1} y={4} width={lcdW - 2} height={height - 8} fill={palette.lcd || '#1a3a7a'} opacity={device.status === 'online' ? 0.9 : 0.2} />
        <text
          x={lcdX + lcdW / 2}
          y={height / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={5}
          fontFamily="monospace"
          fontWeight={700}
          fill="#d4e5ff"
          opacity={device.status === 'online' ? 1 : 0.25}
        >
          {device.status === 'online' ? '12.4A' : '--.--'}
        </text>
      </g>

      {/* Rangée d'outlets C13 */}
      <g transform={`translate(${outletAreaX}, 3)`}>
        {Array.from({ length: outletCount }).map((_, i) => {
          const x = i * outletW + 0.5;
          const ow = outletW - 1;
          const oh = height - 6;
          // Alterner couleurs circuits (bleu/rouge) pour réalisme
          const circuitColor = (Math.floor(i / (outletCount / 2))) === 0 ? '#0a1f3a' : '#2a0a0a';
          return (
            <g key={`out-${i}`}>
              <rect x={x} y={0} width={ow} height={oh} fill={circuitColor} stroke={palette.bezel} strokeWidth={0.3} rx={0.5} />
              {/* Forme d'outlet C13 : rectangle avec coin supérieur chamfered (trapèze) */}
              <g transform={`translate(${x + ow / 2}, ${oh / 2})`}>
                <path
                  d={`M ${-ow * 0.25} ${-oh * 0.28} L ${ow * 0.25} ${-oh * 0.28} L ${ow * 0.30} ${-oh * 0.12} L ${ow * 0.30} ${oh * 0.30} L ${-ow * 0.30} ${oh * 0.30} L ${-ow * 0.30} ${-oh * 0.12} Z`}
                  fill="#050608"
                  stroke={palette.stripe}
                  strokeWidth={0.3}
                />
                {/* 3 broches (trous) */}
                <rect x={-0.4} y={-0.5} width={0.8} height={1.5} fill="#1a1f28" />
                <rect x={-ow * 0.15} y={0.8} width={0.8} height={1.5} fill="#1a1f28" />
                <rect x={ow * 0.12} y={0.8} width={0.8} height={1.5} fill="#1a1f28" />
              </g>
              {/* LED outlet (vert si sous tension) */}
              <circle cx={x + 1} cy={1} r={0.4} fill={device.status === 'online' ? '#22c55e' : '#2a2f37'} />
            </g>
          );
        })}
      </g>

      {/* Disjoncteur à droite */}
      <g transform={`translate(${width - 10}, 3)`}>
        <rect x={0} y={0} width={6} height={height - 6} fill={palette.stripe} stroke={palette.bezel} strokeWidth={0.4} rx={0.5} />
        <rect x={1} y={1} width={4} height={height - 8} fill="#050608" />
        <rect x={2} y={(height - 6) / 2 - 1} width={2} height={3} fill={palette.accent} />
      </g>

      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={1.5} />
      )}
    </g>
  );
}

function detectOutletCount(device) {
  const name = (device.name || '').toLowerCase();
  const m = name.match(/(\d{1,2})\s*(?:outlet|prise|port)/);
  if (m) return parseInt(m[1], 10);
  if (/24|rack/.test(name)) return 12;
  return 8;
}
