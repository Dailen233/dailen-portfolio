import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface IntroProps {
  /** 外景已渲染好第一帧（真实准备信号，非倒计时） */
  sceneReady: boolean
  reduced: boolean
  onDone: () => void
  onSkip: () => void
}

/**
 * 首次加载入场：浅纸面覆盖 → 墨线逐笔勾出 Dailen → 场景就绪后纸面沿锯齿边缘揭开。
 * 播放一次；由 sceneReady（第一帧）+ 绘制完成共同触发揭开，不做固定倒计时。
 */
export default function Intro({ sceneReady, reduced, onDone, onSkip }: IntroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const underlineRef = useRef<SVGPathElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const [drawn, setDrawn] = useState(false)
  const peeledRef = useRef(false)

  // 墨线绘制「Dailen」（一次）
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(wordRef.current, { autoAlpha: 1 })
        gsap.set(underlineRef.current, { strokeDashoffset: 0 })
        setDrawn(true)
      } else {
        const tl = gsap.timeline({ onComplete: () => setDrawn(true) })
        tl.fromTo(
          wordRef.current,
          { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' },
          { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' },
        )
        tl.fromTo(
          underlineRef.current,
          { strokeDashoffset: 420 },
          { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' },
          0.5,
        )
      }
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  // 揭开（就绪 + 绘制完成）
  useEffect(() => {
    if (!sceneReady || !drawn || peeledRef.current) return
    peeledRef.current = true
    if (statusRef.current) statusRef.current.textContent = '准备好了'

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: onDone })
      if (reduced) {
        tl.set(rootRef.current, { autoAlpha: 0 })
      } else {
        tl.to(statusRef.current, { autoAlpha: 0, duration: 0.2 })
        tl.to(wordRef.current, { autoAlpha: 0, y: -12, duration: 0.25, ease: 'power2.in' }, 0.05)
        tl.to(leftRef.current, { xPercent: -104, rotation: -1.6, duration: 0.7, ease: 'power3.in' }, 0.25)
        tl.to(rightRef.current, { xPercent: 104, rotation: 1.6, duration: 0.7, ease: 'power3.in' }, 0.25)
        tl.to(rootRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.55)
      }
    }, rootRef)
    return () => ctx.revert()
  }, [sceneReady, drawn, reduced, onDone])

  return (
    <div className="intro" ref={rootRef} role="status" aria-label="正在加载">
      <div className="intro-paper">
        <div className="intro-half intro-half-left" ref={leftRef} />
        <div className="intro-half intro-half-right" ref={rightRef} />
      </div>

      <div className="intro-center">
        <div className="intro-word" ref={wordRef}>
          Dailen
        </div>
        <svg
          className="intro-underline"
          viewBox="0 0 320 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={underlineRef}
            d="M10 24 Q80 8 160 20 T310 16"
            fill="none"
            stroke="#2e2a24"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="420"
            strokeDashoffset="420"
          />
        </svg>
        <p className="intro-status" ref={statusRef}>
          准备中…
        </p>
      </div>

      <button type="button" className="intro-skip" onClick={onSkip}>
        进入简洁模式 →
      </button>
    </div>
  )
}
