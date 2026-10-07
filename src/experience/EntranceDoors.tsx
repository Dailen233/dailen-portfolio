import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { getEntranceTextures } from './textures'
import { RevealMaterial } from './RevealMaterial'
import { entranceRefs } from './entranceRefs'
import { FLOOR_Y, DOOR_WIDTH, DOOR_HEIGHT, OPENING_HALF, DOOR_HOVER_ANGLE } from './sceneConfig'

const DOOR_HALF = DOOR_WIDTH / 2
const DOOR_CENTER_Y = FLOOR_Y + DOOR_HEIGHT / 2

/**
 * 外景双开门：同一底稿派生 sketch/painted 两层，悬停上色并微开，点击进入走廊。
 * 门轴位于外侧铰链（左门 x=-OPENING_HALF，右门 x=+OPENING_HALF）。
 */
export default function EntranceDoors() {
  const { location, transitioning, enterCorridor } = useExperience()
  const reduced = usePrefersReducedMotion()
  const tex = useMemo(() => getEntranceTextures(), [])
  const [hovered, setHovered] = useState(false)

  const leftDoor = useRef<THREE.Group>(null)
  const rightDoor = useRef<THREE.Group>(null)

  const leftSketch = useMemo(
    () =>
      new RevealMaterial({
        map: tex.doorSketch,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
      }),
    [tex],
  )
  const rightSketch = useMemo(
    () =>
      new RevealMaterial({
        map: tex.doorSketch,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
      }),
    [tex],
  )

  const isOpen = location !== 'exterior'
  const interactive = location === 'exterior' && !transitioning

  useEffect(() => {
    entranceRefs.leftDoor = leftDoor.current
    entranceRefs.rightDoor = rightDoor.current
  })

  useEffect(
    () => () => {
      leftSketch.dispose()
      rightSketch.dispose()
    },
    [leftSketch, rightSketch],
  )

  // 悬停/开门 → 线稿上色揭示
  useEffect(() => {
    const target = hovered || isOpen ? 1 : 0
    const dur = reduced ? 0.01 : 0.7
    gsap.to(leftSketch, { uProgress: target, duration: dur, ease: 'power2.out', overwrite: 'auto' })
    gsap.to(rightSketch, { uProgress: target, duration: dur, ease: 'power2.out', overwrite: 'auto' })
  }, [hovered, isOpen, reduced, leftSketch, rightSketch])

  // 空闲态悬停微开（开门角度由 CameraRig 统一驱动）
  useEffect(() => {
    if (!interactive) return
    const angle = reduced ? 0 : DOOR_HOVER_ANGLE
    const dur = reduced ? 0.01 : 0.35
    gsap.to(leftDoor.current?.rotation ?? {}, {
      y: hovered ? -angle : 0,
      duration: dur,
      ease: 'power2.out',
      overwrite: 'auto',
    })
    gsap.to(rightDoor.current?.rotation ?? {}, {
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
    enterCorridor()
  }

  return (
    <>
      {/* 左门（铰链在 x=-OPENING_HALF） */}
      <group ref={leftDoor} position={[-OPENING_HALF, FLOOR_Y, 0]}>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0]} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
          <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, 0.04]} />
          <meshBasicMaterial color="#b9853f" />
        </mesh>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0.021]} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
          <meshBasicMaterial map={tex.doorPainted} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0.023]} material={leftSketch} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        </mesh>
        {/* 门背（开门后可见，带木纹与铰链） */}
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, -0.023]} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
          <meshBasicMaterial map={tex.doorBack} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 右门（铰链在 x=+OPENING_HALF，scale.x=-1 镜像纹理） */}
      <group ref={rightDoor} position={[OPENING_HALF, FLOOR_Y, 0]} scale={[-1, 1, 1]}>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0]} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
          <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, 0.04]} />
          <meshBasicMaterial color="#b9853f" />
        </mesh>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0.021]} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
          <meshBasicMaterial map={tex.doorPainted} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, 0.023]} material={rightSketch} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        </mesh>
        {/* 门背 */}
        <mesh position={[DOOR_HALF, DOOR_CENTER_Y, -0.023]} raycast={() => null}>
          <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
          <meshBasicMaterial map={tex.doorBack} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}
