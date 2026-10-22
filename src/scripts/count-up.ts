const DURATION_MS = 1600

function format(value: number, compact: boolean): string {
  const n = Math.floor(value)
  if (!compact) return n.toLocaleString('en-US')
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  return n.toLocaleString('en-US')
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function init() {
  const targets = document.querySelectorAll<HTMLElement>('[data-count]')
  if (!targets.length) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  targets.forEach((el) => {
    el.textContent = format(0, el.dataset.countFormat === 'big')
  })

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()

      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / DURATION_MS, 1)
        const eased = easeOutCubic(progress)
        targets.forEach((el) => {
          el.textContent = format(Number(el.dataset.count) * eased, el.dataset.countFormat === 'big')
        })
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },
    { threshold: 0.1 },
  )
  observer.observe(targets[0])
}

document.addEventListener('astro:page-load', init)
