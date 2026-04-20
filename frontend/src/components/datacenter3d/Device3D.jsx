import { useState } from 'react';
import { Html } from '@react-three/drei';
import {
  U_HEIGHT_M,
  RACK_INNER_WIDTH_M,
  RACK_INNER_DEPTH_M,
  RACK_BOTTOM_OFFSET_M,
  COLORS,
  statusColor,
} from './constants';

/**
 * Représentation 3D d'un équipement monté sur un rack.
 *
 * Gère le montage réel :
 *   - slot     : full (toute la largeur) | left | right
 *   - depth    : full (toute la profondeur) | front | back
 *   - mounting : rail (sur rails 19") | shelf (étagère horizontale) | loose (posé)
 *
 * Les équipements "shelf" rendent une étagère fine ; les "loose" flottent
 * légèrement au-dessus pour laisser deviner qu'ils sont posés.
 */
export default function Device3D({ device, selected, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const uStart = device.uStart || 1;
  const uSize  = device.uSize  || 1;
  const slot     = device.slot     || 'full';
  const depth    = device.depth    || 'full';
  const mounting = device.mounting || 'rail';

  // ─── Calcul des dimensions physiques ─────────────────────────────────────
  const heightRail  = uSize * U_HEIGHT_M * 0.95;   // classique sur rails
  const heightShelf = Math.min(U_HEIGHT_M * 0.4, 0.015); // étagère fine (~1/2 U)
  const heightLoose = Math.min(uSize * U_HEIGHT_M * 0.85, 0.2); // objet posé, plus petit

  const height = mounting === 'shelf' ? heightShelf
               : mounting === 'loose' ? heightLoose
               : heightRail;

  const width  = slot  === 'full'  ? RACK_INNER_WIDTH_M : RACK_INNER_WIDTH_M / 2 - 0.005;
  const meshDepth = depth === 'full' ? RACK_INNER_DEPTH_M : RACK_INNER_DEPTH_M / 2 - 0.01;

  const xOffset = slot === 'left'  ? -RACK_INNER_WIDTH_M / 4
                : slot === 'right' ?  RACK_INNER_WIDTH_M / 4
                : 0;
  const zOffset = depth === 'front' ? -RACK_INNER_DEPTH_M / 4
                : depth === 'back'  ?  RACK_INNER_DEPTH_M / 4
                : 0;

  // ─── Position verticale selon le mode de montage ─────────────────────────
  // Étagère = collée au bas de la plage U. Loose = posée sur l'étagère (+2cm).
  const uRangeBottom = RACK_BOTTOM_OFFSET_M + (uStart - 1) * U_HEIGHT_M;
  const uRangeCenter = uRangeBottom + (uSize * U_HEIGHT_M) / 2;
  const yCenter = mounting === 'shelf' ? uRangeBottom + height / 2
                : mounting === 'loose' ? uRangeBottom + heightShelf + height / 2 + 0.005
                : uRangeCenter;

  const baseColor = device.color || '#4a90e2';
  const emissive  = selected ? COLORS.selection : hovered ? COLORS.hover : '#000000';
  const emissiveIntensity = selected ? 0.5 : hovered ? 0.35 : 0;

  // Position façade (en z local) où positionner la LED de statut
  const ledZ = depth === 'back' ? meshDepth / 2 + 0.001 : -meshDepth / 2 - 0.001;

  return (
    <group position={[xOffset, yCenter, zOffset]}>
      <mesh
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); onSelect?.(device); }}
      >
        <boxGeometry args={[width, height, meshDepth]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={mounting === 'shelf' ? 0.5 : 0.6}
          metalness={mounting === 'shelf' ? 0.7 : 0.3}
        />
      </mesh>

      {/* Voyant LED uniquement pour les équipements "actifs" (pas les étagères) */}
      {mounting !== 'shelf' && (
        <mesh position={[width / 2 - 0.04, 0, ledZ]}>
          <sphereGeometry args={[0.008, 12, 12]} />
          <meshStandardMaterial
            color={statusColor(device.status)}
            emissive={statusColor(device.status)}
            emissiveIntensity={1.2}
          />
        </mesh>
      )}

      {(hovered || selected) && (
        <Html
          position={[0, height / 2 + 0.03, -meshDepth / 2]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={tooltipStyle}>
            <div style={{ fontWeight: 700 }}>{device.name}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>
              U{uStart}{uSize > 1 ? `–U${uStart + uSize - 1}` : ''}
              {slot !== 'full' && ` · ${slot === 'left' ? 'gauche' : 'droite'}`}
              {depth !== 'full' && ` · ${depth === 'front' ? 'façade' : 'fond'}`}
              {mounting !== 'rail' && ` · ${mounting === 'shelf' ? 'étagère' : 'posé'}`}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

const tooltipStyle = {
  background: 'rgba(15, 17, 21, 0.92)',
  color: '#e8eaf0',
  padding: '4px 8px',
  borderRadius: 3,
  border: '1px solid #2c3235',
  fontSize: 11,
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
};
