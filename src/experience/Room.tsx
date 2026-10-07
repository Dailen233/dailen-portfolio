import { useMemo } from 'react'
import * as THREE from 'three'
import { getEntranceTextures } from './textures'
import { getGalleryTextures } from './galleryTextures'
import Gallery from './Gallery'
import { CORRIDOR_HEIGHT, ROOM_X0, ROOM_X1, ROOM_Z0, ROOM_Z1 } from './sceneConfig'

const ROOM_WALL = '#efe8d8'
const ROOM_CEIL = '#faf6ee'
const ROOM_BASE = '#c9b894'

/**
 * 作品集房间：走廊右侧的独立手绘画廊。
 * 木地板 + 浅色墙面 + 踢脚线勾勒墙角；画框由 Gallery 布置在右墙与后墙；
 * 前方放一架画架建立前景深度。
 */
export default function Room() {
  const tex = useMemo(() => getEntranceTextures(), [])
  const galleryTex = useMemo(() => getGalleryTextures(), [])

  const roomCenterX = (ROOM_X0 + ROOM_X1) / 2
  const roomCenterZ = (ROOM_Z0 + ROOM_Z1) / 2
  const width = ROOM_X1 - ROOM_X0
  const depth = ROOM_Z0 - ROOM_Z1

  const floorTex = useMemo(() => {
    const t = tex.woodFloor.clone()
    t.needsUpdate = true
    t.repeat.set(width / 0.8, depth / 0.8)
    return t
  }, [tex, width, depth])

  return (
    <group>
      {/* 木地板 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomCenterX, 0, roomCenterZ]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial map={floorTex} />
      </mesh>
      {/* 顶 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[roomCenterX, CORRIDOR_HEIGHT, roomCenterZ]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={ROOM_CEIL} />
      </mesh>
      {/* 右墙（展示墙，面向 -x） */}
      <mesh position={[ROOM_X1, CORRIDOR_HEIGHT / 2, roomCenterZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={ROOM_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 后墙（面向 +z，即面向房间内部） */}
      <mesh position={[roomCenterX, CORRIDOR_HEIGHT / 2, ROOM_Z1]}>
        <planeGeometry args={[width, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={ROOM_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 前墙（面向 -z，即面向房间内部） */}
      <mesh position={[roomCenterX, CORRIDOR_HEIGHT / 2, ROOM_Z0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, CORRIDOR_HEIGHT]} />
        <meshBasicMaterial color={ROOM_WALL} side={THREE.DoubleSide} />
      </mesh>
      {/* 踢脚线（勾勒墙角） */}
      <mesh position={[ROOM_X1 - 0.01, 0.12, roomCenterZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, 0.24]} />
        <meshBasicMaterial color={ROOM_BASE} />
      </mesh>
      <mesh position={[roomCenterX, 0.12, ROOM_Z1 + 0.01]}>
        <planeGeometry args={[width, 0.24]} />
        <meshBasicMaterial color={ROOM_BASE} />
      </mesh>
      <mesh position={[roomCenterX, 0.12, ROOM_Z0 - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, 0.24]} />
        <meshBasicMaterial color={ROOM_BASE} />
      </mesh>

      {/* 画廊（画框） */}
      <Gallery />

      {/* 前景画架 */}
      <group position={[3.0, 0, -3.95]} rotation={[0, -1.25, 0]}>
        <mesh position={[0, 0.98, 0]} rotation={[0.1, 0, 0]}>
          <planeGeometry args={[0.62, 0.44]} />
          <meshBasicMaterial map={galleryTex.easel} />
        </mesh>
        <mesh position={[-0.28, 0.46, 0.02]}>
          <boxGeometry args={[0.045, 0.95, 0.045]} />
          <meshBasicMaterial color="#b9853f" />
        </mesh>
        <mesh position={[0.28, 0.46, 0.02]}>
          <boxGeometry args={[0.045, 0.95, 0.045]} />
          <meshBasicMaterial color="#b9853f" />
        </mesh>
        <mesh position={[0, 0.5, -0.34]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.045, 1.02, 0.045]} />
          <meshBasicMaterial color="#a9743f" />
        </mesh>
        <mesh position={[0, 0.72, -0.01]}>
          <boxGeometry args={[0.6, 0.045, 0.045]} />
          <meshBasicMaterial color="#8a6236" />
        </mesh>
      </group>
    </group>
  )
}
