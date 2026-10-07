import * as THREE from 'three'

/**
 * 画廊原创手绘素材（Canvas 2D）。
 *
 * 与入口纹理同源的手绘语言：纸白 + 墨线 + 少量暖木色。
 * - frameWood：画框木纹（可平铺）
 * - bookPage：真实项目「双语电子书」的原创书页示意图（非截图）
 * - bookStack / code / architecture / abstract：装饰性原创插画
 * - easel：画架上的小幅速写
 */

type Rnd = () => number

function mulberry32(seed: number): Rnd {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

function wobblyLine(
  ctx: CanvasRenderingContext2D,
  rnd: Rnd,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  wobble = 1.4,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  ctx.moveTo(x1, y1)
  const n = Math.max(3, Math.round(len / 10))
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const px = x1 + dx * t
    const py = y1 + dy * t
    const off = (rnd() - 0.5) * wobble * Math.sin(Math.PI * t)
    ctx.lineTo(px + nx * off, py + ny * off)
  }
  ctx.stroke()
}

function wobblyRect(
  ctx: CanvasRenderingContext2D,
  rnd: Rnd,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  width: number,
  wobble = 1.4,
): void {
  wobblyLine(ctx, rnd, x, y, x + w, y, color, width, wobble)
  wobblyLine(ctx, rnd, x + w, y, x + w, y + h, color, width, wobble)
  wobblyLine(ctx, rnd, x + w, y + h, x, y + h, color, width, wobble)
  wobblyLine(ctx, rnd, x, y + h, x, y, color, width, wobble)
}

