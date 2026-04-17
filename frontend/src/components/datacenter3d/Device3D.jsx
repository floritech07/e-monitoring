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
 * Repère local : placé dans le repère du rack (parent), axe Y vers le haut.
 * Le device s'étale de (uStart) à (uStart + uSize - 1), compté depuis le bas.
 */
export default function Device3D({ device, selected, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const uStart = device.uStart || 1;
  const uSize  = device.uSize  || 1;

  const height = uSize * U_HEIGHT_M * 0.95; // 5% d'air entre deux équipements
  const yCenter = RACK_BOTTOM_OFFSET_M + (uStart - 1) * U_HEIGHT_M + height / 2;

  const baseColor = device.color || '#4a90e2';
  const emissive  = selected ? COLORS.selection : hovered ? COLORS.hover : '#000000';
  const emissiveIntensity = selected ? 0.5 : hovered ? 0.35 : 0;

  return (
    <group position={[0, yCenter, 0]}>
      <mesh
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={(e) => { e.stopPropagation(); onSelect?.(device); }}
      >
        <boxGeometry args={[RACK_INNER_WIDTH_M, height, RACK_INNER_DEPTH_M]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Petit voyant LED de statut en façade (face -Z = avant du rack) */}
      <mesh position={[RACK_INNER_WIDTH_M / 2 - 0.04, 0, -RACK_INNER_DEPTH_M / 2 - 0.001]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshStandardMaterial
          color={statusColor(device.status)}
          emissive={statusColor(device.status)}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Tooltip HTML au survol — affiche nom + plage U + état */}
      {(hovered || selected) && (
        <Html
          position={[0, height / 2 + 0.03, -RACK_INNER_DEPTH_M / 2]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div style={tooltipStyle}>
            <div style={{ fontWeight: 700 }}>{device.name}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>
              U{uStart}{uSize > 1 ? `–U${uStart + uSize - 1}` : ''} · {device.type}
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
