import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getEntranceTextures } from './textures'

/**
 * 原创手绘虚拟人物：整体呼吸（轻微缩放）+ 轻微摇摆，右臂抬起呈挥手姿态。
 */
export default function Avatar({ position }: { position: [number, number, number] }) {
  const tex = useMemo(() => getEntranceTextures().avatar, [])
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      const s = 1 + Math.sin(t * 2.1) * 0.012
      group.current.scale.set(s, s, s)
      group.current.rotation.z = Math.sin(t * 0.9) * 0.015
    }
  })

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 1.15, 0]}>
        <planeGeometry args={[1.15, 2.3]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.05} depthWrite={false} />
      </mesh>
    </group>
  )
}
