import { useRef, useState } from 'react';
import Device2D from './Device2D';
import {
  U_PX,
  RACK_INNER_WIDTH_PX,
  U_LABEL_WIDTH_PX,
  RACK_PADDING_PX,
  RADIUS,
  getPalette,
} from './constants';
import { canPlaceAt } from './conflicts';
import { useTheme } from './useTheme';

/**
 * Rack 2D style élévation DCIM avec drag & drop.
 *
 * Interaction équipements :
 *   - clic → sélection (remonte onSelectDevice)
 *   - pointer-down + drag vertical → déplace l'équipement vers un autre U
 *     * ghost vert → cible valide (rentre sans conflit)
 *     * ghost rouge → cible invalide (chevauchement)
 *     * drop valide → appelle onMoveDevice(deviceId, newUStart)
 *     * drop invalide ou < 4px → annule + sélection classique
 *
 * Les équipements depth=back sont dessinés en premier (au fond) et légèrement
 * translucides. Slot left/right s'affichent côte à côte.
 */
export default function Rack2D({
  rack,
  devices = [],
  selectedDeviceId,
  selectedRackId,
  onSelectDevice,
  onSelectRack,
  onMoveDevice,
  side = 'front',     // 'front' | 'back' — face visible des équipements
}) {
  const theme = useTheme();
  const P     = getPalette(theme);
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const rackU = rack.uSize || 42;
  const innerH = rackU * U_PX;
  const totalW = U_LABEL_WIDTH_PX + RACK_INNER_WIDTH_PX + RACK_PADDING_PX * 2 + 12;
  const headerH = 28;
  const footerH = 24;
  const totalH = headerH + innerH + footerH + 8;

  const innerX = U_LABEL_WIDTH_PX + RACK_PADDING_PX;
  const innerY = headerH + 4;
  const selected = selectedRackId === rack.id;

  // En vue façade : 'back' est au fond (dessiné en 1er, translucide) ; 'front' devant.
  // En vue fond   : 'front' est au fond (dessiné en 1er, translucide) ; 'back' devant.
  const farDepth = side === 'back' ? 'front' : 'back';
  const sorted = [...devices].sort((a, b) => {
    const order = (d) => d === farDepth ? 0 : d === 'full' || !d ? 1 : 2;
    return order(a.depth) - order(b.depth);
  });

  // ─── DRAG & DROP ────────────────────────────────────────────────────────
  function handleDeviceDown(device, e) {
    e.stopPropagation();
    try { svgRef.current?.setPointerCapture?.(e.pointerId); } catch {}
    setDrag({
      device,
      pointerId: e.pointerId,
      startClientY: e.clientY,
      originU: device.uStart,
      currentU: device.uStart,
      valid: true,
      moved: false,
    });
  }

  function handlePointerMove(e) {
    if (!drag) return;
    const dy = e.clientY - drag.startClientY;
    const uShift = Math.round(-dy / U_PX); // Y ↑ = U ↑
    const maxU = rackU - drag.device.uSize + 1;
    const newU = Math.max(1, Math.min(maxU, drag.originU + uShift));
    const moved = Math.abs(dy) > 5;
    const valid = canPlaceAt(drag.device, newU, devices, rackU);
    if (newU === drag.currentU && moved === drag.moved && valid === drag.valid) return;
    setDrag({ ...drag, currentU: newU, moved, valid });
  }

  function handlePointerUp(e) {
    if (!drag) return;
    try { svgRef.current?.releasePointerCapture?.(drag.pointerId); } catch {}
    if (!drag.moved) {
      // Simple click → sélection
      onSelectDevice?.(drag.device);
    } else if (drag.valid && drag.currentU !== drag.originU) {
      // Drop valide → notifier le parent
      onMoveDevice?.(drag.device.id, drag.currentU);
    }
    setDrag(null);
  }

  function handlePointerCancel() {
    setDrag(null);
  }

  // Position Y (haut) d'un équipement en fonction de son uStart + uSize
  function yOf(uStart, uSize) {
    const uEnd = uStart + uSize - 1;
    return innerY + (rackU - uEnd) * U_PX;
  }

  return (
    <svg
      ref={svgRef}
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ display: 'block', userSelect: 'none', touchAction: 'none' }}
      className="dc2d-rack-frame"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
    >
      {/* Gradients */}
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

      {/* Badge nom du rack */}
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
          {rackU}U · {devices.length} équip. · {side === 'back' ? 'FOND' : 'FAÇADE'}
        </text>
      </g>

      {/* Cadre rack */}
      <rect
        x={0} y={innerY - 3}
        width={totalW} height={innerH + 10}
        fill={`url(#grad-frame-${rack.id})`}
        stroke={P.rackFrameEdge}
        strokeWidth={1}
        rx={RADIUS.rack}
      />

      {/* Intérieur sombre */}
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

      {/* Numéros d'U + lignes */}
      {Array.from({ length: rackU }).map((_, i) => {
        const uNum = rackU - i;
        const y = innerY + i * U_PX;
        const major = uNum % 5 === 0;
        // Highlight du numéro U ciblé pendant un drag
        const isTargetU = drag?.moved && uNum >= drag.currentU && uNum < drag.currentU + drag.device.uSize;
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
              fill={isTargetU ? (drag.valid ? '#22c55e' : '#ef4444') : (major ? P.uLabelMajor : P.uLabelText)}
              fontWeight={major || isTargetU ? 700 : 400}
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
        const isDragging = drag?.device.id === device.id;
        const effectiveU = isDragging && drag.moved ? drag.currentU : device.uStart;
        const uSize = device.uSize || 1;
        const slot  = device.slot || 'full';
        const depth = device.depth || 'full';
        const y = yOf(effectiveU, uSize) + 1;
        const height = uSize * U_PX - 2;

        let width = RACK_INNER_WIDTH_PX - 4;
        let x     = innerX + 2;
        if (slot === 'left')  { width = (RACK_INNER_WIDTH_PX - 6) / 2; }
        if (slot === 'right') { width = (RACK_INNER_WIDTH_PX - 6) / 2; x = innerX + (RACK_INNER_WIDTH_PX + 2) / 2; }

        return (
          <g
            key={device.id}
            opacity={depth === farDepth && !isDragging ? 0.55 : 1}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => handleDeviceDown(device, e)}
          >
            <Device2D
              device={device}
              x={x}
              y={y}
              width={width}
              height={height}
              theme={theme}
              side={side}
              selected={selectedDeviceId === device.id && !isDragging}
              onSelect={null}
            />
            {/* Marqueur "équipement côté opposé" (dimmed car regardé de l'autre face) */}
            {depth === farDepth && !isDragging && (
              <g transform={`translate(${x + width - 8}, ${y + 2})`}>
                <path d="M 0 0 L 6 0 L 6 6 Z" fill="#38bdf8" opacity={0.8} />
              </g>
            )}
            {/* Bordure visuelle pendant le drag (vert/rouge selon validité) */}
            {isDragging && drag.moved && (
              <rect
                x={x - 1} y={y - 1}
                width={width + 2} height={height + 2}
                fill="none"
                stroke={drag.valid ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                strokeDasharray="4 3"
                rx={5}
              >
                <animate attributeName="stroke-dashoffset" from="0" to="14" dur="0.8s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        );
      })}

      {/* Ghost de la position d'origine pendant le drag (rectangle pointillé) */}
      {drag && drag.moved && (() => {
        const d = drag.device;
        const y0 = yOf(d.uStart, d.uSize) + 1;
        const h0 = d.uSize * U_PX - 2;
        let w0 = RACK_INNER_WIDTH_PX - 4;
        let x0 = innerX + 2;
        if (d.slot === 'left')  { w0 = (RACK_INNER_WIDTH_PX - 6) / 2; }
        if (d.slot === 'right') { w0 = (RACK_INNER_WIDTH_PX - 6) / 2; x0 = innerX + (RACK_INNER_WIDTH_PX + 2) / 2; }
        return (
          <rect
            x={x0} y={y0}
            width={w0} height={h0}
            fill="rgba(100, 116, 139, 0.12)"
            stroke="rgba(100, 116, 139, 0.5)"
            strokeWidth={1}
            strokeDasharray="2 2"
            rx={4}
            pointerEvents="none"
          />
        );
      })()}

      {/* Footer */}
      <g transform={`translate(0, ${innerY + innerH + 8})`}>
        <rect x={0} y={0} width={totalW} height={footerH} fill={P.rackFrame} stroke={P.badgeBorder} strokeWidth={0.5} rx={RADIUS.rack} />
        <text
          x={12} y={footerH / 2 + 4}
          fontSize={10}
          fontFamily="monospace"
          fill={P.labelDim}
        >
          {drag?.moved ? dragStatus(drag) : countByStatus(devices)}
        </text>
      </g>
    </svg>
  );
}

function countByStatus(devices) {
  const counts = { online: 0, warning: 0, critical: 0, offline: 0 };
  devices.forEach((d) => { if (counts[d.status] !== undefined) counts[d.status]++; });
  return `● ${counts.online} online · ⚠ ${counts.warning} · ✖ ${counts.critical} · ○ ${counts.offline}`;
}

function dragStatus(drag) {
  const d = drag.device;
  const endU = drag.currentU + d.uSize - 1;
  if (!drag.valid) return `✖ U${drag.currentU}${d.uSize > 1 ? `–U${endU}` : ''} occupé`;
  if (drag.currentU === drag.originU) return `↕ relâcher pour annuler`;
  return `→ déplacer à U${drag.currentU}${d.uSize > 1 ? `–U${endU}` : ''}`;
}
