import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Stars } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Player } from '../components/Player'
import { CameraRig } from '../components/CameraRig'
import { Island } from '../components/Island'
import { RopeBridge } from '../components/RopeBridge'
import { WorldBorder } from '../components/WorldBorder'
import { SkyDome } from '../components/SkyDome'
import { CloudLayer } from '../components/CloudLayer'
import { content } from '../content'
import { getBridges } from '../lib/world'
import { useGame } from '../store'
import { WORLD } from '../config'

// Bridges are derived once from the islands' `neighbors` lists.
const bridges = getBridges()

// Flips the global `ready` flag once everything inside <Suspense> has loaded.
function SceneReady() {
  const setReady = useGame((s) => s.setReady)
  useEffect(() => {
    setReady(true)
    return () => setReady(false)
  }, [setReady])
  return null
}

export function Experience() {
  // Shared position written by the Player and read by the camera.
  const playerPos = useRef(new THREE.Vector3(0, 1, 0))

  return (
    <>
      {/* Moon (also marks the light direction) — plain meshes, no async load */}
      <group position={[60, 95, -70]}>
        <mesh>
          <sphereGeometry args={[7, 32, 32]} />
          <meshBasicMaterial color="#eaf0ff" fog={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[11, 32, 32]} />
          <meshBasicMaterial
            color="#9fb4ff"
            transparent
            opacity={0.16}
            fog={false}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Moonlit lighting (cool + dim; islands' own accent lights do the rest) */}
      <ambientLight intensity={0.35} color="#aebfff" />
      <hemisphereLight args={['#2a3f72', '#05060d', 0.5]} />
      <directionalLight
        position={[60, 95, -70]}
        intensity={0.85}
        color="#cdd9ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={260}
      />

      {/* Faint shimmer wall at the edge of the playable area (visual hint only) */}
      <WorldBorder />

      {/* Anything that may stream assets (e.g. the cloud texture) lives under
          <Suspense> so a load never throws for lack of a boundary. */}
      <Suspense fallback={null}>
        {/* Night sky: gradient dome + starfield */}
        <SkyDome />
        <Stars radius={220} depth={60} count={6000} factor={5} saturation={0} fade speed={0.4} />
        {/* Cloud sea far below the islands for a sense of depth */}
        <CloudLayer />

        {/* Physics world: islands + bridges are the only colliders; void is empty. */}
        <Physics gravity={[0, WORLD.GRAVITY, 0]}>
          {content.islands.map((island) => (
            <Island key={island.id} island={island} />
          ))}
          {bridges.map((b) => (
            <RopeBridge key={`${b.a.id}::${b.b.id}`} a={b.a} b={b.b} />
          ))}

          <Player targetRef={playerPos} />
          {/* Camera lives inside <Physics> so it can raycast for anti-clipping. */}
          <CameraRig targetRef={playerPos} />
        </Physics>
        <SceneReady />
      </Suspense>
    </>
  )
}
