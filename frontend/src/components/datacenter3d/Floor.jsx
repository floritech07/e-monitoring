import { Grid } from '@react-three/drei';
import { COLORS } from './constants';

/**
 * Sol de la salle serveur + grille de repère.
 * Rendu centré sur l'origine ; dimensions en mètres passées via props.
 */
export default function Floor({ width = 10, depth = 8 }) {
  return (
    <group>
      {/* Plancher plein (légèrement sous 0 pour éviter le z-fighting avec la grille) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grille de référence technique : carreaux de 0,5 m + majeurs tous les 5 m */}
      <Grid
        args={[width, depth]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={COLORS.floorGrid}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={COLORS.wallGrid}
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid={false}
        position={[0, 0.002, 0]}
      />
    </group>
  );
}
