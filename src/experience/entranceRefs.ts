import type { Group } from 'three'

/**
 * 门场景引用注册表：外景双门 + 走廊侧门。
 *
 * 各门组件挂载时把 group 写入此单例；CameraRig（唯一相机写入者）
 * 在转场时间线中读取并协调门与镜头。这是纯引用容器，不是状态机。
 */
export const entranceRefs: {
  leftDoor: Group | null
  rightDoor: Group | null
  sideDoor: Group | null
} = {
  leftDoor: null,
  rightDoor: null,
  sideDoor: null,
}
