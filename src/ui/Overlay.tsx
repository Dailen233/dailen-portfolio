import { useEffect, useRef } from 'react'
import { useExperience } from '../state/experience'
import { profile } from '../content/profile'
import { projects } from '../content/projects'
import ProjectCard from './ProjectCard'

interface Props {
  simpleMode: boolean
  showFallback: boolean
  can3D: boolean
  onToggleSimple: () => void
}

export default function Overlay({ simpleMode, showFallback, can3D, onToggleSimple }: Props) {
  const {
    location,
    transitioning,
    enterCorridor,
    enterRoom,
    exitToCorridor,
    exitToExterior,
    reset,
    selectedId,
    selectProject,
    closeProject,
  } = useExperience()
  const project = projects[0]

  const entryRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const lastEntryId = useRef<string | null>(null)

  const handleToggleSimple = () => {
    reset()
    onToggleSimple()
  }

  const handleSelect = (id: string) => {
    lastEntryId.current = id
    selectProject(id)
  }

  const handleClose = () => {
    closeProject()
    requestAnimationFrame(() => {
      const id = lastEntryId.current
      if (id) entryRefs.current[id]?.focus()
    })
  }

  // Escape 关闭详情
  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const selectedProject = projects.find((p) => p.id === selectedId)

  return (
    <div className="overlay">
      <nav className="topbar">
        <span className="brand">{profile.name}</span>
        <div className="topbar-actions">
          <a
            className="nav-link"
            href={project?.demoUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            作品 ↗
          </a>
          {can3D && (
            <button type="button" className="nav-btn" onClick={handleToggleSimple}>
              {simpleMode ? '返回 3D' : '简洁模式'}
            </button>
          )}
        </div>
      </nav>

      {!showFallback && !transitioning && (
        <div className="stage">
          {location === 'exterior' && (
            <div className="stage-entry fade-in" key="exterior">
              <div className="stage-entry-bottom">
                <p className="subtitle">{profile.tagline ?? '个人定位待填写'}</p>
                <button type="button" className="btn btn-primary" onClick={enterCorridor}>
                  进入展馆 →
                </button>
              </div>
            </div>
          )}

          {location === 'corridor' && (
            <div className="welcome fade-in" key="corridor">
              <h2 className="welcome-title">你好，我是 {profile.name}</h2>
              <p className="welcome-hint">点击右侧「作品集」门，或使用下方按钮进入作品房间</p>
              <p className="welcome-hint corridor-scroll-hint">滚轮 / 上下滑动浏览走廊</p>
              <div className="welcome-actions">
                <button type="button" className="btn btn-primary" onClick={enterRoom}>
                  进入作品集 →
                </button>
                <button type="button" className="btn" onClick={exitToExterior}>
                  返回入口
                </button>
              </div>
            </div>
          )}

          {location === 'room' && (
            <div className="room-hud fade-in" key="room">
              {selectedProject ? (
                <aside
                  className="detail-panel"
                  role="dialog"
                  aria-modal="false"
                  aria-label={selectedProject.name}
                >
                  <div className="detail-panel-head">
                    <span className="detail-panel-title">作品详情</span>
                    <button type="button" className="detail-close" onClick={handleClose} aria-label="关闭详情">
                      ✕
                    </button>
                  </div>
                  <ProjectCard project={selectedProject} />
                </aside>
              ) : (
                <>
                  <button type="button" className="btn room-back" onClick={exitToCorridor}>
                    ← 返回走廊
                  </button>

                  <div className="gallery-hint">
                    <p className="gallery-hint-text">点击墙上的画框查看作品</p>
                    <div className="gallery-entries">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          ref={(el) => {
                            entryRefs.current[p.id] = el
                          }}
                          className="gallery-entry"
                          onClick={() => handleSelect(p.id)}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
