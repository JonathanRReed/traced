// Site-wide behaviour that every page needs but none should pay for up front.

type PaletteModule = typeof import('../components/mount-palette')

let palette: Promise<PaletteModule> | null = null

// React and the search palette are only downloaded once someone reaches for
// search, so pages that are pure reading (case files, about, privacy) ship no
// framework code at all.
function loadPalette(): Promise<PaletteModule> {
  if (import.meta.env.DEV) {
    // Pages without an island never receive the dev server's React preamble,
    // and the React plugin refuses to run without one. These stubs stand in
    // for it. They only exist in development; the build drops this branch.
    const dev = window as unknown as Record<string, unknown>
    dev.$RefreshReg$ ??= () => {}
    dev.$RefreshSig$ ??= () => (type: unknown) => type
    dev.__vite_plugin_react_preamble_installed__ = true
  }
  palette ??= import('../components/mount-palette')
  return palette
}

function openPalette() {
  const container = document.getElementById('palette-root')
  if (!container) return
  if (container.dataset.mounted) {
    window.dispatchEvent(new CustomEvent('palette:toggle'))
    return
  }
  container.dataset.mounted = 'true'
  void loadPalette().then((module) => module.mountPalette(container))
}

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openPalette()
  }
})

window.addEventListener('open-command-palette', openPalette)

// Start the download as soon as the pointer or focus reaches the search
// button, so the palette is usually ready by the time it is pressed.
for (const type of ['pointerover', 'focusin'] as const) {
  document.addEventListener(type, (event) => {
    if ((event.target as Element | null)?.closest?.('.nav-search')) void loadPalette()
  })
}

// Opening a breach from a list morphs its name into the case page's title.
// Only the row that was clicked is named, at the moment it is clicked: naming
// every row would make the browser snapshot each one on every navigation.
document.addEventListener(
  'click',
  (event) => {
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a.row-link')
    const slug = link?.getAttribute('href')?.match(/^\/case\/([^/]+)\/$/)?.[1]
    const title = link?.querySelector<HTMLElement>('.row-title')
    if (slug && title) title.style.viewTransitionName = `case-${slug}`
  },
  { capture: true },
)
