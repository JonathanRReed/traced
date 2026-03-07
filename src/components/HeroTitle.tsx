import { useState, useEffect } from 'react'
import { useScramble } from '../hooks/useScramble'

export function HeroTitle() {
  const [active, setActive] = useState(false)
  const display = useScramble('TRACED', active)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    setActive(true)
  }, [])

  return <span>{display}</span>
}