function finalize(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

// ---------------------------------------------------------------------------
// 画框木纹（可平铺）
// ---------------------------------------------------------------------------
function drawFrameWood(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const S = 256
  ctx.fillStyle = '#c9955a'
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = '#a9743f'
  for (let i = 0; i < 16; i++) {
    const gx = 8 + i * 16
    wobblyLine(ctx, rnd, gx, 0, gx + (rnd() - 0.5) * 3, S, '#a9743f', 1.6, 1.2)
  }
  // 节疤
  ctx.fillStyle = '#8a6236'
  ctx.beginPath()
  ctx.arc(70, 90, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(200, 190, 4, 0, Math.PI * 2)
  ctx.fill()
}

// ---------------------------------------------------------------------------
// 双语电子书：原创书页示意图（左中文竖排示意 + 右英文横排示意 + 书签）
// ---------------------------------------------------------------------------
function drawBookPageArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 800
  const H = 540
  const ink = '#2e2a24'
  // 纸面背景
  ctx.fillStyle = '#fbf6ec'
  ctx.fillRect(0, 0, W, H)
  // 左页（略暖）
  ctx.fillStyle = '#f7efe0'
  ctx.fillRect(30, 30, (W - 90) / 2, H - 60)
  // 右页
  ctx.fillStyle = '#fdf9f1'
  ctx.fillRect(60 + (W - 90) / 2, 30, (W - 90) / 2, H - 60)
  // 书脊
  wobblyLine(ctx, rnd, W / 2, 30, W / 2, H - 30, '#8a7f6c', 2.4, 1)

  // 左页：竖排中文示意（短竖线成列）
  const leftX0 = 70
  for (let col = 0; col < 5; col++) {
    const colX = leftX0 + col * 52
    for (let row = 0; row < 10; row++) {
      const y = 80 + row * 42
      wobblyLine(ctx, rnd, colX, y, colX + (rnd() - 0.5) * 4, y + 28, ink, 2.6, 1.2)
    }
  }
  // 左页小插图（书）
  wobblyRect(ctx, rnd, leftX0 + 200, 90, 70, 90, ink, 2.6, 1.4)

  // 右页：横排英文示意（长短横线）
  const rightX0 = 470
  for (let row = 0; row < 13; row++) {
    const y = 78 + row * 32
    const len = 200 + rnd() * 120
    wobblyLine(ctx, rnd, rightX0, y, rightX0 + len, y + (rnd() - 0.5) * 2, ink, 2.4, 1.1)
  }

  // 书签（暖色缎带）
  ctx.fillStyle = '#b9853f'
  ctx.beginPath()
  ctx.moveTo(W - 90, 30)
  ctx.lineTo(W - 60, 30)
  ctx.lineTo(W - 75, 70)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#8a6236'
  ctx.lineWidth = 2
  ctx.stroke()

  // 外框
  wobblyRect(ctx, rnd, 16, 16, W - 32, H - 32, ink, 3.2, 2)
}

// ---------------------------------------------------------------------------
// 装饰插画：一摞书
// ---------------------------------------------------------------------------
function drawBookStackArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 540
  const H = 740
  const ink = '#2e2a24'
  ctx.fillStyle = '#fbf7ef'
  ctx.fillRect(0, 0, W, H)
  // 三本书，错落堆叠，略有倾角
  const books = [
    { x: 130, y: 330, w: 300, h: 56, c: '#c9955a', tilt: -0.04 },
    { x: 150, y: 260, w: 250, h: 52, c: '#d9a76a', tilt: 0.03 },
    { x: 120, y: 200, w: 320, h: 48, c: '#b9853f', tilt: -0.02 },
  ]
  for (const b of books) {
    ctx.save()
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
    ctx.rotate(b.tilt)
    ctx.fillStyle = b.c
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
    ctx.strokeStyle = ink
    ctx.lineWidth = 3
    wobblyRect(ctx, rnd, -b.w / 2, -b.h / 2, b.w, b.h, ink, 3, 1.2)
    // 书页纹理线
    ctx.strokeStyle = '#e7d6b2'
    ctx.lineWidth = 1.4
    wobblyLine(ctx, rnd, -b.w / 2 + 8, -b.h / 2 + 8, -b.w / 2 + 8, b.h / 2 - 8, '#e7d6b2', 1.4, 1)
    ctx.restore()
  }
  // 最顶上一本翻开
  ctx.save()
  ctx.translate(W / 2, 180)
  ctx.rotate(0.02)
  ctx.fillStyle = '#fdf9f1'
  ctx.fillRect(-150, -6, 300, 40)
  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  wobblyRect(ctx, rnd, -150, -6, 300, 40, ink, 3, 1.2)
  wobblyLine(ctx, rnd, 0, -6, 0, 34, '#8a7f6c', 2, 1)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// 装饰插画：代码草图
// ---------------------------------------------------------------------------
function drawCodeSketchArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 640
  const H = 460
  const ink = '#2e2a24'
  ctx.fillStyle = '#fbf7ef'
  ctx.fillRect(0, 0, W, H)
  // 窗口标题栏
  wobblyLine(ctx, rnd, 40, 40, W - 40, 40, ink, 2, 1)
  // 代码行（缩进错落）
  const lines = [0, 1, 1, 2, 1, 1, 2, 2, 1, 0, 1, 0]
  let y = 76
  for (let i = 0; i < lines.length; i++) {
    const indent = lines[i] * 40
    const len = 200 + rnd() * 260
    const isComment = i === 0
    const isHighlight = i === 6
    if (isHighlight) {
      // 高亮行（暖色底）
      ctx.fillStyle = '#f0e2c8'
      ctx.fillRect(50, y - 12, W - 100, 24)
    }
    ctx.strokeStyle = isComment ? '#8a7f6c' : ink
    ctx.lineWidth = isComment ? 2 : 2.4
    wobblyLine(ctx, rnd, 60 + indent, y, 60 + indent + len, y, ctx.strokeStyle, ctx.lineWidth, 1.1)
    // 偶尔的花括号
    if (i === 3 || i === 7) {
      ctx.font = '500 30px monospace'
      ctx.fillStyle = ink
      ctx.fillText('{', 60 + indent - 6, y + 9)
    }
    y += 30
  }
  wobblyRect(ctx, rnd, 40, 40, W - 80, H - 80, ink, 2.4, 1.4)
}

// ---------------------------------------------------------------------------
// 装饰插画：建筑线稿
// ---------------------------------------------------------------------------
function drawArchitectureArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 800
  const H = 560
  const ink = '#2e2a24'
  ctx.fillStyle = '#fbf7ef'
  ctx.fillRect(0, 0, W, H)
  const x0 = 120
  const x1 = W - 120
  const roofY = 130
  const baseY = H - 90
  // 屋顶（三角）
  wobblyLine(ctx, rnd, x0 - 40, roofY + 30, W / 2, 60, ink, 3, 1.6)
  wobblyLine(ctx, rnd, W / 2, 60, x1 + 40, roofY + 30, ink, 3, 1.6)
  // 楼体
  wobblyLine(ctx, rnd, x0, roofY + 30, x0, baseY, ink, 3, 1.6)
  wobblyLine(ctx, rnd, x1, roofY + 30, x1, baseY, ink, 3, 1.6)
  wobblyLine(ctx, rnd, x0, baseY, x1, baseY, ink, 3, 1.6)
  // 门窗
  const doorX = W / 2 - 40
  wobblyRect(ctx, rnd, doorX, baseY - 120, 80, 120, ink, 2.6, 1.2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = x0 + 40 + col * 120
      const wy = roofY + 70 + row * 80
      wobblyRect(ctx, rnd, wx, wy, 60, 50, ink, 2.2, 1.2)
      wobblyLine(ctx, rnd, wx + 30, wy, wx + 30, wy + 50, ink, 1.4, 0.8)
    }
  }
  // 台阶
  wobblyLine(ctx, rnd, doorX - 20, baseY + 12, doorX + 100, baseY + 12, ink, 2, 1)
  wobblyLine(ctx, rnd, doorX - 30, baseY + 24, doorX + 110, baseY + 24, ink, 2, 1)
}

