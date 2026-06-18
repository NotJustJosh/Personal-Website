import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
//  Third-person orbit camera.
//
//  Hold and drag the mouse to orbit; scroll to zoom. The camera smoothly chases
//  a position behind the player (the shared `targetRef` written by the Player).
//
//  WANT FREE-LOOK (pointer lock) INSTEAD OF DRAG?  Request pointer lock on the
//  canvas click (`gl.domElement.requestPointerLock()`), then read e.movementX/Y
//  on every mousemove while `document.pointerLockElement` is set. Drag is used
//  here because it never fights with the always-visible HTML buttons.
// ─────────────────────────────────────────────────────────────────────────────

const SENSITIVITY = 0.0035
const MIN_PITCH = -0.4 // how far you can look down
const MAX_PITCH = 1.2 // how far you can look up
const MIN_DISTANCE = 4
const MAX_DISTANCE = 16
const EYE_HEIGHT = 1.2 // look at a point above the player's origin

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Vector3>
}

export function CameraRig({ targetRef }: CameraRigProps) {
  const { camera, gl } = useThree()
  const yaw = useRef(Math.PI) // start behind the player (looking toward -Z)
  const pitch = useRef(0.35)
  const distance = useRef(9)
  const dragging = useRef(false)

  const desired = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (useGame.getState().openPanel) return // don't orbit while a panel is open
      dragging.current = true
      el.setPointerCapture?.(e.pointerId)
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false
      try {
        el.releasePointerCapture?.(e.pointerId)
      } catch {
        /* pointer may already be released */
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      yaw.current -= e.movementX * SENSITIVITY
      pitch.current -= e.movementY * SENSITIVITY
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
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    const target = targetRef.current
    if (!target) return

    const cosP = Math.cos(pitch.current)
    const d = distance.current
    desired.current.set(
      target.x + Math.sin(yaw.current) * cosP * d,
      target.y + Math.sin(pitch.current) * d + EYE_HEIGHT,
      target.z + Math.cos(yaw.current) * cosP * d,
    )

    // Frame-rate independent smoothing toward the desired camera position.
    const alpha = 1 - Math.pow(0.0015, delta)
    camera.position.lerp(desired.current, alpha)

    lookAt.current.set(target.x, target.y + EYE_HEIGHT, target.z)
    camera.lookAt(lookAt.current)
  })

  return null
}
