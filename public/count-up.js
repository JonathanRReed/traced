(function () {
  function formatBig(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M';
    return n.toLocaleString();
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  const duration = 1800;
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  let started = false;
  const observer = new IntersectionObserver((entries) => {
    if (started || !entries.some((entry) => entry.isIntersecting)) return;
    started = true;
    observer.disconnect();

    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const p = easeOut(t);
      els.forEach((el) => {
        const target = Number(el.dataset.count);
        const isBig = el.dataset.countFormat === 'big';
        const val = Math.floor(target * p);
        el.textContent = isBig ? formatBig(val) : val.toLocaleString();
      });
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, { threshold: 0.1 });

  observer.observe(els[0]);
})();
