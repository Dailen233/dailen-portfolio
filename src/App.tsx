import { Component, useState, type ReactNode } from 'react'
import { ExperienceProvider } from './state/ExperienceProvider'
import Experience from './experience/Experience'
import Overlay from './ui/Overlay'
import FallbackContent from './ui/FallbackContent'
import Intro from './ui/Intro'
import { usePrefersReducedMotion } from './experience/usePrefersReducedMotion'

class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [can3D, setCan3D] = useState(() => detectWebGL())
  const [simpleMode, setSimpleMode] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const reduced = usePrefersReducedMotion()

  const showFallback = !can3D || simpleMode
  const showIntro = can3D && !simpleMode && !introDone

  return (
    <ExperienceProvider>
      <main className="app">
        {!showFallback && (
          <SceneErrorBoundary onError={() => setCan3D(false)}>
            <Experience onReady={() => setSceneReady(true)} />
          </SceneErrorBoundary>
        )}
        {showFallback && <FallbackContent />}
        {showIntro && (
          <Intro
            sceneReady={sceneReady}
            reduced={reduced}
            onDone={() => setIntroDone(true)}
            onSkip={() => setSimpleMode(true)}
          />
        )}
        <Overlay
          simpleMode={simpleMode}
          showFallback={showFallback}
          can3D={can3D}
          onToggleSimple={() => setSimpleMode((v) => !v)}
        />
      </main>
    </ExperienceProvider>
  )
}
