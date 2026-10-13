import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { GradientTexture, Stars } from '@react-three/drei'

// A big gradient dome enclosing the world as a night sky: dark at the zenith and
// nadir with a faint navy glow near the horizon. `fog={false}` keeps it crisp —
// scene fog is reserved for adding depth to the islands/clouds, not the sky.
export function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[320, 32, 32]} />
      <meshBasicMaterial side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false}>
        <GradientTexture
          attach="map"
          stops={[0, 0.5, 1]}
          colors={['#04060e', '#1a2b55', '#03040c']}
          size={512}
        />
      </meshBasicMaterial>
    </mesh>
  )
}

/**
 * The starfield, above the horizon only. drei scatters stars over a whole
 * sphere; the ones below the horizon used to be hidden by an opaque plane under
 * the cloud sea, which also cut hard lines through the clouds (see
 * CloudLayer.tsx). Zeroing their size hides them without thinning the sky.
 */
export function SkyStars() {
  const ref = useRef<THREE.Points>(null)
  useLayoutEffect(() => {
    const geometry = ref.current?.geometry
    const pos = geometry?.attributes.position
    const size = geometry?.attributes.size
    if (!pos || !size) return
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) size.setX(i, 0)
    size.needsUpdate = true
  }, [])
  return <Stars ref={ref} radius={220} depth={60} count={6000} factor={5} saturation={0} fade speed={0.4} />
}
