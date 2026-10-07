import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { getExteriorTextures } from './exteriorTextures'
import { getEntranceTextures } from './textures'
import { makeLabelTexture } from './labelTexture'
import EntranceDoors from './EntranceDoors'
import Cat from './Cat'
import WindowWithCharacter from './Window'
import { BUILDING_WIDTH, BUILDING_HEIGHT, DOOR_HEIGHT, FLOOR_Y } from './sceneConfig'

const PAPER_GROUND = '#eee6d6'

/** 树：主干 + 分枝 + 叶簇，exterior 阶段随风轻摆 */
function Tree() {
  const tex = useMemo(() => getExteriorTextures().tree, [])
  const reduced = usePrefersReducedMotion()
  const { location } = useExperience()
  const sway = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!sway.current || reduced || location !== 'exterior') return
    const t = state.clock.elapsedTime
    sway.current.rotation.z = Math.sin(t * 0.7) * 0.012
  })

  return (
    <group position={[-4.7, 0, 0.55]}>
      <group ref={sway}>
        <mesh position={[0, 2.9, 0]} raycast={() => null}>
          <planeGeometry args={[4, 6]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

/** 门牌：暖木牌 + 链子，exterior 阶段轻微摆动 */
function SwingingSign() {
  const entranceTex = useMemo(() => getEntranceTextures(), [])
  const signText = useMemo(() => makeLabelTexture('Dailen', { color: '#3a2c1a' }), [])
  const reduced = usePrefersReducedMotion()
  const { location } = useExperience()
  const swing = useRef<THREE.Group>(null)

  useEffect(
    () => () => {
      signText.dispose()
    },
    [signText],
  )

  useFrame((state) => {
    if (!swing.current || reduced || location !== 'exterior') return
    const t = state.clock.elapsedTime
    swing.current.rotation.z = Math.sin(t * 1.1) * 0.045
  })

  return (
    <group position={[0, 3.55, 0.02]}>
      <group ref={swing}>
        <mesh position={[0, -0.6, 0]} raycast={() => null}>
          <planeGeometry args={[2.4, 1.2]} />
          <meshBasicMaterial map={entranceTex.signPlate} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.67, 0.01]} raycast={() => null}>
          <planeGeometry args={[1.4, 0.5]} />
          <meshBasicMaterial map={signText} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 外景：完整建筑立面 + 石板路 + 树 + 猫 + 窗 + 花槽 + 双门 + 门牌。
 * 环境动画（树摆、门牌摆、猫、窗）均在离开 exterior 后停止，避免无意义更新。
 */
export default function Exterior() {
  const tex = useMemo(() => getExteriorTextures(), [])
  const entranceTex = useMemo(() => getEntranceTextures(), [])

  return (
    <group>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 6]}>
        <planeGeometry args={[20, 14]} />
        <meshBasicMaterial color={PAPER_GROUND} />
      </mesh>
      {/* 石板路 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.01, 4]}>
        <planeGeometry args={[7, 9]} />
        <meshBasicMaterial map={tex.stonePath} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>

      {/* 建筑立面（透明门洞） */}
      <mesh position={[0, BUILDING_HEIGHT / 2, 0]}>
        <planeGeometry args={[BUILDING_WIDTH, BUILDING_HEIGHT]} />
        <meshBasicMaterial map={tex.building} alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* 门框 */}
      <mesh position={[0, DOOR_HEIGHT / 2 + 0.1, 0.01]}>
        <planeGeometry args={[3.2, 2.8]} />
        <meshBasicMaterial map={entranceTex.doorFrame} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>
      {/* 门阶（石阶，增加门的体量与接地感） */}
      <mesh position={[0, 0.1, 0.45]}>
        <boxGeometry args={[3.4, 0.2, 0.9]} />
        <meshBasicMaterial color="#d6cbb6" />
      </mesh>
      <mesh position={[0, 0.21, 0.45]}>
        <boxGeometry args={[3.4, 0.02, 0.92]} />
        <meshBasicMaterial color="#8a7f6c" />
      </mesh>

      {/* 环境 */}
      <SwingingSign />
      <Tree />
      <Cat />
      <WindowWithCharacter />

      {/* 双门 */}
      <EntranceDoors />
    </group>
  )
}
