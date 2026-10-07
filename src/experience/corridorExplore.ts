import { CAMERA_CORRIDOR, CAMERA_CORRIDOR_NARROW } from './sceneConfig'

/**
 * 走廊滚动导航：输入 → 探索目标值（corridorT ∈ [0,1]），由 CameraRig 统一执行相机。
 * 纯计算 + 常量，不是状态机，不触发 React 重渲染。
 *
 * 单位约定：corridorT 为归一化进度 [0,1]，对应世界 Z 从 NEAR_Z 到 FAR_Z；
 * 速度 corridorTVel 单位为「t / 秒」。像素增量经 K 换算为 t 后，再参与积分。
 */

// 走廊前后边界（世界 Z 坐标，负方向为走廊深处）
export const CORRIDOR_NEAR_Z = -0.2 // 近边界：门口内 0.2m，不穿门/退到建筑外
export const CORRIDOR_FAR_Z = -23.0 // 远边界：封底墙前 3m，保留地板/墙可见
export const CORRIDOR_BACK_Z = -26.0 // 走廊尽头封底墙（与地板/墙收口一致）

// 输入换算（像素 → t）
export const CORRIDOR_WHEEL_K = 0.0015 // 滚轮速度：每 deltaY 像素 → t/s（一格≈0.8m）
export const CORRIDOR_SWIPE_K = 0.00035 // 滑动位移：每 px → t（满屏≈7m，小步≈1m）
export const CORRIDOR_MAX_VEL = 0.15 // 最大移动速度（t/s ≈ 3.6 m/s），限制连续输入不掠过快
export const CORRIDOR_DAMPING = 4.5 // 惯性阻尼（1/s），停手后平滑停下
export const CORRIDOR_WHEEL_CLAMP = 300 // 限制单次滚轮输入（像素）

export interface CorridorPose {
  pos: [number, number, number]
  target: [number, number, number]
}

const zToT = (z: number) => (z - CORRIDOR_NEAR_Z) / (CORRIDOR_FAR_Z - CORRIDOR_NEAR_Z)

/** 初始 corridorT：对应进入走廊后的默认视角（桌面 / 窄屏） */
export function initialCorridorT(narrow: boolean): number {
  const z = (narrow ? CAMERA_CORRIDOR_NARROW : CAMERA_CORRIDOR).pos[2]
  return zToT(z)
}

/** 归一化滚轮增量（处理 deltaMode 与单次过大输入） */
export function normalizeWheelDelta(e: WheelEvent, viewportHeight: number): number {
  let d = e.deltaY
  if (e.deltaMode === 1) d *= 16
  else if (e.deltaMode === 2) d *= viewportHeight
  return Math.max(-CORRIDOR_WHEEL_CLAMP, Math.min(CORRIDOR_WHEEL_CLAMP, d))
}

/** 把速度钳制到 [-MAX, MAX]，避免单次输入/连续输入超速 */
export function clampCorridorVel(v: number): number {
  return Math.max(-CORRIDOR_MAX_VEL, Math.min(CORRIDOR_MAX_VEL, v))
}

/** 把进度钳制到 [0, 1]，越界时清除向外的残余速度 */
export function clampCorridorT(t: number, vel: number): { t: number; vel: number } {
  if (t < 0) return { t: 0, vel: vel < 0 ? 0 : vel }
  if (t > 1) return { t: 1, vel: vel > 0 ? 0 : vel }
  return { t, vel }
}

/**
 * 由走廊位置 t ∈ [0,1] 计算相机姿态。相机沿走廊中线前进，向前看（带轻微右偏以露出侧门）。
 * 目标 Z 被钳制在封底墙之前，避免相机越过墙面后看向场景外。
 */
export function computeCorridorPose(t: number, narrow: boolean): CorridorPose {
  const tz = Math.max(0, Math.min(1, t))
  const z = CORRIDOR_NEAR_Z + (CORRIDOR_FAR_Z - CORRIDOR_NEAR_Z) * tz
  if (narrow) {
    const lookZ = Math.max(z - 10.7, CORRIDOR_BACK_Z + 0.3)
    return { pos: [0, 1.75, z], target: [0.4, 1.35, lookZ] }
  }
  const lookZ = Math.max(z - 15.5, CORRIDOR_BACK_Z + 0.3)
  return { pos: [0, 1.55, z], target: [0, 1.28, lookZ] }
}
