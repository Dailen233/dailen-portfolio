import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { entranceRefs } from './entranceRefs'
import { exploreRefs } from './roomExplore'
import { CORRIDOR_HALF, SIDE_DOOR_WIDTH, SIDE_DOOR_HEIGHT, SIDE_DOOR_Z, SIDE_DOOR_HOVER_ANGLE } from './sceneConfig'

const HALF = SIDE_DOOR_WIDTH / 2
const CENTER_Y = SIDE_DOOR_HEIGHT / 2

/**
 * 走廊右侧的「作品集」侧门：单扇，铰链在近入口一侧，向房间内（+x）摆开。
 * 可辨识（门牌）、可悬停（微开 + 光标）、可点击（进入房间）。
 */
export default function SideDoor() {
  const { location, transitioning, enterRoom } = useExperience()
  const reduced = usePrefersReducedMotion()
  const group = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const interactive = location === 'corridor' && !transitioning

  useEffect(() => {
    entranceRefs.sideDoor = group.current
  })

  // 空闲态悬停微开（开门角度由 CameraRig 驱动）
  useEffect(() => {
    if (!interactive) return
    const angle = reduced ? 0 : SIDE_DOOR_HOVER_ANGLE
    const dur = reduced ? 0.01 : 0.3
    gsap.to(group.current?.rotation ?? {}, {
      y: hovered ? angle : 0,
      duration: dur,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }, [hovered, interactive, reduced])

  const handleOver = () => {
    if (!interactive) return
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }
  const handleClick = () => {
    if (!interactive) return
    // 从侧门上开始拖动（滑动浏览）后不再开门
    if (exploreRefs.suppressClick) return
    enterRoom()
  }

  return (
    <group ref={group} position={[CORRIDOR_HALF, 0, SIDE_DOOR_Z - HALF]}>
      <mesh
        position={[0, CENTER_Y, HALF]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={[0.06, SIDE_DOOR_HEIGHT, SIDE_DOOR_WIDTH]} />
        <meshBasicMaterial color={hovered ? '#d09a55' : '#b9853f'} />
      </mesh>
      {/* 内嵌面板（面向走廊 -x） */}
      <mesh position={[-0.032, CENTER_Y, HALF]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SIDE_DOOR_WIDTH - 0.2, SIDE_DOOR_HEIGHT - 0.35]} />
        <meshBasicMaterial color="#c9955a" />
      </mesh>
      {/* 把手（近门缝一侧） */}
      <mesh position={[-0.05, CENTER_Y, HALF - 0.4]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#5a4426" />
      </mesh>
    </group>
  )
}
