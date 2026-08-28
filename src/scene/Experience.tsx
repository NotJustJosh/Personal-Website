import { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Physics } from '@react-three/rapier'
import { Player } from '../components/Player'
import { CameraRig } from '../components/CameraRig'
import { Island } from '../components/Island'
import { RopeBridge } from '../components/RopeBridge'
import { WorldBorder } from '../components/WorldBorder'
import { SkyDome } from '../components/SkyDome'
import { CloudLayer } from '../components/CloudLayer'
import { Aurora } from '../components/Aurora'
import { content } from '../content'
import { getBridges } from '../lib/world'
import { useGame } from '../store'
import { WORLD, VISUALS } from '../config'

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
  const quality = useGame((s) => s.quality)

  return (
    <>
      {/* Moon — low in the sky (near the horizon) so it's visible at the camera's
          clamped pitch. Decorative; the directional light below shares its side. */}
      <group position={[150, 50, 150]}>
        <mesh>
          <sphereGeometry args={[14, 32, 32]} />
          <meshBasicMaterial color="#eef2ff" fog={false} toneMapped={false} />
        </mesh>
      </group>

      {/* Key/fill/bounce. A COOL key on one side and a WARM fill on the other
          give geometry a colour axis; flat ambient is kept very low on purpose,
          since that's what washed the scene out before. All values in VISUALS. */}
      <ambientLight intensity={VISUALS.LIGHTS.ambientIntensity} color="#aebfff" />
      <hemisphereLight
        args={[VISUALS.LIGHTS.hemiSky, VISUALS.LIGHTS.hemiGround, VISUALS.LIGHTS.hemiIntensity]}
      />
      {/* Warm fill, opposite side, no shadows — pure shaping light. */}
      <directionalLight
        position={[-90, 55, -70]}
        intensity={VISUALS.LIGHTS.fillIntensity}
        color={VISUALS.LIGHTS.fillColor}
      />
      {/* Cool key. Shadow map is 1024² (not 2048²) — a quarter of the shadow-pass
          fill cost. The shadow camera spans 120×120, so each texel still covers
          ~0.12 world units and the edges stay clean. */}
      <directionalLight
        position={[110, 95, 110]}
        intensity={VISUALS.LIGHTS.keyIntensity}
        color={VISUALS.LIGHTS.keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
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
        {/* Drifting aurora curtains — the main source of colour in the sky.
            Skipped entirely on low quality (they're fill-rate heavy). */}
        {quality === 'high' && <Aurora />}

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

      {/* Post-processing. Only things brighter than the luminance threshold
          bloom, so the dark base stays dark and just the emissive markers, pads
          and aurora glow. The composer also owns tone mapping (see
          QualityManager in World.tsx). Dropped entirely on low quality. */}
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={VISUALS.BLOOM.intensity}
            radius={VISUALS.BLOOM.radius}
            luminanceThreshold={VISUALS.BLOOM.luminanceThreshold}
            luminanceSmoothing={VISUALS.BLOOM.luminanceSmoothing}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  )
}
