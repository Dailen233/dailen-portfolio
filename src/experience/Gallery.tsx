import { useEffect, useMemo, useState } from 'react'
import { useExperience } from '../state/experience'
import { getGalleryTextures, type GalleryTextures } from './galleryTextures'
import { makePlaqueTexture } from './labelTexture'
import { GALLERY_FRAMES, type GalleryFrameSpec } from './sceneConfig'
import { projects } from '../content/projects'
import { exploreRefs } from './roomExplore'

const MAT_PAPER = '#faf6ee'

function PictureFrame({ spec, tex }: { spec: GalleryFrameSpec; tex: GalleryTextures }) {
  const { selectedId, selectProject } = useExperience()

  const isProject = spec.kind === 'project'
  const project = isProject ? projects.find((p) => p.id === spec.projectId) : undefined
  const selected = isProject && selectedId === spec.projectId

  const [hovered, setHovered] = useState(false)

  const [w, h] = spec.size
  const wallRot: [number, number, number] = spec.wall === 'right' ? [0, -Math.PI / 2, 0] : [0, 0, 0]

  // 展签：按实测文字宽度生成，按纹理长宽比设定平面尺寸，避免裁切与比例失真
  const plaqueTex = useMemo(
    () => (project ? makePlaqueTexture(project.name, { color: '#3a342a' }) : null),
    [project],
  )
  useEffect(
    () => () => {
      plaqueTex?.dispose()
    },
    [plaqueTex],
  )

  const plaqueW = Math.min(w, 1.02)
  const plaqueH = plaqueTex ? plaqueW * (plaqueTex.image.height / plaqueTex.image.width) : 0.2

  const handleOver = () => {
    if (!isProject) return
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    if (!isProject) return
    setHovered(false)
    document.body.style.cursor = 'auto'
  }
  const handleClick = () => {
    if (!isProject || !project) return
    // 拖动结束后不再打开项目（超过移动阈值由 CameraRig 置位）
    if (exploreRefs.suppressClick) return
    selectProject(project.id)
  }

  const frameColor = selected ? '#d09a55' : hovered ? '#c9955a' : '#b9853f'
  const artTex = tex[spec.art]

  return (
    <group position={spec.pos} rotation={wallRot}>
      <group rotation={[0, 0, spec.tilt]}>
        {/* 画框（木纹边框，带厚度） */}
        <mesh
          position={[0, 0, 0]}
          onClick={handleClick}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
        >
          <boxGeometry args={[w, h, 0.06]} />
          <meshBasicMaterial map={tex.frameWood} color={frameColor} />
        </mesh>
        {/* 内衬（纸面） */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[w - 0.14, h - 0.14]} />
          <meshBasicMaterial color={MAT_PAPER} />
        </mesh>
        {/* 画面 */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[w - 0.26, h - 0.26]} />
          <meshBasicMaterial map={artTex} />
        </mesh>
        {/* 展签（纸面，画框下方，稳定不随悬停变化） */}
        {project && (
          <mesh position={[0, -h / 2 - 0.22, 0.04]} raycast={() => null}>
            <planeGeometry args={[plaqueW, plaqueH]} />
            <meshBasicMaterial map={plaqueTex ?? undefined} />
          </mesh>
        )}
      </group>
    </group>
  )
}

/**
 * 画廊：在右墙与后墙布置错落画框（真实项目 + 装饰插画）。
 * 只有真实项目画框可交互：悬停边框微暖，点击选中查看详情。
 */
export default function Gallery() {
  const tex = useMemo(() => getGalleryTextures(), [])
  return (
    <group>
      {GALLERY_FRAMES.map((spec) => (
        <PictureFrame key={spec.id} spec={spec} tex={tex} />
      ))}
    </group>
  )
}
