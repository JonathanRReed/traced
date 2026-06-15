// Animates [data-count] numbers from 0 to their value when scrolled into view.
// The server renders the real value, so no-JS visitors see the final number.
;(function () {
  const els = document.querySelectorAll('[data-count]')
  if (!els.length) return

  // Respect the user's motion preference: leave the server-rendered values alone.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const format = (value, big) => {
    const n = Math.floor(value)
    if (!big) return n.toLocaleString()
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
    return n.toLocaleString()
  }

  // Reset to 0 up front so the final value never flashes before the animation.
  els.forEach((el) => {
    el.textContent = format(0, el.dataset.countFormat === 'big')
  })

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
  let started = false

  const observer = new IntersectionObserver(
    (entries) => {
      if (started || !entries.some((e) => e.isIntersecting)) return
      started = true
      observer.disconnect()

      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - start) / 1800, 1)
        const eased = easeOutCubic(progress)
        els.forEach((el) => {
          const target = Number(el.dataset.count)
          el.textContent = format(target * eased, el.dataset.countFormat === 'big')
        })
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },
    { threshold: 0.1 },
  )

  observer.observe(els[0])
})()
