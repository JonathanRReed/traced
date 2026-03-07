import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CheckState = 'idle' | 'hashing' | 'querying' | 'done' | 'error'

interface PasswordBreach {
  name: string
  title: string
  pwnCount: number
  breachDate: string
}

async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

interface Props {
  passwordBreaches?: PasswordBreach[]
}

export function PasswordChecker({ passwordBreaches = [] }: Props) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState<CheckState>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [count, setCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addLog(line: string) {
    setLogs((prev) => [...prev, line])
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    const candidate = password
    if (!candidate) return

    setState('hashing')
    setLogs([])
    setCount(null)

    await new Promise((r) => setTimeout(r, 200))
    addLog('> preparing local sha-1 digest...')

    await new Promise((r) => setTimeout(r, 300))
    addLog('> hashing on this device...')

    await new Promise((r) => setTimeout(r, 300))
    const fullHash = await sha1(candidate)
    addLog('> hash generated successfully')
    setPassword('')

    await new Promise((r) => setTimeout(r, 400))
    const prefix = fullHash.slice(0, 5)
    const suffix = fullHash.slice(5)
    addLog(`> transmitting first 5 hash characters: ${prefix.toLowerCase()}...`)
    addLog('> querying pwned passwords api (k-anonymity)...')

    setState('querying')

    try {
      await new Promise((r) => setTimeout(r, 200))
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const text = await res.text()
      const lines = text.split('\n')

      addLog(`> received ${lines.length} hash suffixes`)
      addLog('> scanning for match...')

      await new Promise((r) => setTimeout(r, 300))

      let found = 0
      for (const line of lines) {
        const [s, c] = line.trim().split(':')
        if (s?.toUpperCase() === suffix) {
          found = parseInt(c ?? '0', 10)
          break
        }
      }

      setCount(found)
      setState('done')

      if (found > 0) {
        addLog(`> ⚠ match found — seen ${found.toLocaleString()} times`)
      } else {
        addLog('> ✓ no match found in known breaches')
      }
    } catch (err) {
      setState('error')
      addLog(`> error: ${err instanceof Error ? err.message : 'request failed'}`)
    }
  }

  function handleReset() {
    setState('idle')
    setLogs([])
    setCount(null)
    setPassword('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isChecking = state === 'hashing' || state === 'querying'

  return (
    <div className="checker-root">
      <form onSubmit={handleCheck} className="checker-form">
        <div className="checker-input-wrap">
          <label htmlFor="pwd-input" className="checker-input-label">
            ENTER PASSWORD TO CHECK
          </label>
          <div className="checker-input-row">
            <input
              id="pwd-input"
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`checker-input${isChecking ? ' input-checking' : ''}`}
              disabled={isChecking}
              aria-describedby="pwd-privacy"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={isChecking || !password}
              className="checker-btn"
            >
              {isChecking ? 'CHECKING...' : 'CHECK'}
            </button>
          </div>
          <p className="checker-privacy" id="pwd-privacy">
            ◈ Your full password never leaves your device. Only the first 5 characters of its SHA-1 hash are transmitted.
          </p>
        </div>
      </form>

      <AnimatePresence>
        {logs.length > 0 && (
          <motion.div
            className="checker-terminal scanlines"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-amber" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="terminal-title">traced — password check</span>
            </div>
            <div className="terminal-body">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  className="terminal-line"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  {log}
                </motion.div>
              ))}
              {isChecking && (
                <span className="terminal-cursor">_</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state === 'done' && count !== null && (
          <motion.div
            className={`checker-result ${count > 0 ? 'result-danger' : 'result-safe'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            aria-live="polite"
          >
            <div className="result-main">
              {count > 0 ? (
                <>
                  <span className="result-icon result-icon-danger">⚠</span>
                  <div className="result-content">
                    <span className="result-headline result-headline-danger">
                      FOUND IN BREACH DATA
                    </span>
                    <span className="result-sub">
                      This password appears <strong>{count.toLocaleString()}</strong> times in known breach datasets
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="result-icon result-icon-safe">✓</span>
                  <div className="result-content">
                    <span className="result-headline result-headline-safe">
                      NOT FOUND
                    </span>
                    <span className="result-sub">
                      This password was not found in the Pwned Passwords dataset
                    </span>
                  </div>
                </>
              )}
            </div>

            {count > 0 && (
              <div className="result-advice">
                <p>If you still use it anywhere, change it now. If you reused it on other accounts, change those too.</p>
              </div>
            )}

            {count === 0 && (
              <div className="result-advice result-advice-safe-copy">
                <p>Good news, but not a guarantee. The safest move is still a unique password for every account and two-factor authentication where available.</p>
              </div>
            )}

            {count > 0 && passwordBreaches.length > 0 && (
              <div className="result-cases">
                <div className="result-cases-header">
                  <span className="result-cases-label">BREACHES CONTAINING PASSWORD DATA</span>
                  <span className="result-cases-sub">Some of the largest public breaches that included password data</span>
                </div>
                <div className="result-cases-grid">
                  {passwordBreaches.map((b) => (
                    <a key={b.name} href={`/case/${b.name}`} className="case-link">
                      <span className="case-link-title">{b.title}</span>
                      <span className="case-link-meta">
                        {new Date(b.breachDate).getFullYear()} · {b.pwnCount >= 1_000_000 ? (b.pwnCount / 1_000_000).toFixed(0) + 'M' : b.pwnCount.toLocaleString()}
                      </span>
                      <span className="case-link-arrow">→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="result-privacy-note">
              <span className="result-privacy-label">PRIVACY</span>
              <p className="result-privacy-copy">
                Only the first 5 characters of the SHA-1 hash were sent to Pwned Passwords. Your full password never left your device.
              </p>
            </div>

            <button type="button" onClick={handleReset} className="result-reset">
              CHECK ANOTHER
            </button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            className="checker-result result-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
          >
            <span className="result-headline result-headline-danger">REQUEST FAILED</span>
            <p className="result-sub">Could not reach Pwned Passwords. Your full password was never sent. Check your connection and try again.</p>
            <button type="button" onClick={handleReset} className="result-reset">TRY AGAIN</button>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}
