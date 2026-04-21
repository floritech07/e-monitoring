import { getPalette } from '../constants';

/**
 * Étagère passive — plaque métallique perforée arrondie.
 */
export default function ShelfPanel({ P, theme, width, height, selected, hovered }) {
  const palette = P || getPalette(theme);
  return (
    <g>
      <defs>
        <linearGradient id="shelf-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.rackFrameLite} />
          <stop offset="100%" stopColor={palette.rackFrame} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill="url(#shelf-grad)" rx={3} />
      <rect x={0} y={0} width={width} height={1.5} fill={palette.rackFrame} rx={2} />
      <rect x={0} y={height - 1.5} width={width} height={1.5} fill={palette.rackFrame} rx={2} />

      {/* Perforations */}
      <g>
        {Array.from({ length: Math.floor(width / 14) }).map((_, i) =>
          Array.from({ length: Math.max(1, Math.floor(height / 4)) }).map((_, j) => (
            <circle
              key={`perf-${i}-${j}`}
              cx={10 + i * 14}
              cy={3 + j * 4}
              r={0.7}
              fill={palette.rackFrameEdge}
              opacity={0.85}
            />
          ))
        )}
      </g>

      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.8} rx={3} />
      )}
    </g>
  );
}
