import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelUrl } from '../lib/gltf'

// ─────────────────────────────────────────────────────────────────────────────
//  Island centerpiece: a pedestal with a glowing cube hovering above it that
//  slowly spins and gently bobs.
//
//  The pedestal model is `public/models/pedestal.glb`. As soon as that file is
//  in place, set PEDESTAL_MODEL to its path below and the real mesh is used;
//  until then a simple stone placeholder stands in.
// ─────────────────────────────────────────────────────────────────────────────

const PEDESTAL_MODEL: string | null = 'models/pedestal.glb'

const PEDESTAL_HEIGHT = 0.5 // small pedestal
const CUBE_SIZE = 0.4
const CUBE_BASE_Y = PEDESTAL_HEIGHT + 0.35 // hover height above the island surface
const SPIN_SPEED = 0.7 // radians / second
const BOB_SPEED = 1.5
const BOB_AMP = 0.16

// Simple stacked-stone pedestal used until pedestal.glb is provided.
function PlaceholderPedestal() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.64, 0.74, 0.24, 24]} />
        <meshStandardMaterial color="#717784" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.64, 20]} />
        <meshStandardMaterial color="#828a99" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.44, 0.18, 24]} />
        <meshStandardMaterial color="#717784" roughness={0.95} />
      </mesh>
    </group>
  )
}

// Real pedestal model (only mounted when PEDESTAL_MODEL is set). Auto-scaled so
// its height matches the placeholder, base on the island surface.
function PedestalModel({ path }: { path: string }) {
  const { scene } = useGLTF(modelUrl(path))
  const object = useMemo(() => {
    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)
    const size = new THREE.Vector3()
    new THREE.Box3().setFromObject(clone).getSize(size)
    clone.scale.setScalar(PEDESTAL_HEIGHT / Math.max(size.y, 1e-3))
    clone.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clone)
    clone.position.y -= box.min.y // base on the surface
    const mat = new THREE.MeshStandardMaterial({ color: '#7a818f', roughness: 0.95 })
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        ;(o as THREE.Mesh).material = mat
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return <primitive object={object} />
}

export function Waypoint({ accentColor }: { accentColor: string }) {
  const cube = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = cube.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * SPIN_SPEED
    g.position.y = CUBE_BASE_Y + Math.sin(t * BOB_SPEED) * BOB_AMP
  })

  return (
    <group>
      {PEDESTAL_MODEL ? <PedestalModel path={PEDESTAL_MODEL} /> : <PlaceholderPedestal />}

      {/* Glowing, spinning, bobbing cube */}
      <group ref={cube} position={[0, CUBE_BASE_Y, 0]}>
        <mesh castShadow>
          <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={2.2}
            toneMapped={false}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Glow cast by the cube */}
      <pointLight position={[0, CUBE_BASE_Y, 0]} color={accentColor} intensity={4} distance={6} decay={2} />
    </group>
  )
}

if (PEDESTAL_MODEL) useGLTF.preload(modelUrl(PEDESTAL_MODEL))
