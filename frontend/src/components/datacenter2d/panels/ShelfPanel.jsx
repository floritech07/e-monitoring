import { PALETTE } from '../constants';

/**
 * Étagère passive — simple plaque métallique perforée avec 2 lattes avant/arrière.
 */
export default function ShelfPanel({ width, height, selected, hovered }) {
  return (
    <g>
      {/* Plaque principale */}
      <rect x={0} y={0} width={width} height={height} fill="#1a1d22" rx={0.5} />
      {/* Liseré avant (bord arrondi) */}
      <rect x={0} y={0} width={width} height={1.2} fill={PALETTE.rackFrame} />
      <rect x={0} y={height - 1.2} width={width} height={1.2} fill={PALETTE.rackFrame} />
      {/* Grille de perforations (aération) */}
      <g>
        {Array.from({ length: Math.floor(width / 12) }).map((_, i) =>
          Array.from({ length: Math.max(1, Math.floor(height / 3)) }).map((_, j) => (
            <circle
              key={`perf-${i}-${j}`}
              cx={8 + i * 12}
              cy={2 + j * 3}
              r={0.6}
              fill="#0a0c0f"
              opacity={0.8}
            />
          ))
        )}
      </g>
      {/* Halo */}
      {(selected || hovered) && (
        <rect x={0} y={0} width={width} height={height} fill="none" stroke={selected ? '#3b82f6' : '#60a5fa'} strokeWidth={1.5} rx={0.5} />
      )}
    </g>
  );
}
