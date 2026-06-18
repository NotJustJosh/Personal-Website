import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Sky, Grid } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { Player } from '../components/Player'
import { CameraRig } from '../components/CameraRig'
import { Zone } from '../components/Zone'
import { content } from '../content'
import { useGame } from '../store'

// Flips the global `ready` flag once everything inside <Suspense> has loaded.
// (Sits inside Suspense, so it only mounts after suspended assets resolve.)
function SceneReady() {
  const setReady = useGame((s) => s.setReady)
  useEffect(() => {
    setReady(true)
    return () => setReady(false)
  }, [setReady])
  return null
}

// Flat ground: a thin fixed physics box + a visual plane.
function Ground() {
  return (
    <RigidBody type="fixed" colliders={false} friction={1}>
      {/* Half-extents [100, 0.5, 100] → 200 × 1 × 200 box; top surface at y = 0. */}
      <CuboidCollider args={[100, 0.5, 100]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#46603f" roughness={1} />
      </mesh>
    </RigidBody>
  )
}

export function Experience() {
  // Shared position written by the Player and read by the camera.
  const playerPos = useRef(new THREE.Vector3(0, 1, 0))

  return (
    <>
      {/* Sky + lighting */}
      <Sky sunPosition={[100, 40, 100]} turbidity={6} rayleigh={1.2} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#bcd4ff', '#3a5a40', 0.4]} />
      <directionalLight
        position={[25, 35, 15]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />

      {/* Decorative grid so movement is readable */}
      <Grid
        position={[0, 0.02, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#3a4f36"
        sectionSize={10}
        sectionThickness={1.2}
        sectionColor="#6b8f5e"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Physics world + everything that collides */}
      <Suspense fallback={null}>
        <Physics gravity={[0, -18, 0]}>
          <Ground />
          <Player targetRef={playerPos} />
          {content.zones.map((zone) => (
            <Zone key={zone.id} zone={zone} />
          ))}
        </Physics>
        <SceneReady />
      </Suspense>

      <CameraRig targetRef={playerPos} />
    </>
  )
}
