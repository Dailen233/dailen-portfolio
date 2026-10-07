// 场景布局常量：世界单位为米，Z 轴负方向为走廊深处，外景门立面位于 Z=0。
export const FLOOR_Y = 0
export const CORRIDOR_HEIGHT = 3.4
export const CORRIDOR_HALF = 1.7
export const CORRIDOR_LENGTH = 26

// 外景建筑立面（含屋顶檐口）
export const BRICK_WALL_WIDTH = 12
export const BRICK_WALL_HEIGHT = 4.6
export const BUILDING_WIDTH = 12
export const BUILDING_HEIGHT = 5.4

// 外景双门
export const DOOR_WIDTH = 1.4
export const DOOR_HEIGHT = 2.4
export const DOOR_GAP = 0.02
export const OPENING_HALF = DOOR_WIDTH + DOOR_GAP / 2
export const DOOR_OPEN_ANGLE = 1.55
export const DOOR_HOVER_ANGLE = 0.08

// 走廊内「作品集」侧门（位于右墙 x=+CORRIDOR_HALF，沿 Z 方向开门）
export const SIDE_DOOR_WIDTH = 1.2
export const SIDE_DOOR_HEIGHT = 2.2
export const SIDE_DOOR_Z = -5.5
export const SIDE_DOOR_OPEN_ANGLE = 1.3
export const SIDE_DOOR_HOVER_ANGLE = 0.07

// 作品集房间（走廊右侧的独立空间，中心对齐侧门 Z）
export const ROOM_X0 = CORRIDOR_HALF // 1.7（与走廊右墙共享）
export const ROOM_X1 = 5.6
export const ROOM_Z0 = -3.7
export const ROOM_Z1 = -7.3

// 镜头关键姿态
export const CAMERA_EXTERIOR = {
  pos: [0, 1.62, 10] as const,
  target: [0, 1.35, 0] as const,
}
export const CAMERA_CORRIDOR = {
  pos: [0, 1.55, -2.5] as const,
  target: [0, 1.28, -18] as const,
}
// 窄屏外景：拉近对准门与门牌，干净裁掉两侧树/窗等装饰
export const CAMERA_EXTERIOR_NARROW = {
  pos: [0, 1.7, 6] as const,
  target: [0, 1.6, 0] as const,
}
// 侧门前逼近点：退到走廊左半侧（距门约 2.9 米），转向门洞，让门 + 门套完整入画
export const CAMERA_SIDE_APPROACH = {
  pos: [-1.2, 1.5, SIDE_DOOR_Z] as const,
  target: [CORRIDOR_HALF, 1.4, SIDE_DOOR_Z] as const,
}
// 穿越点：沿门洞中线（z=SIDE_DOOR_Z）穿过右墙洞口，进入房间
export const CAMERA_SIDE_THROUGH = {
  pos: [2.6, 1.55, SIDE_DOOR_Z] as const,
  target: [5.4, 1.4, SIDE_DOOR_Z] as const,
}
// 房间浏览视角：前左看向右后墙角，同时呈现右墙、后墙与地板上的画框
export const CAMERA_ROOM = {
  pos: [2.4, 1.6, -4.15] as const,
  target: [4.9, 1.5, -6.4] as const,
}
// 聚焦真实项目画框（右墙主画）时的轻微镜头调整
export const CAMERA_ROOM_FOCUS = {
  pos: [3.2, 1.65, -4.5] as const,
  target: [5.5, 1.7, -5.15] as const,
}
// 窄屏（竖屏）房间视角：正面看向真实项目画框，使其成为可识别、可点击的主体
export const CAMERA_ROOM_NARROW = {
  pos: [3.1, 1.72, -5.15] as const,
  target: [5.45, 1.62, -5.15] as const,
}
// 窄屏（竖屏）走廊视角：退到门口附近拉宽视野，略偏右对准侧门，兼顾左墙 Dailen 字样
export const CAMERA_CORRIDOR_NARROW = {
  pos: [0, 1.75, -0.3] as const,
  target: [0.4, 1.35, -11] as const,
}

// 雾（远处才逐渐淡入，避免洗白内部）
export const FOG_COLOR = '#f7f2ea'
export const FOG_NEAR = 12
export const FOG_FAR = 30

// ---------------------------------------------------------------------------
// 画廊画框布局（世界坐标）
// ---------------------------------------------------------------------------
export type GalleryArtKey = 'bookPage' | 'bookStack' | 'code' | 'architecture' | 'abstract'

export interface GalleryFrameSpec {
  id: string
  /** 所在墙：right = 右墙（x=ROOM_X1，面向 -x）；back = 后墙（z=ROOM_Z1，面向 +z） */
  wall: 'right' | 'back'
  /** 画框中心的世界坐标 */
  pos: [number, number, number]
  /** [宽度, 高度]（米） */
  size: [number, number]
  /** 轻微倾斜（弧度，绕墙面法线） */
  tilt: number
  kind: 'project' | 'decorative'
  art: GalleryArtKey
  /** 仅 kind=project 需要 */
  projectId?: string
}

export const GALLERY_FRAMES: GalleryFrameSpec[] = [
  // 右墙（主展示墙）：真实项目横幅 + 两幅装饰
  {
    id: 'frame-project',
    wall: 'right',
    pos: [ROOM_X1 - 0.04, 1.72, -5.15],
    size: [1.5, 1.0],
    tilt: 0.012,
    kind: 'project',
    art: 'bookPage',
    projectId: 'bilingual-ebook',
  },
  {
    id: 'frame-books',
    wall: 'right',
    pos: [ROOM_X1 - 0.04, 1.42, -6.55],
    size: [0.72, 1.0],
    tilt: -0.03,
    kind: 'decorative',
    art: 'bookStack',
  },
  {
    id: 'frame-code',
    wall: 'right',
    pos: [ROOM_X1 - 0.04, 2.62, -6.35],
    size: [0.62, 0.42],
    tilt: 0.04,
    kind: 'decorative',
    art: 'code',
  },
  // 后墙：两幅装饰
  {
    id: 'frame-arch',
    wall: 'back',
    pos: [3.25, 1.78, ROOM_Z1 + 0.04],
    size: [1.1, 0.78],
    tilt: 0.02,
    kind: 'decorative',
    art: 'architecture',
  },
  {
    id: 'frame-abstract',
    wall: 'back',
    pos: [4.95, 1.4, ROOM_Z1 + 0.04],
    size: [0.52, 0.76],
    tilt: -0.025,
    kind: 'decorative',
    art: 'abstract',
  },
]
