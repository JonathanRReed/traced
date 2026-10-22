import { useEffect, useState } from 'react'
import {
  Dropdown,
  DropdownContent,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/starwind-react/dropdown'

type Theme = 'system' | 'light' | 'dark'
type Font = 'default' | 'readable' | 'dyslexic'

const THEME_KEY = 'colorTheme'
const FONT_KEY = 'traced-font'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const FONTS: { value: Font; label: string; family: string }[] = [
  { value: 'default', label: 'TRACED', family: "'Barlow Condensed', sans-serif" },
  { value: 'readable', label: 'Readable', family: "'Atkinson Hyperlegible Next', sans-serif" },
  { value: 'dyslexic', label: 'OpenDyslexic', family: "'OpenDyslexic', sans-serif" },
]

function read<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be blocked. The choice still applies until the next page load.
  }
  ;(window as unknown as { __applyAppearance?: () => void }).__applyAppearance?.()
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> }
}

function switchTheme(value: string) {
  const doc = document as ViewTransitionDocument
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const trigger = document.querySelector('.appearance-trigger')
  if (!doc.startViewTransition || reduceMotion || !trigger) {
    save(THEME_KEY, value)
    return
  }

  const box = trigger.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  document.documentElement.classList.add('theme-vt')
  const transition = doc.startViewTransition(() => save(THEME_KEY, value))
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
  transition.finished.finally(() => document.documentElement.classList.remove('theme-vt'))
}

export function AppearanceMenu() {
  const [theme, setTheme] = useState<Theme>('system')
  const [font, setFont] = useState<Font>('default')

  useEffect(() => {
    setTheme(read<Theme>(THEME_KEY, 'system'))
    setFont(read<Font>(FONT_KEY, 'default'))
  }, [])

  return (
    <Dropdown>
      <DropdownTrigger className="appearance-trigger" aria-label="Appearance: theme and font">
        <span aria-hidden="true">Aa</span>
      </DropdownTrigger>
      <DropdownContent align="end" className="appearance-menu">
        <DropdownLabel>Theme</DropdownLabel>
        <DropdownRadioGroup
          value={theme}
          onValueChange={(value) => {
            setTheme(value as Theme)
            switchTheme(value)
          }}
        >
          {THEMES.map((t) => (
            <DropdownRadioItem key={t.value} value={t.value}>
              {t.label}
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
        <DropdownSeparator />
        <DropdownLabel>Font</DropdownLabel>
        <DropdownRadioGroup
          value={font}
          onValueChange={(value) => {
            setFont(value as Font)
            save(FONT_KEY, value)
          }}
        >
          {FONTS.map((f) => (
            <DropdownRadioItem key={f.value} value={f.value} style={{ fontFamily: f.family }}>
              {f.label}
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
      </DropdownContent>
    </Dropdown>
  )
}
