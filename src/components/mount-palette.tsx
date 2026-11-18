import { createRoot } from 'react-dom/client'
import { CommandPalette } from './CommandPalette'

/** Mounts the search palette, already open, the first time it is asked for. */
export function mountPalette(container: HTMLElement) {
  createRoot(container).render(<CommandPalette />)
}
