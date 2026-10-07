import * as THREE from 'three'

/**
 * 外景原创手绘素材（Canvas 2D）。
 * 纸面铅笔线稿 + 克制墨色 + 少量暖木与植物色。
 * - building：完整建筑立面（屋顶檐口 + 砖墙 + 基座 + 门洞），不再是孤立贴图
 * - tree / catBody / window / character / flowerBox：树、猫、窗、探头角色、花槽
 * - stonePath：错缝、厚薄、形状变化、草缝的石板路
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
  tex.needsUpdate = true
  return tex
}

// ---------------------------------------------------------------------------
// 完整建筑立面（不透明纸面；世界 12 x 5.4，100px/unit；canvas_y=(5.4-world_y)*100）
// ---------------------------------------------------------------------------
function drawBuilding(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 1200
  const H = 540
  // 墙面底色
  ctx.fillStyle = '#f3ede1'
  ctx.fillRect(0, 0, W, H)

  // 门洞（世界 2.82 x 2.4）
  const holeHalf = 141
  const holeTopY = 300 // (5.4-2.4)*100

  // 砖身（世界 0.8..4.5 → canvas 90..460）
  const brickTop = 90
  const brickBot = 460
  const rowH = 34
  const brickH = 26
  for (let row = 0, y = brickTop; y < brickBot + rowH; row++, y += rowH) {
    const offset = row % 2 === 0 ? 0 : 50
    for (let x = -50 + offset; x < W + 50; x += 100) {
      const bw = 86
      const bh = brickH
      const cx = x + bw / 2
      const cy = y + bh / 2
      if (cx > W / 2 - holeHalf - 8 && cx < W / 2 + holeHalf + 8 && cy > holeTopY - 8) continue
      const tones = ['#f1ead9', '#efe4d0', '#e7d6b6', '#f3ead8', '#ebdcc3']
      const fill = tones[Math.floor(rnd() * tones.length)]
      ctx.fillStyle = fill
      ctx.fillRect(x, y, bw, bh)
      wobblyRect(ctx, rnd, x, y, bw, bh, '#4a4236', 2.4, 1.4)
      // 偶尔的砖面风化斑与短划痕
      if (rnd() < 0.12) {
        ctx.fillStyle = '#d8c8aa'
        ctx.fillRect(x + bw * 0.2, y + bh * 0.25, bw * 0.55, bh * 0.5)
      }
      if (rnd() < 0.16) {
        wobblyLine(ctx, rnd, x + bw * 0.3, y + bh * 0.4, x + bw * 0.7, y + bh * 0.5, '#8a7f6c', 1.3, 0.6)
      }
    }
  }

  // 屋顶（低坡屋面 + 深檐口，明确建筑顶界）
  ctx.fillStyle = '#d9cdb6'
  ctx.fillRect(0, 0, W, 44)
  wobblyLine(ctx, rnd, 0, 6, W, 6, '#3a342a', 3.4, 1.2)
  // 屋面瓦楞短排线
  ctx.strokeStyle = '#a8977d'
  ctx.lineWidth = 1.4
  for (let x = 24; x < W; x += 42) {
    wobblyLine(ctx, rnd, x, 10, x, 42, '#a8977d', 1.3, 0.8)
  }
  // 檐口（加厚 + 阴影）
  ctx.fillStyle = '#cbbf9f'
  ctx.fillRect(0, 44, W, 46)
  wobblyLine(ctx, rnd, 0, 44, W, 44, '#3a342a', 3.4, 1.2)
  wobblyLine(ctx, rnd, 0, 90, W, 90, '#4a4236', 2.8, 1.2)
  ctx.strokeStyle = '#8a7f6c'
  ctx.lineWidth = 1.6
  for (let x = 16; x < W; x += 26) {
    wobblyLine(ctx, rnd, x, 50, x, 86, '#8a7f6c', 1.4, 0.4)
  }

  // 基座（世界 0..0.8 → canvas 460..540）
  ctx.fillStyle = '#e3d8c4'
  ctx.fillRect(0, 470, W, 70)
  wobblyLine(ctx, rnd, 0, 470, W, 470, '#4a4236', 2.6, 1.2)
  wobblyLine(ctx, rnd, 0, 538, W, 538, '#4a4236', 2.4, 1.2)

  // 门洞上过梁
  wobblyLine(ctx, rnd, W / 2 - holeHalf, holeTopY, W / 2 + holeHalf, holeTopY, '#4a4236', 2.4, 1.2)

  // 清空门洞为透明
  ctx.clearRect(W / 2 - holeHalf - 6, holeTopY - 6, holeHalf * 2 + 12, H - holeTopY + 6)

  // 清空窗洞为透明（世界 x 3.6..4.8, y 1.55..2.85，供窗内背景与探头角色透出）
  ctx.clearRect(958, 253, 124, 134)
  // 窗洞四周砖缘线
  wobblyRect(ctx, rnd, 956, 251, 128, 138, '#4a4236', 2.2, 1)
}

// ---------------------------------------------------------------------------
// 树（透明底：主干 + 分枝 + 叶簇 + 少量花）
// ---------------------------------------------------------------------------
function drawTree(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 600
  const H = 900
  const cx = W / 2
  const ink = '#4a4236'

  const trunkBot = H - 10
  const trunkTop = H - 480
  const halfBot = 44
  const halfTop = 15

  // 主干轮廓（两侧墨线，非实色锥形）
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + side * halfBot, trunkBot)
    const seg = 7
    for (let i = 1; i <= seg; i++) {
      const t = i / seg
      const y = trunkBot - t * (trunkBot - trunkTop)
      const half = halfBot + (halfTop - halfBot) * t
      ctx.lineTo(cx + side * half + (rnd() - 0.5) * 7, y)
    }
    ctx.stroke()
  }
  // 树皮排线（竖向，疏密不一）
  ctx.strokeStyle = '#8d7c66'
  for (let i = 0; i < 6; i++) {
    const gx = cx - halfBot + 12 + (i * (halfBot * 2 - 24)) / 5
    ctx.lineWidth = 1.6 + (i % 2)
    wobblyLine(ctx, rnd, gx, trunkBot - 8, gx + (rnd() - 0.5) * 6, trunkTop + 40, '#8d7c66', 1.6 + (i % 2), 1.8)
  }
  // 节疤
  ctx.strokeStyle = '#8d7c66'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.ellipse(cx - 8, trunkBot - 200, 13, 20, 0.18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx - 8, trunkBot - 200, 6, 10, 0.18, 0, Math.PI * 2)
  ctx.stroke()

  // 主分枝
  const branches: Array<[number, number, number, number, number]> = [
    // [起点x, 起点y, 终点x, 终点y, 线宽]
    [cx, H - 400, cx - 170, H - 560, 9],
    [cx, H - 430, cx - 60, H - 640, 8],
    [cx, H - 420, cx + 130, H - 580, 8],
    [cx, H - 450, cx + 90, H - 700, 7],
    [cx - 120, H - 520, cx - 230, H - 610, 5],
    [cx + 100, H - 560, cx + 190, H - 650, 5],
  ]
  ctx.strokeStyle = ink
  ctx.lineCap = 'round'
  for (const [x1, y1, x2, y2, w] of branches) {
    ctx.lineWidth = w
    wobblyLine(ctx, rnd, x1, y1, x2, y2, ink, w, 1.6)
  }

  // 叶簇（成团的小叶片笔画）
  const leafClusters: Array<[number, number, number]> = [
    [cx, H - 560, 120],
    [cx - 180, H - 590, 88],
    [cx + 150, H - 610, 88],
    [cx - 70, H - 680, 82],
    [cx + 100, H - 720, 78],
    [cx - 210, H - 620, 60],
    [cx + 190, H - 660, 60],
  ]
  for (const [lx, ly, r] of leafClusters) {
    drawLeafCluster(ctx, rnd, lx, ly, r)
  }
}

function drawLeafCluster(ctx: CanvasRenderingContext2D, rnd: Rnd, cx: number, cy: number, r: number): void {
  const greens = ['#a9b587', '#8a9a6a', '#9aab7a', '#7d8c5e']
  ctx.lineCap = 'round'
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2
    const d = rnd() * r * 0.9
    const lx = cx + Math.cos(a) * d
    const ly = cy + Math.sin(a) * d * 0.7
    const len = 18 + rnd() * 22
    const ang = a + Math.PI / 2 + (rnd() - 0.5) * 0.9
    ctx.strokeStyle = greens[Math.floor(rnd() * greens.length)]
    ctx.lineWidth = 4 + rnd() * 4
    wobblyLine(
      ctx,
      rnd,
      lx,
      ly,
      lx + Math.cos(ang) * len,
      ly + Math.sin(ang) * len,
      ctx.strokeStyle as string,
      ctx.lineWidth,
      2,
    )
  }
}

// ---------------------------------------------------------------------------
// 猫（透明底：蹲姿 + 头部 + 眼白 + 鼻 + 嘴 + 胡须；瞳孔为独立 3D 元件）
// ---------------------------------------------------------------------------
function drawCat(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const ink = '#2e2a24'
  const fur = '#d9cbb4'

  // 尾巴（在身后绕到一侧）
  ctx.strokeStyle = ink
  ctx.lineWidth = 12
  ctx.lineCap = 'round'
  wobblyLine(ctx, rnd, 90, 280, 40, 230, ink, 12, 2)
  wobblyLine(ctx, rnd, 40, 230, 60, 190, ink, 12, 2)

  // 身体（蹲姿，椭圆）
  ctx.fillStyle = fur
  ctx.beginPath()
  ctx.ellipse(180, 270, 82, 62, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.stroke()
  // 前腿
  wobblyLine(ctx, rnd, 140, 300, 140, 338, ink, 5, 1.2)
  wobblyLine(ctx, rnd, 220, 300, 220, 338, ink, 5, 1.2)
  // 身体排线（毛感）
  for (let i = 0; i < 6; i++) {
    wobblyLine(ctx, rnd, 130 + i * 18, 240, 130 + i * 18, 300, '#b7a78d', 1.4, 1)
  }

  // 头
  ctx.fillStyle = fur
  ctx.beginPath()
  ctx.arc(180, 150, 72, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.stroke()
  // 耳朵（两三角）
  for (const ex of [116, 244]) {
    ctx.fillStyle = fur
    ctx.beginPath()
    ctx.moveTo(ex - 30, 120)
    ctx.lineTo(ex, 52)
    ctx.lineTo(ex + 30, 118)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = ink
    ctx.lineWidth = 3.5
    ctx.stroke()
  }

  // 眼白（瞳孔为独立元件，见 Cat.tsx）
  ctx.fillStyle = '#fdfaf3'
  ctx.beginPath()
  ctx.arc(150, 150, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(210, 150, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(150, 150, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(210, 150, 16, 0, Math.PI * 2)
  ctx.stroke()

  // 鼻
  ctx.fillStyle = '#b5654a'
  ctx.beginPath()
  ctx.moveTo(176, 172)
  ctx.lineTo(184, 172)
  ctx.lineTo(180, 179)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 2
  ctx.stroke()
  // 嘴（三瓣）
  wobblyLine(ctx, rnd, 180, 179, 180, 190, ink, 2, 0.8)
  wobblyLine(ctx, rnd, 180, 190, 166, 186, ink, 2, 0.8)
  wobblyLine(ctx, rnd, 180, 190, 194, 186, ink, 2, 0.8)
  // 胡须
  for (const [x1, y1, x2, y2] of [[150, 176, 110, 170], [150, 184, 108, 190], [210, 176, 250, 170], [210, 184, 252, 190]]) {
    wobblyLine(ctx, rnd, x1, y1, x2, y2, ink, 1.8, 1)
  }
}

// ---------------------------------------------------------------------------
// 窗（透明底：木窗框 + 玻璃 + 窗棂 + 窗台）
// ---------------------------------------------------------------------------
function drawWindow(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const ink = '#4a4236'
  const frame = '#c9955a'

  // 玻璃：透明（仅反光斜线 + 内缘细线暗示，让窗内角色透出）
  wobblyLine(ctx, rnd, 100, 60, 180, 320, '#c3cdb8', 3, 2)
  wobblyLine(ctx, rnd, 130, 60, 210, 320, '#c3cdb8', 2, 2)
  wobblyRect(ctx, rnd, 62, 42, 276, 296, '#c3cdb8', 1.4, 1)

  // 窗棂（十字）
  wobblyLine(ctx, rnd, 200, 40, 200, 340, ink, 5, 1)
  wobblyLine(ctx, rnd, 60, 190, 340, 190, ink, 5, 1)

  // 窗框
  wobblyRect(ctx, rnd, 52, 32, 296, 316, frame, 9, 1.2)
  // 内框线
  wobblyRect(ctx, rnd, 60, 40, 280, 300, ink, 2.5, 1)

  // 窗台
  ctx.fillStyle = frame
  ctx.fillRect(44, 348, 312, 26)
  wobblyRect(ctx, rnd, 44, 348, 312, 26, ink, 3, 1)
  wobblyLine(ctx, rnd, 44, 362, 356, 362, '#8a6236', 1.6, 1)
}

// ---------------------------------------------------------------------------
// 窗内背景（不透明：暖灰室内墙 + 两侧暖木窗帘，营造窗口内部空间）
// ---------------------------------------------------------------------------
function drawWindowInterior(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 320
  const H = 340
  // 暖灰室内墙
  ctx.fillStyle = '#8f8269'
  ctx.fillRect(0, 0, W, H)
  // 墙面轻微横纹
  ctx.strokeStyle = '#7a6e58'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 13; i++) {
    const y = 14 + i * 24
    wobblyLine(ctx, rnd, 20, y, W - 20, y + (rnd() - 0.5) * 3, '#7a6e58', 1.4, 1)
  }
  // 两侧暖木窗帘
  ctx.fillStyle = '#b9853f'
  ctx.fillRect(10, 8, 36, H - 16)
  ctx.fillRect(W - 46, 8, 36, H - 16)
  ctx.strokeStyle = '#8a6236'
  ctx.lineWidth = 2
  ctx.strokeRect(10, 8, 36, H - 16)
  ctx.strokeRect(W - 46, 8, 36, H - 16)
  // 窗帘褶皱
  for (const cxx of [20, 28, W - 28, W - 20]) {
    wobblyLine(ctx, rnd, cxx, 12, cxx, H - 12, '#8a6236', 1.4, 1)
  }
}

// ---------------------------------------------------------------------------
// 探头角色（透明底：头 + 肩，用于窗口悬停反馈）
// ---------------------------------------------------------------------------
function drawCharacter(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const ink = '#2e2a24'

  // 肩（从底部露出，衣领着色以区分墙体）
  ctx.fillStyle = '#c9955a'
  ctx.beginPath()
  ctx.ellipse(150, 400, 130, 80, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.stroke()
  // 衣领
  wobblyLine(ctx, rnd, 100, 358, 200, 358, '#8a6236', 3, 1)

  // 头（暖肤色，区别于纸墙）
  ctx.fillStyle = '#ead3ac'
  ctx.beginPath()
  ctx.arc(150, 210, 95, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.stroke()

  // 头发（顶部几缕）
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + i * 0.1)
    wobblyLine(ctx, rnd, 150 + Math.cos(a) * 80, 210 + Math.sin(a) * 80, 150 + Math.cos(a) * 110, 200 + Math.sin(a) * 110, ink, 5, 2)
  }

  // 眼睛（看窗外）
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(118, 210, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(182, 210, 9, 0, Math.PI * 2)
  ctx.fill()
  // 眉毛
  wobblyLine(ctx, rnd, 104, 188, 132, 182, ink, 2.5, 1)
  wobblyLine(ctx, rnd, 168, 182, 196, 188, ink, 2.5, 1)
  // 嘴（微笑）
  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(150, 232, 24, Math.PI * 0.15, Math.PI * 0.85)
  ctx.stroke()
}

// ---------------------------------------------------------------------------
// 花槽（透明底：木槽 + 茎叶 + 花朵）
// ---------------------------------------------------------------------------
function drawFlowerBox(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const ink = '#4a4236'

  // 木槽
  ctx.fillStyle = '#c9955a'
  ctx.fillRect(60, 240, 400, 110)
  wobblyRect(ctx, rnd, 60, 240, 400, 110, ink, 3.5, 1.2)
  wobblyLine(ctx, rnd, 60, 300, 460, 300, '#8a6236', 2, 1)
  for (let i = 0; i < 5; i++) {
    wobblyLine(ctx, rnd, 80 + i * 80, 240, 80 + i * 80, 350, '#8a6236', 1.6, 1)
  }

  // 茎（从槽口向上）
  const stems: Array<[number, number, number]> = [
    [120, 240, 110],
    [180, 240, 150],
    [260, 240, 170],
    [340, 240, 140],
    [400, 240, 100],
  ]
  ctx.strokeStyle = '#7d8c5e'
  ctx.lineCap = 'round'
  for (const [sx, sy, top] of stems) {
    ctx.lineWidth = 4
    wobblyLine(ctx, rnd, sx, sy, sx + (rnd() - 0.5) * 14, top, '#7d8c5e', 4, 2)
    // 侧枝 + 叶
    const lx = sx + (rnd() - 0.5) * 40
    const ly = top + 40 + rnd() * 40
    drawLeaf(ctx, lx, ly, 18, rnd() * 0.5)
    drawLeaf(ctx, sx - (rnd() - 0.5) * 30, ly + 20, 16, rnd() * 0.5 + 2)
  }

  // 花朵（暖色，几朵）
  const flowers: Array<[number, number, number]> = [
    [150, 100, 20],
    [250, 70, 22],
    [360, 110, 18],
    [200, 130, 15],
  ]
  for (const [fx, fy, fr] of flowers) {
    ctx.fillStyle = '#c98d5a'
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(fx + Math.cos(a) * fr * 0.7, fy + Math.sin(a) * fr * 0.7, fr * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#d9a76a'
    ctx.beginPath()
    ctx.arc(fx, fy, fr * 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number): void {
  ctx.fillStyle = '#a3b07e'
  ctx.strokeStyle = '#6d7f52'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.ellipse(x, y, len * 0.6, len * 0.28, ang, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - Math.cos(ang) * len * 0.5, y - Math.sin(ang) * len * 0.5)
  ctx.lineTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5)
  ctx.stroke()
}

// ---------------------------------------------------------------------------
// 石板路（透明底：错缝、厚薄不一、形状变化的石板 + 草缝）
// ---------------------------------------------------------------------------
function drawStonePath(ctx: CanvasRenderingContext2D, rnd: Rnd): void {
  const W = 600
  const H = 800
  const cx = W / 2
  const topHalf = 120
  const botHalf = 290
  const bottomY = H - 8
  const topY = 6

  // 路径底色（梯形，略不规则边缘，贴近地面纸色）
  ctx.fillStyle = '#eae3d3'
  ctx.beginPath()
  ctx.moveTo(cx - botHalf, bottomY)
  ctx.quadraticCurveTo(cx - botHalf * 0.9, bottomY * 0.6, cx - topHalf, topY)
  ctx.lineTo(cx + topHalf, topY)
  ctx.quadraticCurveTo(cx + botHalf * 0.9, bottomY * 0.6, cx + botHalf, bottomY)
  ctx.closePath()
  ctx.fill()

  // 沿路径纵向铺不规则石板（每块形状略异、错缝）
  const rows = 7
  for (let r = 0; r < rows; r++) {
    const t0 = r / rows
    const t1 = (r + 1) / rows
    const y0 = bottomY - t0 * (bottomY - topY)
    const y1 = bottomY - t1 * (bottomY - topY)
    const half0 = botHalf + (topHalf - botHalf) * t0
    const half1 = botHalf + (topHalf - botHalf) * t1
    // 每行 1~3 块，错缝
    const cols = r === rows - 1 ? 1 : r === 0 ? 1 : 1 + (r % 3)
    for (let c = 0; c < cols; c++) {
      const f = cols === 1 ? 0 : (c + 0.5) / cols - 0.5
      const jx = (rnd() - 0.5) * 0.12
      const w0 = (half0 * 2) / cols * (0.86 + rnd() * 0.2)
      const cx0 = cx + f * half0 * 1.8 + jx * half0
      const cx1 = cx + f * half1 * 1.8 + jx * half1
      // 石板（四边形，边缘抖动，厚薄不一）
      const inset = 4 + rnd() * 7 // 草缝宽度不一
      ctx.fillStyle = ['#ece5d5', '#e7dfcd', '#f0e9da'][Math.floor(rnd() * 3)]
      ctx.beginPath()
      ctx.moveTo(cx0 - w0 / 2 + inset, y0 + inset)
      ctx.lineTo(cx0 + w0 / 2 - inset, y0 + inset)
      ctx.lineTo(cx1 + w0 / 2 * 0.82 - inset, y1 - inset)
      ctx.lineTo(cx1 - w0 / 2 * 0.82 + inset, y1 - inset)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#9a8f7d'
      ctx.lineWidth = 1.8
      ctx.stroke()
      // 石板纹理（短排线）
      ctx.strokeStyle = '#b0a590'
      ctx.lineWidth = 1.1
      const sxc = (cx0 + cx1) / 2
      const syc = (y0 + y1) / 2
      for (let k = 0; k < 3; k++) {
        wobblyLine(ctx, rnd, sxc - w0 * 0.3, syc - 8 + k * 9, sxc + w0 * 0.3, syc - 10 + k * 9, '#b0a590', 1.0, 0.8)
      }
    }
  }

  // 草缝（在石板间冒出的小草笔画）
  for (let i = 0; i < 46; i++) {
    const t = rnd()
    const y = bottomY - t * (bottomY - topY)
    const half = botHalf + (topHalf - botHalf) * t
    const x = cx - half + rnd() * half * 2
    const len = 6 + rnd() * 8
    ctx.strokeStyle = '#8a9a6a'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + (rnd() - 0.5) * 6, y - len, x + (rnd() - 0.5) * 10, y - len * 1.4)
    ctx.stroke()
  }
}

export interface ExteriorTextures {
  building: THREE.CanvasTexture
  tree: THREE.CanvasTexture
  catBody: THREE.CanvasTexture
  window: THREE.CanvasTexture
  windowInterior: THREE.CanvasTexture
  character: THREE.CanvasTexture
  flowerBox: THREE.CanvasTexture
  stonePath: THREE.CanvasTexture
}

let cache: ExteriorTextures | null = null

export function getExteriorTextures(): ExteriorTextures {
  if (cache) return cache

  const building = makeCanvas(1200, 540)
  drawBuilding(building.ctx, mulberry32(20))

  const tree = makeCanvas(600, 900)
  drawTree(tree.ctx, mulberry32(21))

  const cat = makeCanvas(360, 360)
  drawCat(cat.ctx, mulberry32(22))

  const win = makeCanvas(400, 460)
  drawWindow(win.ctx, mulberry32(23))

  const interior = makeCanvas(320, 340)
  drawWindowInterior(interior.ctx, mulberry32(27))

  const chr = makeCanvas(300, 420)
  drawCharacter(chr.ctx, mulberry32(24))

  const box = makeCanvas(520, 380)
  drawFlowerBox(box.ctx, mulberry32(25))

  const stone = makeCanvas(600, 800)
  drawStonePath(stone.ctx, mulberry32(26))

  cache = {
    building: finalize(building.canvas),
    tree: finalize(tree.canvas),
    catBody: finalize(cat.canvas),
    window: finalize(win.canvas),
    windowInterior: finalize(interior.canvas),
    character: finalize(chr.canvas),
    flowerBox: finalize(box.canvas),
    stonePath: finalize(stone.canvas),
  }
  return cache
}

export function disposeExteriorTextures(): void {
  if (!cache) return
  Object.values(cache).forEach((t) => t.dispose())
  cache = null
}
