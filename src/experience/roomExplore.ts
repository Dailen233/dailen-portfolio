import { CAMERA_ROOM, CAMERA_ROOM_NARROW } from './sceneConfig'

/**
 * 房间探索：输入 → 探索目标值（yaw/pitch），由 CameraRig 统一执行相机。
 * 这里只有纯计算与共享 ref，不是状态机，也不触发 React 重渲染。
 */

// 输入参数
export const TAP_THRESHOLD = 8 // px，超过视为拖动（抑制画框点击）
export const DRAG_K = 0.002 // 水平拖动 → yaw 增量（每 px）
export const PITCH_K = 0.003 // 垂直拖动 → pitch 增量（每 px）
export const WHEEL_K = 0.01 // 滚轮 → yaw 速度（每 deltaY）
export const DAMPING = 4.5 // 惯性阻尼（1/s）

export interface ExplorePose {
  pos: [number, number, number]
  target: [number, number, number]
}

// 桌面端点：yaw=-1 看右墙真实项目画框，yaw=+1 看后墙画框
const LEFT_DESKTOP: ExplorePose = { pos: [1.95, 1.6, -3.9], target: [5.45, 1.55, -5.2] }
const RIGHT_DESKTOP: ExplorePose = { pos: [3.45, 1.6, -4.6], target: [3.6, 1.5, -7.2] }
// 窄屏端点（初始更靠近项目画框）
const LEFT_NARROW: ExplorePose = { pos: [2.9, 1.72, -4.9], target: [5.45, 1.5, -6.6] }
const RIGHT_NARROW: ExplorePose = { pos: [3.35, 1.72, -5.25], target: [3.6, 1.5, -7.2] }

function lerp3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/**
 * 由探索量 (yaw, pitch) 计算相机姿态。yaw/pitch ∈ [-1, 1]。
 * yaw=0 即默认视角（桌面 CAMERA_ROOM / 窄屏 CAMERA_ROOM_NARROW）。
 * 相机位置始终位于房间安全带内（x 1.95..3.45、z -5.25..-3.9、y 0.9..2.3），不穿墙、不贴墙。
 */
export function computeExplorePose(yaw: number, pitch: number, narrow: boolean): ExplorePose {
  const home: ExplorePose = narrow
    ? { pos: [...CAMERA_ROOM_NARROW.pos] as [number, number, number], target: [...CAMERA_ROOM_NARROW.target] as [number, number, number] }
    : { pos: [...CAMERA_ROOM.pos] as [number, number, number], target: [...CAMERA_ROOM.target] as [number, number, number] }
  const left = narrow ? LEFT_NARROW : LEFT_DESKTOP
  const right = narrow ? RIGHT_NARROW : RIGHT_DESKTOP

  let pos: [number, number, number]
  let tgt: [number, number, number]
  if (yaw <= 0) {
    const t = -yaw
    pos = lerp3(home.pos, left.pos, t)
    tgt = lerp3(home.target, left.target, t)
  } else {
    const t = yaw
    pos = lerp3(home.pos, right.pos, t)
    tgt = lerp3(home.target, right.target, t)
  }
  // 俯仰：抬高/降低相机与目标高度
  pos = [pos[0], pos[1] + pitch * 0.7, pos[2]]
  tgt = [tgt[0], tgt[1] + pitch * 0.6, tgt[2]]
  return { pos, target: tgt }
}

/** 输入状态跨组件共享（CameraRig 写、Gallery 读），纯引用容器 */
export const exploreRefs = {
  /** 本次按下是否已构成拖动（用于抑制画框点击） */
  suppressClick: false,
}
