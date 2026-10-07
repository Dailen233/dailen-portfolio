import * as THREE from 'three'

export interface LabelOptions {
  color?: string
  background?: string
}

/**
 * 用系统字体把文字画到 Canvas 上，作为 3D 标牌文字覆盖层。
 * 默认透明底 + 深色墨迹文字；可指定 background 得到不透明底板。
 */
export function makeLabelTexture(text: string, options: LabelOptions = {}): THREE.CanvasTexture {
  const { color = '#2e2a24', background = 'rgba(0,0,0,0)' } = options
  const canvas = document.createElement('canvas')
  const w = 512
  const h = 160
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, w, h)
    if (background !== 'rgba(0,0,0,0)') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = color
    ctx.font = '700 84px system-ui, -apple-system, "Segoe UI", "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 2)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/**
 * 纸面展签（博物馆式小标签）：浅纸底 + 细边线 + 克制墨色正文。
 * 按文本实测宽度动态确定画布尺寸，保证标题完整、四周留白，必要时不裁切。
 * 用于画框下方的作品名称标签。
 */
export function makePlaqueTexture(text: string, options: LabelOptions = {}): THREE.CanvasTexture {
  const { color = '#3a342a' } = options
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const fontSize = 44
  const padX = 34
  const padY = 22
  const lineH = Math.round(fontSize * 1.15)
  const font = `500 ${fontSize}px system-ui, -apple-system, "Segoe UI", "PingFang SC", sans-serif`

  // 先量字宽，再定画布
  ctx.font = font
  const textW = ctx.measureText(text).width
  const w = Math.ceil(textW + padX * 2)
  const h = Math.ceil(lineH + padY * 2)
  canvas.width = w
  canvas.height = h

  // 画布尺寸变化后需重设字体
  ctx.font = font
  // 浅纸底
  ctx.fillStyle = '#faf6ee'
  ctx.fillRect(0, 0, w, h)
  // 细边线（内收一点，克制）
  ctx.strokeStyle = 'rgba(58, 52, 42, 0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
  // 正文（居中，不裁切）
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2 + 1)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/**
 * 艺术字标题（透明底 + 大号粗体 + 手绘下划线），用于走廊的「Dailen」字样。
 */
export function makeTitleTexture(text: string, color = '#2e2a24'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const w = 1024
  const h = 512
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = color
    ctx.font = '900 300px system-ui, -apple-system, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 - 20)
    // 手绘下划线（两段，略有抖动）
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w / 2 - 320, h / 2 + 120)
    ctx.quadraticCurveTo(w / 2, h / 2 + 132, w / 2 + 320, h / 2 + 118)
    ctx.stroke()
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(w / 2 - 180, h / 2 + 150)
    ctx.quadraticCurveTo(w / 2, h / 2 + 158, w / 2 + 160, h / 2 + 146)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}
