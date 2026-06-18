import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { useGame } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
//  Third-person free-look camera (pointer lock) with anti-clipping.
//
//  • Click the world to engage mouselook — then just move the mouse to look,
//    no button held. Press Esc to release the cursor (for the menus/panels).
//  • Scroll to zoom.
//  • Standard vertical: move the mouse up → look up.
//  • Pitch is clamped so the camera stays ABOVE the island plane.
//  • A Rapier raycast pulls the camera in when static geometry would occlude it,
//    so it never clips through islands/bridges (dynamic bodies are excluded, so
//    it never collides with the player capsule itself).
//  • The lock auto-releases when a content panel opens, so the DOM stays usable.
//
//  Must be rendered INSIDE <Physics> so useRapier() has context.
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVITY = 0.0022
const MIN_PITCH = 0.08 // keep the camera at/above the island plane
const MAX_PITCH = 1.35 // near top-down
const MIN_DISTANCE = 4
const MAX_DISTANCE = 16
const EYE_HEIGHT = 1.2 // look at a point above the player's origin
const CLIP_PADDING = 0.4 // keep the camera this far off any surface it would hit
const RESPONSIVENESS = 16 // higher = snappier camera follow (less floaty)

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Vector3>
}

export function CameraRig({ targetRef }: CameraRigProps) {
  const { camera, gl } = useThree()
  const { rapier, world } = useRapier()

  const yaw = useRef(Math.PI) // start behind the player
  const pitch = useRef(0.45)
  const distance = useRef(10)

  const eye = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement

    // Click the canvas to capture the pointer (engage mouselook).
    const onClick = () => {
      if (useGame.getState().openPanel) return // don't grab the cursor over a panel
      if (document.pointerLockElement !== el) {
        try {
          el.requestPointerLock?.()
        } catch {
          /* browser may reject if called too soon after exit */
        }
      }
    }

    // Only rotate while the pointer is locked to our canvas.
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return
      yaw.current -= e.movementX * SENSITIVITY
      pitch.current += e.movementY * SENSITIVITY // standard: mouse up → look up
      pitch.current = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch.current))
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      distance.current = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, distance.current + e.deltaY * 0.01),
      )
    }

    el.style.touchAction = 'none'
    el.addEventListener('click', onClick)
    document.addEventListener('mousemove', onMouseMove)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  // Release the cursor automatically when a panel opens, so the DOM is usable.
  useEffect(() => {
    return useGame.subscribe((state, prev) => {
      if (state.openPanel && !prev.openPanel && document.pointerLockElement) {
        document.exitPointerLock()
      }
    })
  }, [])

  useFrame((_, delta) => {
    const target = targetRef.current
    if (!target) return

    // Look-at point, slightly above the player's origin.
    eye.current.set(target.x, target.y + EYE_HEIGHT, target.z)

    // Spherical orbit offset (|offset| === distance).
    const cosP = Math.cos(pitch.current)
    const d = distance.current
    offset.current.set(
      Math.sin(yaw.current) * cosP * d,
      Math.sin(pitch.current) * d,
      Math.cos(yaw.current) * cosP * d,
    )
    dir.current.copy(offset.current).normalize()

    // Anti-clip: shorten the boom if static geometry is in the way.
    let dist = d
    const ray = new rapier.Ray(
      { x: eye.current.x, y: eye.current.y, z: eye.current.z },
      { x: dir.current.x, y: dir.current.y, z: dir.current.z },
    )
    const hit = world.castRay(ray, d, true, rapier.QueryFilterFlags.EXCLUDE_DYNAMIC)
    if (hit) dist = Math.max(MIN_DISTANCE * 0.4, hit.timeOfImpact - CLIP_PADDING)

    desired.current.copy(eye.current).addScaledVector(dir.current, dist)

    // Frame-rate independent smoothing toward the desired camera position.
    const alpha = 1 - Math.exp(-RESPONSIVENESS * delta)
    camera.position.lerp(desired.current, alpha)
    camera.lookAt(eye.current)
  })

  return null
}
