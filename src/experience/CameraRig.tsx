import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useExperience } from '../state/experience'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { entranceRefs } from './entranceRefs'
import {
  CAMERA_EXTERIOR,
  CAMERA_EXTERIOR_NARROW,
  CAMERA_SIDE_APPROACH,
  CAMERA_SIDE_THROUGH,
  CAMERA_ROOM,
  CAMERA_ROOM_FOCUS,
  CAMERA_ROOM_NARROW,
  DOOR_OPEN_ANGLE,
  SIDE_DOOR_OPEN_ANGLE,
} from './sceneConfig'
import {
  computeExplorePose,
  exploreRefs,
  TAP_THRESHOLD,
  DRAG_K,
  PITCH_K,
  WHEEL_K,
  DAMPING,
} from './roomExplore'
import {
  computeCorridorPose,
  initialCorridorT,
  normalizeWheelDelta,
  clampCorridorVel,
  clampCorridorT,
  CORRIDOR_WHEEL_K,
  CORRIDOR_SWIPE_K,
  CORRIDOR_DAMPING,
} from './corridorExplore'

type Vec3 = { x: number; y: number; z: number }

const toVec3 = (v: readonly [number, number, number]): Vec3 => ({ x: v[0], y: v[1], z: v[2] })

/**
 * 唯一相机写入者 + 转场导演 + 房间探索控制器。
 * - 位置转场：一条 GSAP 时间线「先开门 → 再镜头」，完成后 settle() 落定位置。
 * - 稳定取景：按 (location, selectedId, 窄屏) 决定目标姿态；房间内无选中时交给探索（yaw/pitch）。
 * - 房间探索：输入只更新 refs 里的探索目标值，本组件逐帧用阻尼/惯性平滑执行相机。
 * - 响应式：窄屏拉高 FOV 并改用窄屏取景。
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const { location, target, settle, selectedId } = useExperience()
  const reduced = usePrefersReducedMotion()

  const pos = useRef<Vec3>(toVec3(CAMERA_EXTERIOR.pos))
  const tgt = useRef<Vec3>(toVec3(CAMERA_EXTERIOR.target))
  const narrowRef = useRef(false)

  // 探索状态（refs，逐帧更新，不触发 React 重渲染）
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const yawVelRef = useRef(0)
  const pitchVelRef = useRef(0)
  const draggingRef = useRef(false)
  const explorePausedRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const lastXRef = useRef(0)
  const lastYRef = useRef(0)
  const lastMoveTimeRef = useRef(0)
  const movedRef = useRef(0)

  // 走廊导航状态（沿走廊深处的前进/后退位置）
  const corridorTRef = useRef(initialCorridorT(false))
  const corridorTVelRef = useRef(0)

  const narrow = size.width / size.height < 0.75
  const exploring = location === 'room' && target === null && !selectedId
  const corridorActive = location === 'corridor' && target === null

  // ---- 位置转场（门 + 镜头，一条时间线） ----
  useEffect(() => {
    if (!target) return
    const from = location
    const dur = (v: number) => (reduced ? 0.01 : v)
    const tl = gsap.timeline({ onComplete: settle })
    // 走廊目标：从当前实际探索位置（进入房间前记录的 corridorT）平滑回到安全返回路径
    const corridorShot = computeCorridorPose(corridorTRef.current, narrowRef.current)
    const roomShot = narrowRef.current ? CAMERA_ROOM_NARROW : CAMERA_ROOM
    const exteriorShot = narrowRef.current ? CAMERA_EXTERIOR_NARROW : CAMERA_EXTERIOR

    const openDouble = (at: number) => {
      const ld = entranceRefs.leftDoor
      const rd = entranceRefs.rightDoor
      if (ld) tl.to(ld.rotation, { y: -DOOR_OPEN_ANGLE, duration: dur(0.9), ease: 'power2.out', overwrite: 'auto' }, at)
      if (rd) tl.to(rd.rotation, { y: DOOR_OPEN_ANGLE, duration: dur(0.9), ease: 'power2.out', overwrite: 'auto' }, at)
    }
    const closeDouble = (at: number) => {
      const ld = entranceRefs.leftDoor
      const rd = entranceRefs.rightDoor
      if (ld) tl.to(ld.rotation, { y: 0, duration: dur(0.9), ease: 'power2.in', overwrite: 'auto' }, at)
      if (rd) tl.to(rd.rotation, { y: 0, duration: dur(0.9), ease: 'power2.in', overwrite: 'auto' }, at)
    }
    const openSide = (at: number) => {
      const sd = entranceRefs.sideDoor
      if (sd) tl.to(sd.rotation, { y: SIDE_DOOR_OPEN_ANGLE, duration: dur(0.7), ease: 'power2.out', overwrite: 'auto' }, at)
    }
    const closeSide = (at: number) => {
      const sd = entranceRefs.sideDoor
      if (sd) tl.to(sd.rotation, { y: 0, duration: dur(0.7), ease: 'power2.in', overwrite: 'auto' }, at)
    }
    const cam = (shot: { pos: readonly [number, number, number]; target: readonly [number, number, number] }, d: number, at: number) => {
      tl.to(pos.current, { ...toVec3(shot.pos), duration: dur(d), ease: 'power2.inOut' }, at)
      tl.to(tgt.current, { ...toVec3(shot.target), duration: dur(d), ease: 'power2.inOut' }, at)
    }

    if (from === 'exterior' && target === 'corridor') {
      openDouble(0)
      cam(corridorShot, 1.6, 0.9)
    } else if (from === 'corridor' && target === 'room') {
      openSide(0)
      cam(CAMERA_SIDE_APPROACH, 0.8, 0.7)
      cam(CAMERA_SIDE_THROUGH, 0.6, 1.5)
      cam(roomShot, 0.7, 2.1)
    } else if (from === 'room' && target === 'corridor') {
      cam(CAMERA_SIDE_THROUGH, 0.7, 0)
      cam(CAMERA_SIDE_APPROACH, 0.6, 0.7)
      cam(corridorShot, 0.8, 1.3)
      closeSide(1.6)
    } else if (from === 'corridor' && target === 'exterior') {
      cam(exteriorShot, 1.4, 0)
      closeDouble(0.5)
    }

    return () => {
      tl.kill()
    }
  }, [target, location, settle, reduced])

  // ---- 稳定取景（聚焦 / 关闭恢复 / 窄屏校正 / 进入房间） ----
  useEffect(() => {
    if (target !== null) return
    const d = reduced ? 0.01 : 0.8
    let shot: { pos: readonly [number, number, number]; target: readonly [number, number, number] } | null = null
    let resumeExplore = false

    if (location === 'exterior') shot = narrow ? CAMERA_EXTERIOR_NARROW : CAMERA_EXTERIOR
    else if (location === 'corridor') {
      // 进入走廊 / 窄屏校正 / 房间返回：回到当前走廊位置
      explorePausedRef.current = true
      shot = computeCorridorPose(corridorTRef.current, narrow)
      resumeExplore = true
    } else if (location === 'room') {
      explorePausedRef.current = true
      if (selectedId) {
        // 聚焦到选中画框，探索暂停（详情期间不响应探索输入）
        shot = CAMERA_ROOM_FOCUS
      } else {
        // 进入房间 / 关闭详情 / 窄屏校正：回到当前探索姿态
        shot = computeExplorePose(yawRef.current, pitchRef.current, narrow)
        resumeExplore = true
      }
    }

    if (!shot) return
    const tl = gsap.timeline({
      onComplete: () => {
        if (resumeExplore) explorePausedRef.current = false
      },
    })
    tl.to(pos.current, { ...toVec3(shot.pos), duration: d, ease: 'power2.inOut', overwrite: 'auto' }, 0)
    tl.to(tgt.current, { ...toVec3(shot.target), duration: d, ease: 'power2.inOut', overwrite: 'auto' }, 0)
    return () => {
      tl.kill()
    }
  }, [location, target, selectedId, narrow, reduced])

  // ---- 输入：滚轮 + 拖动/滑动（只更新探索目标值 refs） ----
  useEffect(() => {
    if (!exploring) return
    const el = gl.domElement
    el.style.touchAction = 'none'

    const onWheel = (e: WheelEvent) => {
      if (explorePausedRef.current || draggingRef.current) return
      e.preventDefault()
      yawVelRef.current += e.deltaY * WHEEL_K
    }

    const onPointerDown = (e: PointerEvent) => {
      if (explorePausedRef.current || pointerIdRef.current !== null) return
      pointerIdRef.current = e.pointerId
      draggingRef.current = true
      lastXRef.current = e.clientX
      lastYRef.current = e.clientY
      lastMoveTimeRef.current = performance.now()
      movedRef.current = 0
      exploreRefs.suppressClick = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId || !draggingRef.current) return
      const now = performance.now()
      const dtMove = Math.max((now - lastMoveTimeRef.current) / 1000, 1 / 240)
      lastMoveTimeRef.current = now
      const dx = e.clientX - lastXRef.current
      const dy = e.clientY - lastYRef.current
      lastXRef.current = e.clientX
      lastYRef.current = e.clientY
      movedRef.current += Math.abs(dx) + Math.abs(dy)
      if (movedRef.current > TAP_THRESHOLD) exploreRefs.suppressClick = true
      // 拖动直接更新（抓取感），并记录速度供释放后的惯性
      yawRef.current = Math.max(-1, Math.min(1, yawRef.current + dx * DRAG_K))
      pitchRef.current = Math.max(-1, Math.min(1, pitchRef.current - dy * PITCH_K))
      yawVelRef.current = (dx * DRAG_K) / dtMove
      pitchVelRef.current = (-dy * PITCH_K) / dtMove
    }

    const onPointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return
      pointerIdRef.current = null
      draggingRef.current = false
    }
    const onPointerEnd = () => {
      pointerIdRef.current = null
      draggingRef.current = false
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerEnd)
    el.addEventListener('pointerleave', onPointerEnd)
    window.addEventListener('blur', onPointerEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerEnd)
      el.removeEventListener('pointerleave', onPointerEnd)
      window.removeEventListener('blur', onPointerEnd)
      el.style.touchAction = ''
    }
  }, [exploring, gl, reduced])

  // ---- 输入：走廊滚轮前进/后退 + 滑动（只更新 corridorT refs） ----
  useEffect(() => {
    if (!corridorActive) return
    const el = gl.domElement
    el.style.touchAction = 'none'

    const onWheel = (e: WheelEvent) => {
      if (explorePausedRef.current || draggingRef.current) return
      e.preventDefault()
      const d = normalizeWheelDelta(e, el.clientHeight)
      corridorTVelRef.current = clampCorridorVel(corridorTVelRef.current + d * CORRIDOR_WHEEL_K)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (explorePausedRef.current || pointerIdRef.current !== null) return
      pointerIdRef.current = e.pointerId
      draggingRef.current = true
      lastXRef.current = e.clientX
      lastYRef.current = e.clientY
      lastMoveTimeRef.current = performance.now()
      movedRef.current = 0
      exploreRefs.suppressClick = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId || !draggingRef.current) return
      const now = performance.now()
      const dtMove = Math.max((now - lastMoveTimeRef.current) / 1000, 1 / 240)
      lastMoveTimeRef.current = now
      const dx = e.clientX - lastXRef.current
      const dy = e.clientY - lastYRef.current
      lastXRef.current = e.clientX
      lastYRef.current = e.clientY
      movedRef.current += Math.abs(dx) + Math.abs(dy)
      if (movedRef.current > TAP_THRESHOLD) exploreRefs.suppressClick = true
      // 垂直滑动：向上滑前进（t 增大），向下滑后退；记录速度供释放后的惯性
      const next = clampCorridorT(corridorTRef.current - dy * CORRIDOR_SWIPE_K, 0)
      corridorTRef.current = next.t
      corridorTVelRef.current = clampCorridorVel((-dy * CORRIDOR_SWIPE_K) / dtMove)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return
      pointerIdRef.current = null
      draggingRef.current = false
    }
    const onPointerEnd = () => {
      pointerIdRef.current = null
      draggingRef.current = false
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerEnd)
    el.addEventListener('pointerleave', onPointerEnd)
    window.addEventListener('blur', onPointerEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerEnd)
      el.removeEventListener('pointerleave', onPointerEnd)
      window.removeEventListener('blur', onPointerEnd)
      el.style.touchAction = ''
    }
  }, [corridorActive, gl, reduced])

  // ---- 逐帧：FOV + 房间/走廊探索阻尼/惯性 + 相机应用 ----
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const aspect = state.size.width / state.size.height
    narrowRef.current = aspect < 0.75
    const fov = aspect < 0.75 ? 74 : 58
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    const inRoom = location === 'room' && target === null
    const inCorridor = location === 'corridor' && target === null

    if (inRoom) {
      if (!selectedId && !explorePausedRef.current) {
        if (!draggingRef.current) {
          // 惯性漂移（释放后平滑停下）
          yawRef.current += yawVelRef.current * dt
          pitchRef.current += pitchVelRef.current * dt
          const damp = reduced ? 0 : Math.exp(-DAMPING * dt)
          yawVelRef.current *= damp
          pitchVelRef.current *= damp
          if (yawRef.current < -1) {
            yawRef.current = -1
            yawVelRef.current = 0
          }
          if (yawRef.current > 1) {
            yawRef.current = 1
            yawVelRef.current = 0
          }
          if (pitchRef.current < -1) {
            pitchRef.current = -1
            pitchVelRef.current = 0
          }
          if (pitchRef.current > 1) {
            pitchRef.current = 1
            pitchVelRef.current = 0
          }
        }
        // 应用探索姿态（拖动时 pointermove 已直接更新 yaw/pitch，这里直接取用）
        const pose = computeExplorePose(yawRef.current, pitchRef.current, narrowRef.current)
        pos.current.x = pose.pos[0]
        pos.current.y = pose.pos[1]
        pos.current.z = pose.pos[2]
        tgt.current.x = pose.target[0]
        tgt.current.y = pose.target[1]
        tgt.current.z = pose.target[2]
      }
    } else if (inCorridor) {
      if (!explorePausedRef.current) {
        if (!draggingRef.current) {
          // 走廊惯性漂移
          corridorTRef.current += corridorTVelRef.current * dt
          const damp = reduced ? 0 : Math.exp(-CORRIDOR_DAMPING * dt)
          corridorTVelRef.current *= damp
          // 到边界只清除向外的残余速度，允许立即反向
          const clamped = clampCorridorT(corridorTRef.current, corridorTVelRef.current)
          corridorTRef.current = clamped.t
          corridorTVelRef.current = clamped.vel
        }
        // 应用走廊姿态
        const pose = computeCorridorPose(corridorTRef.current, narrowRef.current)
        pos.current.x = pose.pos[0]
        pos.current.y = pose.pos[1]
        pos.current.z = pose.pos[2]
        tgt.current.x = pose.target[0]
        tgt.current.y = pose.target[1]
        tgt.current.z = pose.target[2]
      }
    } else {
      // 非房间/走廊稳定态：复位房间探索量
      yawRef.current = 0
      pitchRef.current = 0
      yawVelRef.current = 0
      pitchVelRef.current = 0
      if (location === 'exterior' && target === null) {
        // 稳定外景：复位走廊位置（下次进入走廊从默认视角开始）
        corridorTRef.current = initialCorridorT(narrowRef.current)
        corridorTVelRef.current = 0
        explorePausedRef.current = false
      }
    }

    camera.position.set(pos.current.x, pos.current.y, pos.current.z)
    camera.lookAt(tgt.current.x, tgt.current.y, tgt.current.z)
  })

  return null
}
