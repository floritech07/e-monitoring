import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'une PDU rack 1U horizontale (Eaton ePDU G3 / APC AP7xxx).
 */
export default function PDUPanel({ device, brandKey, brand, P, theme, width, height, selected, hovered }) {
  const outletCount = detectOutletCount(device);

  const lcdX = 34;
  const lcdW = 32;
  const outletAreaX = lcdX + lcdW + 8;
  const outletAreaW = width - outletAreaX - 14;
  const outletW = outletAreaW / outletCount;

  return (
    <g>
      <defs>
        <linearGradient id={`pdu-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#pdu-body-${device.id})`} rx={4} />
      <rect x={0} y={0} width={width} height={1.5} fill={brand.bezel} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={brand.bezel} rx={2} />

      {/* Logo marque */}
      <g transform={`translate(5, ${height / 2})`}>
        <text
          x={0} y={-2}
          dominantBaseline="middle"
          fontSize={6.5}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fill={brand.accent}
          letterSpacing={0.5}
        >
          {brandKey === 'apc' ? 'APC' : 'EATON'}
        </text>
        <text
          x={0} y={4}
          dominantBaseline="middle"
          fontSize={3}
          fontFamily="monospace"
          fill="#a1a1aa"
        >
          ePDU
        </text>
      </g>

      {/* Mini LCD ampérage */}
      <g>
        <rect x={lcdX} y={3.5} width={lcdW} height={height - 7} fill="#0a0f14" stroke="#000" strokeWidth={0.5} rx={1.5} />
        <rect x={lcdX + 1} y={4.5} width={lcdW - 2} height={height - 9} fill={brand.lcd || '#1a3a7a'} opacity={device.status === 'online' ? 0.92 : 0.2} rx={1} />
        <text
          x={lcdX + lcdW / 2}
          y={height / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={5.5}
          fontFamily="monospace"
          fontWeight={700}
          fill="#d4e5ff"
          opacity={device.status === 'online' ? 1 : 0.25}
        >
          {device.status === 'online' ? '12.4A' : '--.--'}
        </text>
      </g>

      {/* Rangée d'outlets C13 */}
      <g transform={`translate(${outletAreaX}, 3.5)`}>
        {Array.from({ length: outletCount }).map((_, i) => {
          const x = i * outletW + 0.6;
          const ow = outletW - 1.2;
          const oh = height - 7;
          // Alternance bleu/rouge pour deux circuits
          const circuitColor = (Math.floor(i / (outletCount / 2))) === 0 ? '#0a1f3a' : '#2a0a0a';
          return (
            <g key={`out-${i}`}>
              <rect x={x} y={0} width={ow} height={oh} fill={circuitColor} stroke={brand.bezel} strokeWidth={0.3} rx={1.5} />
              {/* Forme d'outlet C13 (trapèze) */}
              <g transform={`translate(${x + ow / 2}, ${oh / 2})`}>
                <path
                  d={`M ${-ow * 0.25} ${-oh * 0.30} L ${ow * 0.25} ${-oh * 0.30} L ${ow * 0.30} ${-oh * 0.12} L ${ow * 0.30} ${oh * 0.30} L ${-ow * 0.30} ${oh * 0.30} L ${-ow * 0.30} ${-oh * 0.12} Z`}
                  fill="#050608"
                  stroke={brand.stripe}
                  strokeWidth={0.3}
                />
                {/* Broches */}
                <rect x={-0.5} y={-0.6} width={1} height={1.8} fill="#1a1f28" rx={0.2} />
                <rect x={-ow * 0.15} y={1} width={1} height={1.8} fill="#1a1f28" rx={0.2} />
                <rect x={ow * 0.12} y={1} width={1} height={1.8} fill="#1a1f28" rx={0.2} />
              </g>
              {/* LED outlet */}
              <circle
                cx={x + 1.3} cy={1.3} r={0.5}
                fill={device.status === 'online' ? '#22c55e' : '#2a2f37'}
                className={device.status === 'online' ? 'dc2d-led-online' : ''}
              />
            </g>
          );
        })}
      </g>

      {/* Disjoncteur à droite */}
      <g transform={`translate(${width - 12}, 3.5)`}>
        <rect x={0} y={0} width={7} height={height - 7} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.4} rx={1} />
        <rect x={1} y={1} width={5} height={height - 9} fill="#050608" rx={0.5} />
        <rect x={2} y={(height - 7) / 2 - 1.5} width={3} height={3} fill={brand.accent} rx={0.3} />
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={4} />
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
