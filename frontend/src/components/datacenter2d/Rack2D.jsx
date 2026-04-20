import Device2D from './Device2D';
import {
  U_PX,
  RACK_INNER_WIDTH_PX,
  U_LABEL_WIDTH_PX,
  RACK_PADDING_PX,
  PALETTE,
} from './constants';

/**
 * Rack 2D style élévation DCIM.
 *   - Cadre noir mat avec vis aux 4 coins
 *   - Colonne numéros U à gauche (42 → 1 du haut vers le bas)
 *   - Zone intérieure noire avec lignes de séparation par U
 *   - Équipements rendus au bon uStart + uSize (+ slot left/right)
 *   - Badge nom + stats en haut
 *
 * Les équipements en depth=back (au fond du rack) sont légèrement
 * translucides pour signaler leur position arrière ; ceux depth=front
 * sont opaques et au premier plan.
 */
export default function Rack2D({
  rack,
  devices = [],
  selectedDeviceId,
  selectedRackId,
  onSelectDevice,
  onSelectRack,
}) {
  const rackU = rack.uSize || 42;
  const innerH = rackU * U_PX;
  const totalW = U_LABEL_WIDTH_PX + RACK_INNER_WIDTH_PX + RACK_PADDING_PX * 2 + 8;
  const totalH = innerH + 60; // header + footer

  const innerX = U_LABEL_WIDTH_PX + RACK_PADDING_PX;
  const innerY = 28;
  const selected = selectedRackId === rack.id;

  // Trie les équipements : back d'abord (dessiné dessous), puis front/full
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
    >
      {/* Badge nom du rack */}
      <g
        onClick={(e) => { e.stopPropagation(); onSelectRack?.(rack); }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={0} y={0}
          width={totalW} height={24}
          fill={selected ? '#1e3a5f' : PALETTE.rackFrame}
          stroke={selected ? '#3b82f6' : PALETTE.rackFrameEdge}
          strokeWidth={0.5}
          rx={2}
        />
        <text
          x={8} y={16}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={PALETTE.labelLight}
          letterSpacing={0.5}
        >
          {rack.name}
        </text>
        <text
          x={totalW - 8} y={16}
          textAnchor="end"
          fontSize={9}
          fontFamily="monospace"
          fill={PALETTE.labelDim}
        >
          {rackU}U · {devices.length} équip.
        </text>
      </g>

      {/* Cadre rack */}
      <rect
        x={0} y={innerY - 2}
        width={totalW} height={innerH + 4}
        fill={PALETTE.rackFrame}
        stroke={PALETTE.rackFrameEdge}
        strokeWidth={1}
        rx={2}
      />

      {/* Intérieur noir */}
      <rect
        x={innerX} y={innerY}
        width={RACK_INNER_WIDTH_PX} height={innerH}
        fill={PALETTE.rackInner}
      />

      {/* Vis aux 4 coins (détails réalistes) */}
      {[
        [4, innerY + 3],
        [totalW - 4, innerY + 3],
        [4, innerY + innerH - 3],
        [totalW - 4, innerY + innerH - 3],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={2} fill={PALETTE.rackFrameEdge} />
          <circle cx={cx} cy={cy} r={1.2} fill={PALETTE.rackFrame} />
          <line x1={cx - 0.8} y1={cy} x2={cx + 0.8} y2={cy} stroke={PALETTE.rackFrameEdge} strokeWidth={0.4} />
        </g>
      ))}

      {/* Numéros d'U + lignes de séparation */}
      {Array.from({ length: rackU }).map((_, i) => {
        const uNum = rackU - i; // haut = U42, bas = U1
        const y = innerY + i * U_PX;
        const major = uNum % 5 === 0;
        return (
          <g key={`u-${uNum}`}>
            {/* Ligne de séparation */}
            <line
              x1={innerX}
              x2={innerX + RACK_INNER_WIDTH_PX}
              y1={y}
              y2={y}
              stroke={major ? PALETTE.uLineMajor : PALETTE.uLineMinor}
              strokeWidth={major ? 0.8 : 0.4}
              opacity={major ? 1 : 0.6}
            />
            {/* Numéro U à gauche */}
            <text
              x={U_LABEL_WIDTH_PX - 6}
              y={y + U_PX / 2 + 3}
              textAnchor="end"
              fontSize={7}
              fontFamily="monospace"
              fill={major ? PALETTE.uLabelText : PALETTE.labelDim}
              fontWeight={major ? 700 : 400}
            >
              {uNum}
            </text>
            {/* Marquage rail */}
            {major && (
              <>
                <rect x={innerX - 2} y={y} width={2} height={U_PX} fill={PALETTE.rackFrameEdge} />
                <rect x={innerX + RACK_INNER_WIDTH_PX} y={y} width={2} height={U_PX} fill={PALETTE.rackFrameEdge} />
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
        stroke={PALETTE.uLineMajor}
        strokeWidth={0.8}
      />

      {/* Équipements */}
      {sorted.map((device) => {
        const u       = device.uStart || 1;
        const uSize   = device.uSize || 1;
        const slot    = device.slot || 'full';
        const depth   = device.depth || 'full';
        // y = haut du device (rackU - uEnd + 1) * U_PX
        const uEnd    = u + uSize - 1;
        const y       = innerY + (rackU - uEnd) * U_PX;
        const height  = uSize * U_PX - 1;

        let width = RACK_INNER_WIDTH_PX;
        let x     = innerX;
        if (slot === 'left')  { width = RACK_INNER_WIDTH_PX / 2 - 2; }
        if (slot === 'right') { width = RACK_INNER_WIDTH_PX / 2 - 2; x = innerX + RACK_INNER_WIDTH_PX / 2 + 2; }

        return (
          <g key={device.id} opacity={depth === 'back' ? 0.55 : 1}>
            <Device2D
              device={device}
              x={x}
              y={y}
              width={width}
              height={height}
              selected={selectedDeviceId === device.id}
              onSelect={onSelectDevice}
            />
            {/* Marqueur visuel pour les équipements au fond (petit triangle coin sup droit) */}
            {depth === 'back' && (
              <g transform={`translate(${x + width - 6}, ${y + 1})`}>
                <path d="M 0 0 L 5 0 L 5 5 Z" fill="#38bdf8" opacity={0.7} />
              </g>
            )}
          </g>
        );
      })}

      {/* Zones vides signalées discrètement : rien à faire, le fond noir suffit */}

      {/* Footer statut du rack */}
      <g transform={`translate(0, ${innerY + innerH + 6})`}>
        <rect x={0} y={0} width={totalW} height={22} fill={PALETTE.rackFrame} rx={2} />
        <text
          x={8} y={15}
          fontSize={9}
          fontFamily="monospace"
          fill={PALETTE.labelDim}
        >
          {countByStatus(devices)}
        </text>
      </g>
    </svg>
  );
}

function countByStatus(devices) {
  const counts = { online: 0, warning: 0, critical: 0, offline: 0 };
  devices.forEach((d) => {
    if (counts[d.status] !== undefined) counts[d.status]++;
  });
  return `● ${counts.online} online · ⚠ ${counts.warning} · ✖ ${counts.critical} · ○ ${counts.offline}`;
}
