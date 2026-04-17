import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Floor from './Floor';
import Rack3D from './Rack3D';

/**
 * Scène 3D complète : caméra orbitale, éclairage, sol, racks.
 * Ne se soucie pas du chargement des données — on lui passe la room déjà prête.
 */
export default function DatacenterScene({
  room,
  selectedRackId,
  selectedDeviceId,
  onSelectRack,
  onSelectDevice,
  onBackgroundClick,
}) {
  if (!room) return null;

  const { width = 10, depth = 8 } = room.dimensions || {};

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [width * 0.8, 4, depth * 0.9], fov: 45, near: 0.1, far: 200 }}
      onPointerMissed={() => onBackgroundClick?.()}
      style={{ background: '#0b0c10' }}
    >
      <Suspense fallback={null}>
        {/* Éclairage : ambiance sombre + luminaires ponctuels simulant le plafonnier */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-width}
          shadow-camera-right={width}
          shadow-camera-top={depth}
          shadow-camera-bottom={-depth}
        />
        <hemisphereLight args={['#3a4e66', '#0a0a10', 0.3]} />

        {/* Sol + grille */}
        <Floor width={width} depth={depth} />

        {/* Ombres douces au pied des racks pour les ancrer visuellement */}
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={Math.max(width, depth) * 1.5}
          blur={2.5}
          far={3}
        />

        {/* Racks */}
        {room.racks.map((rack) => (
          <Rack3D
            key={rack.id}
            rack={rack}
            selected={selectedRackId === rack.id}
            selectedDeviceId={selectedDeviceId}
            onSelectRack={onSelectRack}
            onSelectDevice={onSelectDevice}
          />
        ))}

        <Environment preset="warehouse" />

        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 1, 0]}
          enableDamping
          dampingFactor={0.08}
        />
      </Suspense>
    </Canvas>
  );
}
