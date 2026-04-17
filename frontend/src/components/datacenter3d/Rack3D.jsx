import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import Device3D from './Device3D';
import {
  U_HEIGHT_M,
  RACK_WIDTH_M,
  RACK_DEPTH_M,
  RACK_FRAME_THICKNESS,
  RACK_BOTTOM_OFFSET_M,
  COLORS,
} from './constants';

/**
 * Représentation 3D d'un rack et de ses équipements.
 *
 * Structure :
 *  - pieds + cadre extérieur (4 montants + toit)
 *  - compartiment intérieur sombre
 *  - liste de <Device3D> positionnés selon leur plage U
 *  - étiquette flottante avec le nom du rack
 */
export default function Rack3D({ rack, selected, selectedDeviceId, onSelectRack, onSelectDevice }) {
  const uHeight = rack.uHeight || 42;
  const totalHeight = RACK_BOTTOM_OFFSET_M * 2 + uHeight * U_HEIGHT_M;

  // Coordonnées plancher
  const x = rack.coords?.x ?? 0;
  const z = rack.coords?.z ?? 0;
  const rotY = ((rack.orientation || 0) * Math.PI) / 180;

  const frameColor = selected ? COLORS.rackFrameLit : COLORS.rackFrame;

  // Lignes de séparation entre chaque U (petites rainures sur les montants)
  const uLines = useMemo(() => {
    const lines = [];
    for (let i = 1; i < uHeight; i++) {
      lines.push(RACK_BOTTOM_OFFSET_M + i * U_HEIGHT_M);
    }
    return lines;
  }, [uHeight]);

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Cadre extérieur : une boîte creuse simulée avec 5 faces */}
      <group>
        {/* Fond (dos du rack) */}
        <mesh position={[0, totalHeight / 2, RACK_DEPTH_M / 2 - RACK_FRAME_THICKNESS / 2]} castShadow>
          <boxGeometry args={[RACK_WIDTH_M, totalHeight, RACK_FRAME_THICKNESS]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Toit */}
        <mesh position={[0, totalHeight - RACK_FRAME_THICKNESS / 2, 0]} castShadow>
          <boxGeometry args={[RACK_WIDTH_M, RACK_FRAME_THICKNESS, RACK_DEPTH_M]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Montant gauche */}
        <mesh position={[-RACK_WIDTH_M / 2 + RACK_FRAME_THICKNESS / 2, totalHeight / 2, 0]} castShadow>
          <boxGeometry args={[RACK_FRAME_THICKNESS, totalHeight, RACK_DEPTH_M]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Montant droit */}
        <mesh position={[RACK_WIDTH_M / 2 - RACK_FRAME_THICKNESS / 2, totalHeight / 2, 0]} castShadow>
          <boxGeometry args={[RACK_FRAME_THICKNESS, totalHeight, RACK_DEPTH_M]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Plancher du rack */}
        <mesh position={[0, RACK_FRAME_THICKNESS / 2, 0]} receiveShadow>
          <boxGeometry args={[RACK_WIDTH_M, RACK_FRAME_THICKNESS, RACK_DEPTH_M]} />
          <meshStandardMaterial color={frameColor} roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* Repères visuels des unités U — fins traits sombres en façade */}
      {uLines.map((y, i) => (
        <mesh key={i} position={[0, y, -RACK_DEPTH_M / 2 + RACK_FRAME_THICKNESS + 0.001]}>
          <boxGeometry args={[RACK_WIDTH_M - RACK_FRAME_THICKNESS * 2, 0.001, 0.002]} />
          <meshBasicMaterial color={COLORS.uSlotLine} />
        </mesh>
      ))}

      {/* Zone cliquable "rack entier" : une petite surface invisible sur le dessus */}
      <mesh
        position={[0, totalHeight + 0.02, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectRack?.(rack); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[RACK_WIDTH_M * 0.9, 0.02, RACK_DEPTH_M * 0.9]} />
        <meshStandardMaterial
          color={selected ? COLORS.selection : COLORS.rackFrameLit}
          emissive={selected ? COLORS.selection : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>

      {/* Étiquette flottante */}
      <Text
        position={[0, totalHeight + 0.18, 0]}
        fontSize={0.08}
        color={COLORS.label}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#000000"
      >
        {rack.name}
      </Text>
      <Text
        position={[0, totalHeight + 0.1, 0]}
        fontSize={0.045}
        color="#8e8e8e"
        anchorX="center"
        anchorY="middle"
      >
        {rack.uHeight}U · {rack.devices.length} équip.
      </Text>

      {/* Équipements montés */}
      {rack.devices.map((device) => (
        <Device3D
          key={device.id}
          device={device}
          selected={selectedDeviceId === device.id}
          onSelect={onSelectDevice}
        />
      ))}
    </group>
  );
}
