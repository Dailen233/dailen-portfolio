import * as THREE from 'three'

/**
 * 原创手绘纹理生成（Canvas 2D）。
 *
 * 双门 sketch / painted 由同一个 drawDoorArt() 依据 painted 参数派生，
 * 共享轮廓、尺寸、UV、铰链与把手位置，保证配准，杜绝“两张独立图拼接”。
 * 其余纹理（砖墙、门框、门牌、石板路、木地板）均为程序绘制的原创墨线稿。
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

// 带抖动的手绘直线（端点平直，中段微抖，模拟铅笔）
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
  const n = Math.max(3, Math.round(len / 9))
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

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatW = 1,
  repeatH = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatW, repeatH)
  tex.needsUpdate = true
  return tex
}

// ---------------------------------------------------------------------------
// 砖墙（不透明纸面 + 手绘砖缝，中央留透明门洞；alphaTest 丢弃门洞）
// ---------------------------------------------------------------------------
function drawBrickWall(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 1200
  const H = 460
  ctx.fillStyle = '#f3ede1'
  ctx.fillRect(0, 0, W, H)

  // 门洞（世界 2.82 x 2.4，100px/unit）
  const holeHalf = 141
  const holeTopY = H - 240

  const rowH = 34
  const brickH = 26
  for (let row = 0, y = 6; y < H + rowH; row++, y += rowH) {
    const offset = row % 2 === 0 ? 0 : 50
    for (let x = -50 + offset; x < W + 50; x += 100) {
      const bw = 86
      const bh = brickH
      // 跳过门洞区域
      const cx = x + bw / 2
      const cy = y + bh / 2
      if (cx > W / 2 - holeHalf - 8 && cx < W / 2 + holeHalf + 8 && cy > holeTopY - 8) {
        continue
      }
      const fill = rnd() < 0.08 ? '#e7d6b6' : '#f1ead9'
      ctx.fillStyle = fill
      ctx.fillRect(x, y, bw, bh)
      wobblyRect(ctx, rnd, x, y, bw, bh, '#4a4236', 3, 1.6)
      // 偶尔的砖面短划痕
      if (rnd() < 0.18) {
        wobblyLine(ctx, rnd, x + bw * 0.3, y + bh * 0.4, x + bw * 0.7, y + bh * 0.5, '#8a7f6c', 1.6, 0.6)
      }
    }
  }

  // 门洞上方的过梁砖缝
  wobblyLine(ctx, rnd, W / 2 - holeHalf, holeTopY, W / 2 + holeHalf, holeTopY, '#4a4236', 2.4, 1.2)

  // 清空门洞为透明（门框会覆盖硬边）
  ctx.clearRect(W / 2 - holeHalf - 6, holeTopY - 6, holeHalf * 2 + 12, H - holeTopY + 6)
}

// ---------------------------------------------------------------------------
// 门框（透明底 + 墨线门套 + 上楣）
// ---------------------------------------------------------------------------
function drawDoorFrame(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  // 世界：外框 3.2 x 2.8，门洞 2.82 x 2.4；200px/unit
  const W = 640
  const H = 560
  const ox = 26
  const oy = 20
  const iw = 564 // 内洞 2.82
  const ih = 480 // 内洞 2.4
  const ix = ox + (W - ox * 2 - iw) / 2
  const iy = H - ih - oy

  // 上楣（外框顶部加宽）
  wobblyRect(ctx, rnd, ox, oy, W - ox * 2, 46, '#3a342a', 3, 1.4)
  wobblyLine(ctx, rnd, ox + 30, oy + 46, W - ox - 30, oy + 46, '#3a342a', 2, 1.2)

  // 门套内外框
  wobblyRect(ctx, rnd, ox, oy + 46, W - ox * 2, H - oy - 46, '#3a342a', 3, 1.4)
  wobblyRect(ctx, rnd, ix, iy, iw, ih, '#3a342a', 3, 1.4)

  // 内洞透明
  ctx.clearRect(ix + 1, iy + 1, iw - 2, ih - 2)
}

// ---------------------------------------------------------------------------
// 门牌（透明底 + 两根链 + 暖木牌）
// ---------------------------------------------------------------------------
function drawSignPlate(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 512
  const cx = W / 2
  // 链子
  wobblyLine(ctx, rnd, cx - 60, 0, cx - 40, 74, '#3a342a', 2.5, 1)
  wobblyLine(ctx, rnd, cx + 60, 0, cx + 40, 74, '#3a342a', 2.5, 1)
  // 木牌
  const px = 96
  const py = 74
  const pw = W - px * 2
  const ph = 148
  ctx.fillStyle = '#c9955a'
  ctx.fillRect(px, py, pw, ph)
  ctx.strokeStyle = '#9a6f3a'
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const gy = py + 18 + i * 16
    wobblyLine(ctx, rnd, px + 14, gy, px + pw - 14, gy + (rnd() - 0.5) * 4, '#a9743f', 1.4, 1)
  }
  wobblyRect(ctx, rnd, px, py, pw, ph, '#4a3520', 3.5, 1.4)
  wobblyRect(ctx, rnd, px + 8, py + 8, pw - 16, ph - 16, '#4a3520', 1.6, 1)
}

// ---------------------------------------------------------------------------
// 石板路（透明底 + 透视石板，靠近相机宽、靠近门窄）
// ---------------------------------------------------------------------------
function drawStonePath(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 600
  const H = 800
  const cx = W / 2
  const topHalf = 130
  const botHalf = 280
  const bottomY = H - 10
  const topY = 10

  // 路径轮廓（梯形：近相机宽、近门窄）
  ctx.fillStyle = '#e6dfd0'
  ctx.beginPath()
  ctx.moveTo(cx - botHalf, bottomY)
  ctx.lineTo(cx + botHalf, bottomY)
  ctx.lineTo(cx + topHalf, topY)
  ctx.lineTo(cx - topHalf, topY)
  ctx.closePath()
  ctx.fill()

  // 横向石板缝
  const bands = 6
  for (let i = 1; i < bands; i++) {
    const t = i / bands
    const y = bottomY - t * (bottomY - topY)
    const half = botHalf + (topHalf - botHalf) * t
    wobblyLine(ctx, rnd, cx - half, y, cx + half, y, '#4a4236', 2, 1.6)
  }
  // 纵向交错石板缝
  const bandH = (bottomY - topY) / bands
  for (let i = 1; i < bands; i++) {
    const t = i / bands
    const y = bottomY - t * (bottomY - topY)
    const half = botHalf + (topHalf - botHalf) * t
    wobblyLine(ctx, rnd, cx, y, cx, y + bandH, '#4a4236', 1.6, 1)
    wobblyLine(ctx, rnd, cx - half * 0.5, y + bandH * 0.2, cx - half * 0.5, y + bandH * 0.8, '#4a4236', 1.4, 1)
    wobblyLine(ctx, rnd, cx + half * 0.5, y + bandH * 0.2, cx + half * 0.5, y + bandH * 0.8, '#4a4236', 1.4, 1)
  }
  // 轮廓
  ctx.strokeStyle = '#4a4236'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.moveTo(cx - botHalf, bottomY)
  ctx.lineTo(cx + botHalf, bottomY)
  ctx.lineTo(cx + topHalf, topY)
  ctx.lineTo(cx - topHalf, topY)
  ctx.closePath()
  ctx.stroke()
}

// ---------------------------------------------------------------------------
// 木地板（不透明，木板条水平可平铺）
// ---------------------------------------------------------------------------
function drawWoodFloor(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const S = 512
  const plank = S / 4
  for (let p = 0; p < 4; p++) {
    const y0 = p * plank
    ctx.fillStyle = p % 2 === 0 ? '#e7d6b2' : '#ecdbb8'
    ctx.fillRect(0, y0, S, plank)
    // 木纹（横向，整条，不跨越边界 → 可平铺）
    ctx.strokeStyle = '#c2a06a'
    ctx.lineWidth = 1.6
    for (let g = 0; g < 4; g++) {
      const gy = y0 + 18 + g * (plank - 36) / 3
      wobblyLine(ctx, rnd, 0, gy, S, gy + (rnd() - 0.5) * 3, '#c2a06a', 1.4, 1.2)
    }
    // 节疤
    if (p % 2 === 1) {
      ctx.fillStyle = '#b08a55'
      ctx.beginPath()
      ctx.arc(90 + rnd() * 300, y0 + plank / 2, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    // 板缝（边界线，保证上下对齐）
    ctx.strokeStyle = '#a98b5e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, y0)
    ctx.lineTo(S, y0)
    ctx.stroke()
  }
}

// ---------------------------------------------------------------------------
// 双门（sketch/painted 同一几何）
// ---------------------------------------------------------------------------
function drawDoorArt(ctx: CanvasRenderingContext2D, rnd: Rnd, painted: boolean): void {
  const W = 560
  const H = 960
  const m = 8
  const x0 = m
  const y0 = m
  const x1 = W - m
  const y1 = H - m
  const ink = painted ? '#6b4526' : '#2e2a24'
  const lineW = painted ? 3 : 4

  // 底色：sketch 为不透明灰白纸面（覆盖下层暖色），painted 为暖木
  if (painted) {
    ctx.fillStyle = '#ca9557'
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
    // 纵向木纹
    ctx.strokeStyle = '#a9743f'
    ctx.lineWidth = 2
    for (let i = 0; i < 22; i++) {
      const gx = x0 + 14 + i * 24
      wobblyLine(ctx, rnd, gx, y0 + 10, gx + (rnd() - 0.5) * 4, y1 - 10, '#a9743f', 1.6, 1.4)
    }
  } else {
    ctx.fillStyle = '#f0ebe0'
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  }

  // 两块内嵌面板
  const inset = 96
  const midY = H / 2
  const panel = (
    py0: number,
    py1: number,
  ) => {
    if (painted) {
      ctx.fillStyle = '#d9a76a'
      ctx.fillRect(x0 + inset, py0, x1 - x0 - inset * 2, py1 - py0)
    }
    wobblyRect(ctx, rnd, x0 + inset, py0, x1 - x0 - inset * 2, py1 - py0, ink, lineW, 2)
    wobblyRect(ctx, rnd, x0 + inset + 10, py0 + 10, x1 - x0 - inset * 2 - 20, py1 - py0 - 20, ink, 1.4, 1)
  }
  panel(y0 + 150, midY - 20)
  panel(midY + 20, y1 - 150)

  // 外框
  wobblyRect(ctx, rnd, x0, y0, x1 - x0, y1 - y0, ink, lineW, 3)

  // 铰链（左缘 = 门轴侧；右门经 scale.x=-1 镜像后即为右侧轴）
  for (const hy of [y0 + 180, y1 - 180]) {
    ctx.fillStyle = painted ? '#8a6236' : '#2e2a24'
    ctx.fillRect(x0 - 2, hy - 8, 26, 16)
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.6
    ctx.strokeRect(x0 - 2, hy - 8, 26, 16)
    ctx.fillStyle = painted ? '#6b4526' : '#2e2a24'
    ctx.beginPath()
    ctx.arc(x0 + 8, hy, 2.4, 0, Math.PI * 2)
    ctx.arc(x0 + 20, hy, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }

  // 把手（右缘 = 门缝侧）
  const hy = H / 2
  const hx = x1 - 34
  ctx.strokeStyle = ink
  ctx.lineWidth = painted ? 4 : 5
  wobblyLine(ctx, rnd, hx - 26, hy, hx + 10, hy, ink, painted ? 4 : 5, 0.6)
  ctx.fillStyle = painted ? '#8a6236' : '#2e2a24'
  ctx.beginPath()
  ctx.arc(hx - 26, hy, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.6
  ctx.stroke()
}

// ---------------------------------------------------------------------------
// 门背（开门后可见：更简洁的木门板，无把手）
// ---------------------------------------------------------------------------
function drawDoorBack(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 560
  const H = 960
  const m = 8
  const x0 = m
  const y0 = m
  const x1 = W - m
  const y1 = H - m
  const ink = '#6b4526'

  // 木门板底
  ctx.fillStyle = '#c08a4e'
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  // 纵向木纹
  ctx.strokeStyle = '#a9743f'
  ctx.lineWidth = 2
  for (let i = 0; i < 22; i++) {
    const gx = x0 + 14 + i * 24
    wobblyLine(ctx, rnd, gx, y0 + 10, gx + (rnd() - 0.5) * 4, y1 - 10, '#a9743f', 1.6, 1.4)
  }

  // 两块内嵌面板（更简洁）
  const inset = 96
  const midY = H / 2
  ctx.fillStyle = '#d9a76a'
  ctx.fillRect(x0 + inset, y0 + 150, x1 - x0 - inset * 2, midY - 20 - (y0 + 150))
  ctx.fillRect(x0 + inset, midY + 20, x1 - x0 - inset * 2, y1 - 150 - (midY + 20))
  wobblyRect(ctx, rnd, x0 + inset, y0 + 150, x1 - x0 - inset * 2, midY - 20 - (y0 + 150), ink, 3, 2)
  wobblyRect(ctx, rnd, x0 + inset, midY + 20, x1 - x0 - inset * 2, y1 - 150 - (midY + 20), ink, 3, 2)

  // 外框
  wobblyRect(ctx, rnd, x0, y0, x1 - x0, y1 - y0, ink, 3, 3)

  // 铰链（与门正面同位置）
  for (const hy of [y0 + 180, y1 - 180]) {
    ctx.fillStyle = '#8a6236'
    ctx.fillRect(x0 - 2, hy - 8, 26, 16)
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.6
    ctx.strokeRect(x0 - 2, hy - 8, 26, 16)
    ctx.fillStyle = '#6b4526'
    ctx.beginPath()
    ctx.arc(x0 + 8, hy, 2.4, 0, Math.PI * 2)
    ctx.arc(x0 + 20, hy, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------
// 虚拟人物（原创手绘线稿：头、躯干、双腿、左臂下垂、右臂举起挥手）
// ---------------------------------------------------------------------------
function drawAvatar(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const cx = 256
  const ink = '#2e2a24'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 头
  ctx.strokeStyle = ink
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, 150, 72, 0, Math.PI * 2)
  ctx.stroke()
  // 眼睛
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(cx - 26, 140, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 26, 140, 7, 0, Math.PI * 2)
  ctx.fill()
  // 微笑
  ctx.beginPath()
  ctx.arc(cx, 162, 28, Math.PI * 0.15, Math.PI * 0.85)
  ctx.stroke()

  // 躯干
  wobblyLine(ctx, rnd, cx - 70, 250, cx + 70, 250, ink, 6, 1.4)
  wobblyLine(ctx, rnd, cx - 70, 250, cx - 82, 560, ink, 6, 1.6)
  wobblyLine(ctx, rnd, cx + 70, 250, cx + 82, 560, ink, 6, 1.6)

  // 左臂（垂下）
  wobblyLine(ctx, rnd, cx - 70, 265, cx - 112, 425, ink, 5, 1.5)
  wobblyLine(ctx, rnd, cx - 112, 425, cx - 96, 500, ink, 5, 1.5)

  // 右臂（举起挥手）
  wobblyLine(ctx, rnd, cx + 70, 265, cx + 140, 205, ink, 5, 1.5)
  wobblyLine(ctx, rnd, cx + 140, 205, cx + 166, 130, ink, 5, 1.5)
  // 右手
  ctx.beginPath()
  ctx.arc(cx + 172, 122, 13, 0, Math.PI * 2)
  ctx.stroke()

  // 腿
  wobblyLine(ctx, rnd, cx - 30, 560, cx - 46, 900, ink, 6, 1.6)
  wobblyLine(ctx, rnd, cx + 30, 560, cx + 46, 900, ink, 6, 1.6)
  // 脚
  wobblyLine(ctx, rnd, cx - 46, 900, cx - 72, 906, ink, 5, 1)
  wobblyLine(ctx, rnd, cx + 46, 900, cx + 72, 906, ink, 5, 1)
}

export interface EntranceTextures {
  brickWall: THREE.CanvasTexture
  doorFrame: THREE.CanvasTexture
  signPlate: THREE.CanvasTexture
  stonePath: THREE.CanvasTexture
  woodFloor: THREE.CanvasTexture
  doorSketch: THREE.CanvasTexture
  doorPainted: THREE.CanvasTexture
  doorBack: THREE.CanvasTexture
  avatar: THREE.CanvasTexture
}

let cache: EntranceTextures | null = null

export function getEntranceTextures(): EntranceTextures {
  if (cache) return cache

  const brick = makeCanvas(1200, 460)
  drawBrickWall(brick.ctx, mulberry32(1))

  const frame = makeCanvas(640, 560)
  drawDoorFrame(frame.ctx, mulberry32(2))

  const sign = makeCanvas(512, 256)
  drawSignPlate(sign.ctx, mulberry32(3))

  const stone = makeCanvas(600, 800)
  drawStonePath(stone.ctx, mulberry32(4))

  const wood = makeCanvas(512, 512)
  drawWoodFloor(wood.ctx, mulberry32(5))

  const doorSketchCanvas = makeCanvas(560, 960)
  drawDoorArt(doorSketchCanvas.ctx, mulberry32(6), false)
  const doorPaintedCanvas = makeCanvas(560, 960)
  drawDoorArt(doorPaintedCanvas.ctx, mulberry32(6), true)
  const doorBackCanvas = makeCanvas(560, 960)
  drawDoorBack(doorBackCanvas.ctx, mulberry32(8))

  const avatarCanvas = makeCanvas(512, 1024)
  drawAvatar(avatarCanvas.ctx, mulberry32(7))

  cache = {
    brickWall: finalizeTexture(brick.canvas),
    doorFrame: finalizeTexture(frame.canvas),
    signPlate: finalizeTexture(sign.canvas),
    stonePath: finalizeTexture(stone.canvas),
    woodFloor: finalizeTexture(wood.canvas),
    doorSketch: finalizeTexture(doorSketchCanvas.canvas),
    doorPainted: finalizeTexture(doorPaintedCanvas.canvas),
    doorBack: finalizeTexture(doorBackCanvas.canvas),
    avatar: finalizeTexture(avatarCanvas.canvas),
  }
  return cache
}

// 供测试/检查时释放（应用运行时保持单例，通常不调用）
export function disposeEntranceTextures(): void {
  if (!cache) return
  Object.values(cache).forEach((t) => t.dispose())
  cache = null
}
