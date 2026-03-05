import { useState, useEffect, useRef } from 'react'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!?'
const FRAMES_PER_CHAR = 2

export function useScramble(target: string, active: boolean): string {
  const [display, setDisplay] = useState(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    if (!active) {
      setDisplay(target)
      return
    }

    let resolved = 0
    let frameCount = 0
    const total = target.length

    function tick() {
      frameCount++
      if (frameCount % FRAMES_PER_CHAR === 0) resolved = Math.min(resolved + 1, total)

      const out = target
        .split('')
        .map((char, i) => {
          if (i < resolved) return char
          if (char === ' ' || char === '-' || char === '.') return char
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        })
        .join('')

      setDisplay(out)
      if (resolved < total) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [active, target])

  return display
}
