import Device2D from './Device2D';
import {
  U_PX,
  RACK_INNER_WIDTH_PX,
  U_LABEL_WIDTH_PX,
  RACK_PADDING_PX,
  RADIUS,
  getPalette,
} from './constants';
import { useTheme } from './useTheme';

/**
 * Rack 2D style élévation DCIM.
 *   - Cadre arrondi (gris foncé en dark, gris acier brossé en light)
 *   - Colonne numéros U à gauche (42 → 1 du haut vers le bas)
 *   - Zone intérieure sombre (réaliste : l'intérieur d'un rack reste sombre)
 *   - Équipements rendus au bon uStart + uSize (+ slot left/right)
 *   - Badge nom cliquable + footer stats
 *
 * Les équipements en depth=back sont légèrement translucides pour signaler
 * leur position arrière ; ceux depth=front sont opaques et au premier plan.
 */
export default function Rack2D({
  rack,
  devices = [],
  selectedDeviceId,
  selectedRackId,
  onSelectDevice,
  onSelectRack,
}) {
  const theme = useTheme();
  const P     = getPalette(theme);

  const rackU = rack.uSize || 42;
  const innerH = rackU * U_PX;
  const totalW = U_LABEL_WIDTH_PX + RACK_INNER_WIDTH_PX + RACK_PADDING_PX * 2 + 12;
  const headerH = 28;
  const footerH = 24;
  const totalH = headerH + innerH + footerH + 8;

  const innerX = U_LABEL_WIDTH_PX + RACK_PADDING_PX;
  const innerY = headerH + 4;
  const selected = selectedRackId === rack.id;

  // Trie : back d'abord (dessiné dessous), puis front/full
  const sorted = [...devices].sort((a, b) => {
    const depthOrder = { back: 0, full: 1, front: 2 };
    return (depthOrder[a.depth || 'full'] ?? 1) - (depthOrder[b.depth || 'full'] ?? 1);
  });

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ display: 'block', userSelect: 'none' }}
      className="dc2d-rack-frame"
    >
      {/* Gradient subtil sur le cadre pour donner du relief */}
      <defs>
        <linearGradient id={`grad-frame-${rack.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.rackFrameLite} />
          <stop offset="100%" stopColor={P.rackFrame} />
        </linearGradient>
        <linearGradient id={`grad-header-${rack.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={selected ? '#3b82f6' : P.rackFrameLite} />
          <stop offset="100%" stopColor={selected ? '#1e40af' : P.rackFrame} />
        </linearGradient>
      </defs>

      {/* Badge nom du rack (cliquable) */}
      <g
        onClick={(e) => { e.stopPropagation(); onSelectRack?.(rack); }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={0} y={0}
          width={totalW} height={headerH}
          fill={`url(#grad-header-${rack.id})`}
          stroke={selected ? '#60a5fa' : P.badgeBorder}
          strokeWidth={selected ? 1.2 : 0.8}
          rx={RADIUS.rack}
        />
        <text
          x={12} y={headerH / 2 + 4}
          fontSize={12}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={selected ? '#ffffff' : P.labelLight}
          letterSpacing={0.3}
        >
          {rack.name}
        </text>
        <text
          x={totalW - 12} y={headerH / 2 + 4}
          textAnchor="end"
          fontSize={10}
          fontFamily="monospace"
          fill={selected ? '#dbeafe' : P.labelDim}
        >
          {rackU}U · {devices.length} équip.
        </text>
      </g>

      {/* Cadre rack (gradient + arrondi) */}
      <rect
        x={0} y={innerY - 3}
        width={totalW} height={innerH + 10}
        fill={`url(#grad-frame-${rack.id})`}
        stroke={P.rackFrameEdge}
        strokeWidth={1}
        rx={RADIUS.rack}
      />

      {/* Intérieur sombre du rack */}
      <rect
        x={innerX} y={innerY}
        width={RACK_INNER_WIDTH_PX} height={innerH}
        fill={P.rackInner}
        rx={2}
      />

      {/* Vis aux 4 coins */}
      {[
        [8, innerY + 4],
        [totalW - 8, innerY + 4],
        [8, innerY + innerH - 4],
        [totalW - 8, innerY + innerH - 4],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={2.5} fill={P.rackFrameEdge} />
          <circle cx={cx} cy={cy} r={1.5} fill={P.rackFrameLite} />
          <line x1={cx - 1} y1={cy} x2={cx + 1} y2={cy} stroke={P.rackFrameEdge} strokeWidth={0.5} />
        </g>
      ))}

      {/* Numéros d'U + lignes de séparation */}
      {Array.from({ length: rackU }).map((_, i) => {
        const uNum = rackU - i;
        const y = innerY + i * U_PX;
        const major = uNum % 5 === 0;
        return (
          <g key={`u-${uNum}`}>
            <line
              x1={innerX}
              x2={innerX + RACK_INNER_WIDTH_PX}
              y1={y}
              y2={y}
              stroke={major ? P.uLineMajor : P.uLineMinor}
              strokeWidth={major ? 0.8 : 0.4}
              opacity={major ? 1 : 0.7}
            />
            <text
              x={U_LABEL_WIDTH_PX - 6}
              y={y + U_PX / 2 + 3.5}
              textAnchor="end"
              fontSize={8}
              fontFamily="monospace"
              fill={major ? P.uLabelMajor : P.uLabelText}
              fontWeight={major ? 700 : 400}
            >
              {uNum}
            </text>
            {major && (
              <>
                <rect x={innerX - 3} y={y} width={3} height={U_PX} fill={P.rackFrameEdge} rx={0.5} />
                <rect x={innerX + RACK_INNER_WIDTH_PX} y={y} width={3} height={U_PX} fill={P.rackFrameEdge} rx={0.5} />
              </>
            )}
          </g>
        );
      })}

      {/* Ligne basse finale */}
      <line
        x1={innerX}
        x2={innerX + RACK_INNER_WIDTH_PX}
        y1={innerY + innerH}
        y2={innerY + innerH}
        stroke={P.uLineMajor}
        strokeWidth={0.8}
      />

      {/* Équipements */}
      {sorted.map((device) => {
        const u       = device.uStart || 1;
        const uSize   = device.uSize || 1;
        const slot    = device.slot || 'full';
        const depth   = device.depth || 'full';
        const uEnd    = u + uSize - 1;
        const y       = innerY + (rackU - uEnd) * U_PX;
        const height  = uSize * U_PX - 2;

        let width = RACK_INNER_WIDTH_PX - 4;
        let x     = innerX + 2;
        if (slot === 'left')  { width = (RACK_INNER_WIDTH_PX - 6) / 2; }
        if (slot === 'right') { width = (RACK_INNER_WIDTH_PX - 6) / 2; x = innerX + (RACK_INNER_WIDTH_PX + 2) / 2; }

        return (
          <g key={device.id} opacity={depth === 'back' ? 0.55 : 1}>
            <Device2D
              device={device}
              x={x}
              y={y + 1}
              width={width}
              height={height}
              theme={theme}
              selected={selectedDeviceId === device.id}
              onSelect={onSelectDevice}
            />
            {depth === 'back' && (
              <g transform={`translate(${x + width - 8}, ${y + 2})`}>
                <path d="M 0 0 L 6 0 L 6 6 Z" fill="#38bdf8" opacity={0.8} />
              </g>
            )}
          </g>
        );
      })}

      {/* Footer statut du rack */}
      <g transform={`translate(0, ${innerY + innerH + 8})`}>
        <rect x={0} y={0} width={totalW} height={footerH} fill={P.rackFrame} stroke={P.badgeBorder} strokeWidth={0.5} rx={RADIUS.rack} />
        <text
          x={12} y={footerH / 2 + 4}
          fontSize={10}
          fontFamily="monospace"
          fill={P.labelDim}
        >
          {countByStatus(devices, P)}
        </text>
      </g>
    </svg>
  );
}

function countByStatus(devices, P) {
  const counts = { online: 0, warning: 0, critical: 0, offline: 0 };
  devices.forEach((d) => {
    if (counts[d.status] !== undefined) counts[d.status]++;
  });
  return `● ${counts.online} online · ⚠ ${counts.warning} · ✖ ${counts.critical} · ○ ${counts.offline}`;
}
