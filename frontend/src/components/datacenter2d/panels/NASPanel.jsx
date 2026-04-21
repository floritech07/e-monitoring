import { ledAnimClass, statusLedColor } from '../constants';

/**
 * Façade SVG d'un NAS Synology (DS1520+ et équivalents).
 */
export default function NASPanel({ device, brand, P, theme, width, height, selected, hovered }) {
  const statusLed = statusLedColor(device.status, theme);
  const bayCount  = detectBayCount(device);
  const bayAreaX  = 58;
  const bayAreaW  = width - bayAreaX - 54;
  const bayW      = bayAreaW / bayCount;

  return (
    <g>
      <defs>
        <linearGradient id={`nas-body-${device.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brand.bodyLite || brand.body} />
          <stop offset="100%" stopColor={brand.body} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill={`url(#nas-body-${device.id})`} rx={5} />
      {/* Texture subtile */}
      {[0.3, 0.5, 0.7].map((p, i) => (
        <line
          key={i}
          x1={0} x2={width}
          y1={height * p} y2={height * p}
          stroke={brand.stripe} strokeWidth={0.3} opacity={0.45}
        />
      ))}

      {/* Logo Synology */}
      <g transform={`translate(8, ${height / 2})`}>
        <text
          x={0} y={-2}
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={brand.logoText}
          letterSpacing={0.5}
        >
          Synology
        </text>
        <text
          x={0} y={7}
          dominantBaseline="middle"
          fontSize={4.5}
          fill="#a1a1aa"
          fontFamily="monospace"
        >
          {extractModel(device.name)}
        </text>
      </g>

      {/* Baies disques */}
      <g transform={`translate(${bayAreaX}, 4)`}>
        {Array.from({ length: bayCount }).map((_, i) => {
          const x = i * bayW + 0.5;
          const bayInnerH = height - 8;
          const active = device.status === 'online';
          return (
            <g key={`bay-${i}`}>
              <rect
                x={x} y={0}
                width={bayW - 1} height={bayInnerH}
                fill={brand.driveBay || '#0d0d0d'}
                stroke={brand.bezel}
                strokeWidth={0.5}
                rx={2}
              />
              {/* Poignée centrale */}
              <rect
                x={x + (bayW - 1) / 2 - 0.6}
                y={bayInnerH * 0.15}
                width={1.2}
                height={bayInnerH * 0.7}
                fill={brand.bezel}
                rx={0.6}
              />
              {/* 2 LEDs par baie */}
              <circle
                cx={x + 2.5} cy={2.5} r={0.7}
                fill={active ? '#22c55e' : '#2a2f37'}
                className={active ? 'dc2d-led-online' : ''}
                opacity={0.95}
              />
              <circle
                cx={x + 2.5} cy={5.5} r={0.7}
                fill={active && (i % 3 !== 0) ? '#f59e0b' : '#2a2f37'}
                className={active && (i % 3 !== 0) ? 'dc2d-led-activity' : ''}
                opacity={0.8}
              />
            </g>
          );
        })}
      </g>

      {/* Bloc LEDs + power à droite */}
      <g transform={`translate(${width - 50}, 3)`}>
        {['STATUS', 'LAN1', 'LAN2'].map((lbl, i) => (
          <g key={lbl} transform={`translate(0, ${i * 4.5 + 2})`}>
            <circle
              cx={2} cy={0} r={0.8}
              fill={i === 0 ? statusLed : '#22c55e'}
              className={i === 0 ? ledAnimClass(device.status) : (device.status === 'online' ? 'dc2d-led-activity' : '')}
              opacity={device.status === 'online' ? 0.95 : 0.3}
            />
            <text x={5.5} y={0} dominantBaseline="middle" fontSize={3} fill="#a1a1aa" fontFamily="monospace">{lbl}</text>
          </g>
        ))}
        <g transform={`translate(30, 7)`}>
          <circle r={3.5} fill={brand.stripe} stroke={brand.bezel} strokeWidth={0.6} />
          <circle
            r={1.8}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1}
            opacity={device.status === 'online' ? 1 : 0.35}
            className={device.status === 'online' ? 'dc2d-led-online' : ''}
          />
        </g>
        <rect x={16} y={height - 9} width={7} height={3} fill="#050608" stroke={brand.bezel} strokeWidth={0.3} rx={0.6} />
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={5} />
      )}
    </g>
  );
}

function detectBayCount(device) {
  const name = (device.name || '').toLowerCase();
  const m = name.match(/ds(\d)/);
  if (m) return parseInt(m[1], 10);
  if (/1520/.test(name)) return 5;
  if (/1821/.test(name) || /1823/.test(name)) return 8;
  if (/1621/.test(name)) return 6;
  return 4;
}

function extractModel(name) {
  if (!name) return '';
  const m = name.match(/(DS\d{3,4}\+?|RS\d{3,4}\+?)/i);
  return m ? m[1] : name.length > 14 ? name.substring(0, 12) + '…' : name;
}
