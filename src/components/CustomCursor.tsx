import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let isHover = false
    let isClick = false
    let animFrame: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = `${mouseX}px`
      dot.style.top = `${mouseY}px`

      const el = e.target as Element
      const hover =
        el.closest('a, button, [role="button"], input, select, label') !== null

      if (hover !== isHover) {
        isHover = hover
        dot.style.background = hover ? 'var(--color-danger)' : 'var(--color-accent)'
        dot.style.width = hover ? '5px' : '4px'
        dot.style.height = hover ? '5px' : '4px'
        ring.style.width = hover ? '28px' : '20px'
        ring.style.height = hover ? '28px' : '20px'
        ring.style.borderColor = hover ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.45)'
        ring.style.mixBlendMode = hover ? 'normal' : 'normal'
      }
    }

    const onDown = () => {
      isClick = true
      ring.style.width = '12px'
      ring.style.height = '12px'
      ring.style.opacity = '0.9'
    }

    const onUp = () => {
      isClick = false
      ring.style.width = isHover ? '28px' : '20px'
      ring.style.height = isHover ? '28px' : '20px'
      ring.style.opacity = '1'
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.1
      ringY += (mouseY - ringY) * 0.1
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      animFrame = requestAnimationFrame(animate)
    }

    animFrame = requestAnimationFrame(animate)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(animFrame)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 4,
          height: 4,
          background: '#3b82f6',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          transition: 'background 0.12s, width 0.12s, height 0.12s',
          left: -100,
          top: -100,
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: 20,
          height: 20,
          border: '1px solid rgba(59,130,246,0.45)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.15s, opacity 0.15s',
          left: -100,
          top: -100,
        }}
      />
    </>
  )
}
