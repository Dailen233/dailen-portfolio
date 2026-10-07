import { createContext, useContext } from 'react'

/**
 * 位置（location）：镜头最终停靠、内容得以展示的位置。
 * 转场目标（target）：正在前往的位置；target 非空即处于转场中（transitioning）。
 * 内容可见性 = 仅在非转场时，按 location 展示对应内容。
 */
export type Location = 'exterior' | 'corridor' | 'room'

export interface ExperienceValue {
  /** 已停靠位置（内容据此展示） */
  location: Location
  /** 转场目标（null 表示不在转场） */
  target: Location | null
  /** 是否转场中（target !== null） */
  transitioning: boolean
  /** 外景 → 走廊 */
  enterCorridor: () => void
  /** 走廊 → 作品集房间 */
  enterRoom: () => void
  /** 房间 → 走廊 */
  exitToCorridor: () => void
  /** 走廊 → 外景 */
  exitToExterior: () => void
  /** 转场完成回调：把 target 落定为 location 并清除转场 */
  settle: () => void
  /** 重置到外景（用于简洁模式切回 3D 时，避免镜头与位置错位） */
  reset: () => void
  /** 当前选中的项目 id（仅在房间内有效，用于展示详情） */
  selectedId: string | null
  /** 选中项目（点击真实项目画框 / 键盘等价入口） */
  selectProject: (id: string) => void
  /** 关闭项目详情，恢复画廊浏览 */
  closeProject: () => void
}

export const ExperienceContext = createContext<ExperienceValue | null>(null)

export function useExperience(): ExperienceValue {
  const value = useContext(ExperienceContext)
  if (!value) {
    throw new Error('useExperience 必须在 ExperienceProvider 内使用')
  }
  return value
}
