import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ExperienceContext, type Location } from './experience'

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>('exterior')
  const [target, setTarget] = useState<Location | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const targetRef = useRef<Location | null>(null)

  const start = useCallback(
    (from: Location, to: Location) => {
      if (targetRef.current !== null || location !== from) return
      targetRef.current = to
      setTarget(to)
    },
    [location],
  )

  const enterCorridor = useCallback(() => start('exterior', 'corridor'), [start])
  const enterRoom = useCallback(() => start('corridor', 'room'), [start])

  // 离开房间时清除选中，避免再次进入自动弹出旧详情
  const exitToCorridor = useCallback(() => {
    setSelectedId(null)
    start('room', 'corridor')
  }, [start])
  const exitToExterior = useCallback(() => start('corridor', 'exterior'), [start])

  const settle = useCallback(() => {
    const to = targetRef.current
    if (to) {
      setLocation(to)
      if (to !== 'room') setSelectedId(null)
    }
    targetRef.current = null
    setTarget(null)
  }, [])

  const reset = useCallback(() => {
    targetRef.current = null
    setTarget(null)
    setSelectedId(null)
    setLocation('exterior')
  }, [])

  const selectProject = useCallback((id: string) => setSelectedId(id), [])
  const closeProject = useCallback(() => setSelectedId(null), [])

  const value = useMemo(
    () => ({
      location,
      target,
      transitioning: target !== null,
      enterCorridor,
      enterRoom,
      exitToCorridor,
      exitToExterior,
      settle,
      reset,
      selectedId,
      selectProject,
      closeProject,
    }),
    [
      location,
      target,
      enterCorridor,
      enterRoom,
      exitToCorridor,
      exitToExterior,
      settle,
      reset,
      selectedId,
      selectProject,
      closeProject,
    ],
  )

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
}
