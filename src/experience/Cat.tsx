import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { getExteriorTextures } from './exteriorTextures'

const EYE_Y = 0.64
const EYE_X = 0.09
const PUPIL_RADIUS = 0.016
const PUPIL_TRAVEL = 0.013

/**
 * 外景小猫：蹲姿线稿 + 瞳孔跟随指针，点击眨眼。
 * 装饰性，不拦截入口操作（位于门左侧远处）。
 */
export default function Cat() {
  const tex = useMemo(() => getExteriorTextures().catBody, [])
  const { location } = useExperience()
  const reduced = usePrefersReducedMotion()
  const pointer = useThree((s) => s.pointer)

  const body = useRef<THREE.Group>(null)
  const leftPupil = useRef<THREE.Mesh>(null)
  const rightPupil = useRef<THREE.Mesh>(null)
  const [blinking, setBlinking] = useState(false)

  const active = location === 'exterior'

  const blink = () => {
    if (blinking) return
    setBlinking(true)
    const dur = reduced ? 0.01 : 0.12
    const tl = gsap.timeline({ onComplete: () => setBlinking(false) })
    const eyes = [leftPupil.current, rightPupil.current].filter(Boolean) as THREE.Mesh[]
    tl.to(
      eyes.map((m) => m.scale),
      { y: 0.15, x: 1, duration: dur, ease: 'power2.in' },
      0,
    )
    tl.to(
      eyes.map((m) => m.scale),
      { y: 1, duration: dur, ease: 'power2.out' },
      dur,
    )
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (body.current && !reduced) {
      body.current.scale.y = 1 + Math.sin(t * 2.4) * 0.012
    }
    if (active && !reduced && !blinking) {
      const px = pointer.x * PUPIL_TRAVEL
      const py = pointer.y * PUPIL_TRAVEL * 0.6
      leftPupil.current?.position.set(-EYE_X + px, EYE_Y + py, 0.02)
      rightPupil.current?.position.set(EYE_X + px, EYE_Y + py, 0.02)
    }
  })

  return (
    <group position={[-3.3, 0, 0.85]}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]} onClick={blink}>
          <planeGeometry args={[1.1, 1.1]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
        <mesh ref={leftPupil} position={[-EYE_X, EYE_Y, 0.02]} raycast={() => null}>
          <circleGeometry args={[PUPIL_RADIUS, 16]} />
          <meshBasicMaterial color="#2e2a24" />
        </mesh>
        <mesh ref={rightPupil} position={[EYE_X, EYE_Y, 0.02]} raycast={() => null}>
          <circleGeometry args={[PUPIL_RADIUS, 16]} />
          <meshBasicMaterial color="#2e2a24" />
        </mesh>
      </group>
    </group>
  )
}
