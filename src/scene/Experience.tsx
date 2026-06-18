import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Physics } from '@react-three/rapier'
import { Player } from '../components/Player'
import { CameraRig } from '../components/CameraRig'
import { Island } from '../components/Island'
import { Bridge } from '../components/Bridge'
import { WorldBorder } from '../components/WorldBorder'
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
      {/* Soft lighting for the pale void (no sun disc — see World.tsx for the void color) */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#ffffff', '#b8c6e0', 0.6]} />
      <directionalLight
        position={[30, 45, 20]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />

      {/* Faint shimmer wall at the edge of the playable area (visual hint only) */}
      <WorldBorder />

      {/* Physics world: islands + bridges are the only colliders; the void is empty. */}
      <Suspense fallback={null}>
        <Physics gravity={[0, WORLD.GRAVITY, 0]}>
          {content.islands.map((island) => (
            <Island key={island.id} island={island} />
          ))}
          {bridges.map((b) => (
            <Bridge key={`${b.a.id}::${b.b.id}`} a={b.a} b={b.b} />
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
