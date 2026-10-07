import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import Scene from './Scene'
import CameraRig from './CameraRig'
import { CAMERA_EXTERIOR } from './sceneConfig'

interface Props {
  onReady?: () => void
}

/** 首帧渲染后上报一次（外景纹理/材质已生成并上传的真实准备信号） */
function FirstFrameSignal({ onReady }: { onReady?: () => void }) {
  const called = useRef(false)
  useFrame(() => {
    if (!called.current) {
      called.current = true
      onReady?.()
    }
  })
  return null
}

export default function Experience({ onReady }: Props) {
  return (
    <Canvas
      camera={{
        position: [...CAMERA_EXTERIOR.pos] as [number, number, number],
        fov: 58,
        near: 0.1,
        far: 90,
      }}
      dpr={[1, 2]}
      flat
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <Scene />
        <CameraRig />
        <FirstFrameSignal onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
