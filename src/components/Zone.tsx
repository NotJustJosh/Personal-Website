import { Text, Billboard } from '@react-three/drei'
import type { Zone as ZoneData } from '../content'

// Visual marker for an interactable zone: a glowing ground pad, a pillar, a ring
// showing the interaction radius, and a billboarded 3D label.
//
// NOTE: the LABEL here is 3D text (troika). The actual content PANELS are plain
// HTML/DOM overlays (see ../ui/Panel.tsx) — only the labels live in the scene.
export function Zone({ zone }: { zone: ZoneData }) {
  const [x, y, z] = zone.position

  return (
    <group position={[x, y, z]}>
      {/* Glowing pad */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.1, 48]} />
        <meshStandardMaterial
          color={zone.color}
          emissive={zone.color}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Pillar so the zone reads from a distance */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 2, 16]} />
        <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={0.25} />
      </mesh>

      {/* Interaction-radius ring on the ground */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(0, zone.radius - 0.08), zone.radius, 64]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Floating label that always faces the camera */}
      <Billboard position={[0, 2.7, 0]}>
        <Text
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#0b1020"
        >
          {zone.label}
        </Text>
      </Billboard>
    </group>
  )
}