// ---------------------------------------------------------------------------
// 装饰插画：抽象构图
// ---------------------------------------------------------------------------
function drawAbstractArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 520
  const H = 720
  const ink = '#2e2a24'
  ctx.fillStyle = '#fbf7ef'
  ctx.fillRect(0, 0, W, H)
  // 大圆
  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(W * 0.5, H * 0.38, 120, 0, Math.PI * 2)
  ctx.stroke()
  // 暖色小圆（局部上色）
  ctx.fillStyle = '#c9955a'
  ctx.beginPath()
  ctx.arc(W * 0.7, H * 0.3, 34, 0, Math.PI * 2)
  ctx.fill()
  // 斜线
  wobblyLine(ctx, rnd, 90, H - 120, W - 90, 140, ink, 3, 1.6)
  wobblyLine(ctx, rnd, 70, H - 180, W - 70, 220, ink, 1.8, 1.2)
  // 弧线
  ctx.strokeStyle = ink
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.arc(W * 0.3, H * 0.62, 90, Math.PI * 0.1, Math.PI * 1.15)
  ctx.stroke()
  // 点
  ctx.fillStyle = ink
  for (const [px, py] of [[150, 180], [390, 470], [300, 620], [430, 150]]) {
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------
// 画架速写（半完成的小风景）
// ---------------------------------------------------------------------------
function drawEaselArt(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 600
  const H = 420
  const ink = '#2e2a24'
  ctx.fillStyle = '#fdf9f1'
  ctx.fillRect(0, 0, W, H)
  // 远山
  wobblyLine(ctx, rnd, 40, 260, 220, 150, ink, 2.6, 1.6)
  wobblyLine(ctx, rnd, 220, 150, 400, 250, ink, 2.6, 1.6)
  // 太阳
  ctx.strokeStyle = ink
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.arc(430, 130, 44, 0, Math.PI * 2)
  ctx.stroke()
  // 树（未完成，只有半边）
  wobblyLine(ctx, rnd, 150, 320, 150, 200, ink, 3, 1.4)
  wobblyLine(ctx, rnd, 150, 220, 110, 180, ink, 2.4, 1.2)
  wobblyLine(ctx, rnd, 150, 210, 190, 175, ink, 2.4, 1.2)
  ctx.beginPath()
  ctx.arc(150, 170, 50, Math.PI * 0.6, Math.PI * 1.9)
  ctx.stroke()
  // 地平线
  wobblyLine(ctx, rnd, 40, 320, W - 40, 320, ink, 2, 1.2)
}

export interface GalleryTextures {
  frameWood: THREE.CanvasTexture
  bookPage: THREE.CanvasTexture
  bookStack: THREE.CanvasTexture
  code: THREE.CanvasTexture
  architecture: THREE.CanvasTexture
  abstract: THREE.CanvasTexture
  easel: THREE.CanvasTexture
}

let cache: GalleryTextures | null = null

export function getGalleryTextures(): GalleryTextures {
  if (cache) return cache

  const wood = makeCanvas(256, 256)
  drawFrameWood(wood.ctx, mulberry32(10))

  const bookPage = makeCanvas(800, 540)
  drawBookPageArt(bookPage.ctx, mulberry32(11))

  const bookStack = makeCanvas(540, 740)
  drawBookStackArt(bookStack.ctx, mulberry32(12))

  const code = makeCanvas(640, 460)
  drawCodeSketchArt(code.ctx, mulberry32(13))

  const architecture = makeCanvas(800, 560)
  drawArchitectureArt(architecture.ctx, mulberry32(14))

  const abstract = makeCanvas(520, 720)
  drawAbstractArt(abstract.ctx, mulberry32(15))

  const easel = makeCanvas(600, 420)
  drawEaselArt(easel.ctx, mulberry32(16))

  cache = {
    frameWood: finalize(wood.canvas),
    bookPage: finalize(bookPage.canvas),
    bookStack: finalize(bookStack.canvas),
    code: finalize(code.canvas),
    architecture: finalize(architecture.canvas),
    abstract: finalize(abstract.canvas),
    easel: finalize(easel.canvas),
  }
  return cache
}

export function disposeGalleryTextures(): void {
  if (!cache) return
  Object.values(cache).forEach((t) => t.dispose())
  cache = null
}
