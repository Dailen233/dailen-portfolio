import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { getExteriorTextures } from './exteriorTextures'

// 角色平面 0.9 x 1.25，头部约在中心 ±0.28，肩部在 -0.33..-0.63
// 建筑窗洞 y 1.55..2.85；探出时头入窗洞，收回时头降到窗洞下方被砖墙遮挡
const HIDDEN_Y = 0.9
const PEEK_Y = 2.2

/**
 * 外景右侧的窗 + 花槽。
 * 层次（自远及近）：窗内背景 → 角色 → 建筑（窗洞透明）→ 窗框/玻璃/窗台 → 花槽。
 * 角色始终受建筑窗洞限制：收回被砖墙遮住，探出从窗内露头，途中不越出墙面。
 */
export default function WindowWithCharacter() {
  const tex = useMemo(() => getExteriorTextures(), [])
  const { location } = useExperience()
  const reduced = usePrefersReducedMotion()

  const [peeked, setPeeked] = useState(false)
  const charGroup = useRef<THREE.Group>(null)
  const boxGroup = useRef<THREE.Group>(null)

  const interactive = location === 'exterior'

  useEffect(() => {
    const char = charGroup.current
    const box = boxGroup.current
    const targetY = peeked && interactive ? PEEK_Y : HIDDEN_Y
    if (char) {
      gsap.to(char.position, {
        y: targetY,
        duration: reduced ? 0.01 : 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
    // 花槽轻摆（独立，不随角色）
    if (box) {
      gsap.to(box.rotation, {
        z: reduced ? 0 : 0.015,
        duration: reduced ? 0.01 : 1.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        overwrite: 'auto',
      })
    }
    return () => {
      if (char) gsap.killTweensOf(char.position)
      if (box) gsap.killTweensOf(box.rotation)
    }
  }, [peeked, interactive, reduced])

  const handleOver = () => {
    if (!interactive) return
    setPeeked(true)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    setPeeked(false)
    document.body.style.cursor = 'auto'
  }
  const handleClick = () => {
    if (!interactive) return
    setPeeked((p) => !p)
  }

  return (
    <group position={[4.2, 0, 0.05]}>
      {/* 窗内背景（建筑之后，透过窗洞可见，营造内部空间） */}
      <mesh position={[0, 2.2, -0.1]} raycast={() => null}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={tex.windowInterior} />
      </mesh>
      {/* 探头角色（建筑之后，窗洞内上下滑动） */}
      <group ref={charGroup} position={[0, HIDDEN_Y, -0.08]}>
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <planeGeometry args={[0.9, 1.25]} />
          <meshBasicMaterial map={tex.character} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      </group>
      {/* 窗（窗框/玻璃/窗台，悬停/点击反馈） */}
      <mesh
        position={[0, 2.05, 0]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <planeGeometry args={[1.5, 1.72]} />
        <meshBasicMaterial map={tex.window} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>
      {/* 花槽（窗下，轻摆） */}
      <group ref={boxGroup} position={[0, 0.95, 0.18]}>
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <planeGeometry args={[1.5, 1.1]} />
          <meshBasicMaterial map={tex.flowerBox} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
