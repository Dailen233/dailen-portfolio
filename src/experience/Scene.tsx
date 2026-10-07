import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import SideDoor from './SideDoor'
import Avatar from './Avatar'
import Room from './Room'
import Exterior from './Exterior'
import { getEntranceTextures } from './textures'
import { makeLabelTexture, makeTitleTexture } from './labelTexture'
import {
  FLOOR_Y,
  CORRIDOR_HEIGHT,
  CORRIDOR_HALF,
  CORRIDOR_LENGTH,
  SIDE_DOOR_WIDTH,
  SIDE_DOOR_Z,
  FOG_COLOR,
  FOG_NEAR,
  FOG_FAR,
} from './sceneConfig'

const PAPER_WALL = '#f5efe3'
const PAPER_CEIL = '#fbf7ef'

export default function Scene() {
  const tex = useMemo(() => getEntranceTextures(), [])
  const sideSignText = useMemo(() => makeLabelTexture('作品集', { color: '#3a2c1a' }), [])
  const titleText = useMemo(() => makeTitleTexture('Dailen'), [])

  // 独占木地板纹理（仅地板使用，独立 repeat）
  const floorTex = useMemo(() => {
    const t = tex.woodFloor.clone()
    t.needsUpdate = true
    t.repeat.set(CORRIDOR_HALF * 2, CORRIDOR_LENGTH / 1.1)
    return t
  }, [tex])

  useEffect(
    () => () => {
      sideSignText.dispose()
      titleText.dispose()
      floorTex.dispose()
    },
    [sideSignText, titleText, floorTex],
  )

  const corridorCenterZ = -CORRIDOR_LENGTH / 2
  // 右墙在侧门处留门洞
  const sideGapFar = SIDE_DOOR_Z - SIDE_DOOR_WIDTH / 2 // -6.1
  const sideGapNear = SIDE_DOOR_Z + SIDE_DOOR_WIDTH / 2 // -4.9
  const frontLen = -sideGapNear // 4.9
  const backLen = CORRIDOR_LENGTH + sideGapFar // 19.9（sideGapFar 为负）

  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      {/* ===== 走廊（门后，z<0） ===== */}
      {/* 木地板 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, corridorCenterZ]}>
        <planeGeometry args={[CORRIDOR_HALF * 2, CORRIDOR_LENGTH]} />
        <meshBasicMaterial map={floorTex} />
      </mesh>
      {/* 左墙（整段） */}
      <mesh position={[-CORRIDOR_HALF, CORRIDOR_HEIGHT / 2, corridorCenterZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={PAPER_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 左墙踢脚线 */}
      <mesh position={[-CORRIDOR_HALF + 0.01, 0.12, corridorCenterZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[CORRIDOR_LENGTH, 0.24]} />
        <meshBasicMaterial color="#ded2bb" />
      </mesh>
      {/* 右墙前段（门洞之前） */}
      <mesh position={[CORRIDOR_HALF, CORRIDOR_HEIGHT / 2, -frontLen / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[frontLen, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={PAPER_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 右墙后段（门洞之后） */}
      <mesh
        position={[CORRIDOR_HALF, CORRIDOR_HEIGHT / 2, sideGapFar - backLen / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[backLen, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={PAPER_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 天花板 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CORRIDOR_HEIGHT, corridorCenterZ]}>
        <planeGeometry args={[CORRIDOR_HALF * 2, CORRIDOR_LENGTH]} />
        <meshBasicMaterial color={PAPER_CEIL} />
      </mesh>
      {/* 走廊尽头封底（有限走廊的结构收口，纸面，与侧墙一致） */}
      <mesh position={[0, CORRIDOR_HEIGHT / 2, -CORRIDOR_LENGTH]}>
        <planeGeometry args={[CORRIDOR_HALF * 2, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={PAPER_WALL} side={THREE.DoubleSide} />
      </mesh>

      {/* 走廊内容：Dailen 艺术字（左墙）、虚拟人物、侧门门牌 */}
      <mesh position={[-CORRIDOR_HALF + 0.05, 2.0, -8]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.0, 1.5]} />
        <meshBasicMaterial map={titleText} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>
      <Avatar position={[-0.6, 0, -8]} />
      <mesh position={[CORRIDOR_HALF - 0.05, 2.75, SIDE_DOOR_Z]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.2, 0.45]} />
        <meshBasicMaterial map={sideSignText} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>

      {/* 作品集侧门（右墙） */}
      <SideDoor />

      {/* 作品集房间 */}
      <Room />

      {/* ===== 外景 ===== */}
      <Exterior />
    </>
  )
}
