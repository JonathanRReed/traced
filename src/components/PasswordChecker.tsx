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
  const [hash, setHash] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addLog(line: string) {
    setLogs((prev) => [...prev, line])
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return

    setState('hashing')
    setLogs([])
    setCount(null)
    setHash('')

    await new Promise((r) => setTimeout(r, 200))
    addLog('> initializing sha-1 digest...')

    await new Promise((r) => setTimeout(r, 300))
    addLog('> encoding input...')

    await new Promise((r) => setTimeout(r, 300))
    const fullHash = await sha1(password)
    setHash(fullHash)
    addLog(`> sha-1: ${fullHash.toLowerCase()}`)

    await new Promise((r) => setTimeout(r, 400))
    const prefix = fullHash.slice(0, 5)
    const suffix = fullHash.slice(5)
    addLog(`> transmitting prefix: ${prefix.toLowerCase()}...`)
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
    setHash('')
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
              className="checker-input"
              disabled={isChecking}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={isChecking || !password.trim()}
              className="checker-btn"
            >
              {isChecking ? 'CHECKING...' : 'CHECK'}
            </button>
          </div>
          <p className="checker-privacy">
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
          >
            <div className="terminal-header">
              <span className="terminal-dot" style={{ background: '#ef4444' }} />
              <span className="terminal-dot" style={{ background: '#f59e0b' }} />
              <span className="terminal-dot" style={{ background: '#22c55e' }} />
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
          >
            <div className="result-main">
              {count > 0 ? (
                <>
                  <span className="result-icon result-icon-danger">⚠</span>
                  <div className="result-content">
                    <span className="result-headline result-headline-danger">
                      COMPROMISED
                    </span>
                    <span className="result-sub">
                      Seen <strong>{count.toLocaleString()}</strong> times in known data breaches
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
                      No matches found in known breach databases
                    </span>
                  </div>
                </>
              )}
            </div>

            {count > 0 && (
              <div className="result-advice">
                <p>This password has appeared in known data breaches. If you use it anywhere, change it immediately. Do not use it for any new accounts.</p>
              </div>
            )}

            {count > 0 && passwordBreaches.length > 0 && (
              <div className="result-cases">
                <div className="result-cases-header">
                  <span className="result-cases-label">BREACHES CONTAINING PASSWORD DATA</span>
                  <span className="result-cases-sub">These are the largest incidents where passwords were exposed — explore case files</span>
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

            {hash && (
              <div className="result-hash">
                <span className="result-hash-label">SHA-1 HASH</span>
                <span className="result-hash-value">{hash.toLowerCase()}</span>
              </div>
            )}

            <button onClick={handleReset} className="result-reset">
              CHECK ANOTHER
            </button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            className="checker-result result-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="result-headline result-headline-danger">REQUEST FAILED</span>
            <p className="result-sub">Could not reach the Pwned Passwords API. Check your connection and try again.</p>
            <button onClick={handleReset} className="result-reset">TRY AGAIN</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .checker-root {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 640px;
          margin: 0 auto;
        }
        .checker-form {}
        .checker-input-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .checker-input-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: var(--color-muted);
        }
        .checker-input-row {
          display: flex;
          gap: 0;
        }
        .checker-input {
          flex: 1;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-right: none;
          border-radius: 2px 0 0 2px;
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 1rem;
          letter-spacing: 0.15em;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.15s;
        }
        .checker-input:focus { border-color: var(--color-accent); }
        .checker-input:disabled { opacity: 0.5; }
        .checker-btn {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          font-weight: 600;
          background: var(--color-accent);
          color: #fff;
          border: 1px solid var(--color-accent);
          border-radius: 0 2px 2px 0;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .checker-btn:hover:not(:disabled) { background: #2563eb; }
        .checker-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .checker-privacy {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-muted);
          margin: 0;
          letter-spacing: 0.05em;
          line-height: 1.6;
        }
        .checker-terminal {
          background: #0a0e13;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
        .terminal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          opacity: 0.6;
        }
        .terminal-title {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          margin-left: 4px;
        }
        .terminal-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 80px;
        }
        .terminal-line {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: #a3e635;
          letter-spacing: 0.05em;
          line-height: 1.5;
        }
        .terminal-cursor {
          display: inline-block;
          color: #a3e635;
          animation: blink 1s step-end infinite;
          font-family: var(--font-mono);
        }
        .checker-result {
          border: 1px solid;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-radius: 2px;
        }
        .result-danger { border-color: #ef444440; background: #ef444408; }
        .result-safe   { border-color: #22c55e40; background: #22c55e08; }
        .result-error  { border-color: var(--color-border); background: var(--color-surface); }
        .result-main {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .result-icon {
          font-size: 2rem;
          line-height: 1;
          flex-shrink: 0;
        }
        .result-icon-danger { color: #ef4444; }
        .result-icon-safe   { color: #22c55e; }
        .result-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .result-headline {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.8rem;
          letter-spacing: 0.1em;
          line-height: 1;
        }
        .result-headline-danger { color: #ef4444; }
        .result-headline-safe   { color: #22c55e; }
        .result-sub {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--color-text);
          opacity: 0.8;
          letter-spacing: 0.04em;
        }
        .result-advice {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--color-muted);
          line-height: 1.7;
          padding: 0.75rem;
          border: 1px solid #ef444430;
          background: #ef44440a;
          border-radius: 2px;
        }
        .result-advice p { margin: 0; }
        .result-hash {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .result-hash-label {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          color: var(--color-muted);
        }
        .result-hash-value {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--color-muted);
          word-break: break-all;
          opacity: 0.6;
        }
        .result-reset {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-muted);
          padding: 8px 16px;
          transition: all 0.15s;
          align-self: flex-start;
          border-radius: 2px;
        }
        .result-reset:hover { border-color: var(--color-accent); color: var(--color-text); }
        .result-cases {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid #ef444425;
          padding: 1rem;
          background: #ef44440a;
          border-radius: 2px;
        }
        .result-cases-header {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .result-cases-label {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.25em;
          color: var(--color-muted);
        }
        .result-cases-sub {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-muted);
          opacity: 0.6;
        }
        .result-cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
        }
        .case-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          background: var(--color-surface);
          text-decoration: none;
          transition: background 0.15s;
        }
        .case-link:hover { background: var(--color-surface-2); }
        .case-link-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--color-text);
          letter-spacing: 0.04em;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .case-link-meta {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--color-muted);
          letter-spacing: 0.06em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .case-link-arrow {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-accent);
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .case-link:hover .case-link-arrow { opacity: 1; }
      `}</style>
    </div>
  )
}
