import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelUrl } from '../lib/gltf'

// ─────────────────────────────────────────────────────────────────────────────
//  Island centerpiece: a marble base plate, a stone pedestal standing on it, and
//  a glowing cube hovering above that slowly spins and gently bobs.
//
//  Models live in public/models/: base_plate_8.glb + pedestal.glb (no materials;
//  we author them in code). The plate is auto-scaled to a fixed footprint and the
//  pedestal is measured + stacked on top of it, so swapping either model just works.
// ─────────────────────────────────────────────────────────────────────────────

const PEDESTAL_MODEL = 'models/pedestal.glb'
const BASE_PLATE_MODEL = 'models/base_plate_8.glb'

const PEDESTAL_HEIGHT = 0.5 // small pedestal
const PLATE_RADIUS = 2.8 // footprint of the marble base plate
const CUBE_SIZE = 0.4
const SPIN_SPEED = 0.7 // radians / second
const BOB_SPEED = 1.5
const BOB_AMP = 0.16

function Centerpiece({ accentColor }: { accentColor: string }) {
  const plateScene = useGLTF(modelUrl(BASE_PLATE_MODEL)).scene
  const pedestalScene = useGLTF(modelUrl(PEDESTAL_MODEL)).scene

  // Build plate + pedestal once: scale the plate to PLATE_RADIUS, drop its base on
  // the island surface, then stack the pedestal on the measured plate top.
  const { object, pedestalTop } = useMemo(() => {
    const root = new THREE.Group()

    // Marble: matte stone base under a glossy clearcoat for a polished look.
    // Shared by both the base plate and the pedestal.
    const marble = new THREE.MeshPhysicalMaterial({
      color: '#ece9e3',
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    })

    // Base plate — uniform scale to the target footprint, base at the surface.
    const plate = plateScene.clone(true)
    plate.updateMatrixWorld(true)
    const psize = new THREE.Vector3()
    new THREE.Box3().setFromObject(plate).getSize(psize)
    plate.scale.setScalar((PLATE_RADIUS * 2) / Math.max(psize.x, psize.z, 1e-3))
    plate.updateMatrixWorld(true)
    plate.position.y -= new THREE.Box3().setFromObject(plate).min.y
    plate.updateMatrixWorld(true)
    const plateTop = new THREE.Box3().setFromObject(plate).max.y
    plate.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        ;(o as THREE.Mesh).material = marble
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    root.add(plate)

    // Pedestal — scale to PEDESTAL_HEIGHT, base resting on the plate top.
    const ped = pedestalScene.clone(true)
    ped.updateMatrixWorld(true)
    const ssize = new THREE.Vector3()
    new THREE.Box3().setFromObject(ped).getSize(ssize)
    ped.scale.setScalar(PEDESTAL_HEIGHT / Math.max(ssize.y, 1e-3))
    ped.updateMatrixWorld(true)
    ped.position.y += plateTop - new THREE.Box3().setFromObject(ped).min.y
    ped.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        ;(o as THREE.Mesh).material = marble
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    root.add(ped)

    return { object: root, pedestalTop: plateTop + PEDESTAL_HEIGHT }
  }, [plateScene, pedestalScene])

  const cubeBaseY = pedestalTop + 0.35 // hover height above the pedestal top
  const cube = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = cube.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * SPIN_SPEED
    g.position.y = cubeBaseY + Math.sin(t * BOB_SPEED) * BOB_AMP
  })

  return (
    <group>
      <primitive object={object} />

      {/* Glowing, spinning, bobbing cube */}
      <group ref={cube} position={[0, cubeBaseY, 0]}>
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
      <pointLight position={[0, cubeBaseY, 0]} color={accentColor} intensity={4} distance={6} decay={2} />
    </group>
  )
}

export function Waypoint({ accentColor }: { accentColor: string }) {
  return <Centerpiece accentColor={accentColor} />
}

useGLTF.preload(modelUrl(PEDESTAL_MODEL))
useGLTF.preload(modelUrl(BASE_PLATE_MODEL))
