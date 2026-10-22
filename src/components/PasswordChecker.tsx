import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/starwind-react/button'
import { Input } from '@/components/starwind-react/input'

type CheckState = 'idle' | 'checking' | 'done' | 'error'

interface PasswordBreach {
  name: string
  title: string
  pwnCount: number
  breachDate: string
}

interface Props {
  passwordBreaches?: PasswordBreach[]
}

const STEPS = [
  'Hash the password in this browser with SHA-1',
  'Send only the first 5 characters of the hash',
  'Receive every hash that starts with those 5 characters',
  'Look for your full hash in that list, on this device',
]

async function sha1(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function findCount(rangeResponse: string, suffix: string): number {
  for (const line of rangeResponse.split('\n')) {
    const [candidate, count] = line.trim().split(':')
    if (candidate?.toUpperCase() === suffix) return parseInt(count ?? '0', 10)
  }
  return 0
}

function CountUp({ to }: { to: number }) {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(reduceMotion ? to : 0)

  useEffect(() => {
    if (reduceMotion) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1200, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, reduceMotion])

  return <>{value.toLocaleString('en-US')}</>
}

export function PasswordChecker({ passwordBreaches = [] }: Props) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<CheckState>('idle')
  const [step, setStep] = useState(0)
  const [prefix, setPrefix] = useState('')
  const [candidates, setCandidates] = useState<number | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    setState('checking')
    setStep(1)
    setCount(null)
    setCandidates(null)

    try {
      const fullHash = await sha1(password)
      setPassword('')
      setShowPassword(false)

      const hashPrefix = fullHash.slice(0, 5)
      setPrefix(hashPrefix)
      setStep(2)

      const res = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
        headers: { 'Add-Padding': 'true' },
      })
      if (!res.ok) throw new Error(`Pwned Passwords answered with status ${res.status}.`)

      const text = await res.text()
      setCandidates(text.split('\n').length)
      setStep(3)

      const found = findCount(text, fullHash.slice(5))
      setStep(4)
      setCount(found)
      setState('done')
      requestAnimationFrame(() => resultRef.current?.focus())
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'The request failed.')
      setState('error')
    }
  }

  function handleReset() {
    setState('idle')
    setStep(0)
    setCount(null)
    setPassword('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isChecking = state === 'checking'

  return (
    <section className="checker-root" aria-label="Password exposure checker">
      <form onSubmit={handleCheck} className="checker-form">
        <label htmlFor="pwd-input" className="checker-label">
          Password to check
        </label>
        <div className="checker-input-row">
          <Input
            id="pwd-input"
            ref={inputRef}
            type={showPassword ? 'text' : 'password'}
            size="lg"
            value={password}
            onValueChange={setPassword}
            placeholder="Type a password"
            disabled={isChecking}
            aria-describedby="pwd-privacy"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide' : 'Show'}
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={isChecking || !password}>
            {isChecking ? 'Checking' : 'Check'}
          </Button>
        </div>
        <p className="checker-privacy muted" id="pwd-privacy">
          Your password stays in this browser. Only the first 5 characters of its SHA-1 hash are sent, so Pwned
          Passwords never sees the password or its full hash.
        </p>
      </form>

      {state !== 'idle' && prefix && (
        <div className="hash-strip" aria-hidden="true">
          <div className="hash-chars data">
            <span className="hash-sent">{prefix}</span>
            <span className="hash-kept">{'•'.repeat(35)}</span>
          </div>
          <p className="hash-legend">
            <span>Sent to Pwned Passwords</span>
            <span>Never leaves this device</span>
          </p>
        </div>
      )}

      {state !== 'idle' && (
        <ol className="checker-steps" aria-label="What happens to your password">
          {STEPS.map((label, i) => {
            const status = step > i + 1 || (state === 'done' && step > i) ? 'done' : step === i + 1 ? 'active' : 'waiting'
            return (
              <li key={label} data-status={status}>
                <span className="step-mark" aria-hidden="true" />
                <span>
                  {label}
                  {i === 1 && prefix && <span className="data step-detail"> ({prefix})</span>}
                  {i === 2 && candidates !== null && (
                    <span className="step-detail"> ({candidates.toLocaleString('en-US')} hashes)</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {state === 'done' && count !== null && (
        <motion.div
          ref={resultRef}
          tabIndex={-1}
          className="checker-result"
          data-outcome={count > 0 ? 'found' : 'clear'}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
          aria-live="polite"
        >
          <span className="result-stamp" aria-hidden="true">
            {count > 0 ? 'Exposed' : 'Clear'}
          </span>
          <div className="result-main">
            {count > 0 ? (
              <svg className="result-icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
                <path d="M24 5 3 42h42z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                <path d="M24 19v11M24 35v1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="result-icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="check-draw" d="M14 25l7 7 14-15" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
              </svg>
            )}
            <div>
              <h2 className="result-headline">
                {count > 0 ? 'Found in breach data' : 'Not found'}
              </h2>
              <p className="result-sub">
                {count > 0 ? (
                  <>
                    This password appears <strong className="data"><CountUp to={count} /></strong> times in the Pwned
                    Passwords dataset.
                  </>
                ) : (
                  'This password is not in the Pwned Passwords dataset.'
                )}
              </p>
            </div>
          </div>

          <p className="result-advice">
            {count > 0
              ? 'If you still use it anywhere, change it now. If you reused it on other accounts, change those too.'
              : "Good, but it doesn't make the password safe. It only means the password hasn't turned up in a public dump. Keep one unique password per account and turn on two-factor authentication."}
          </p>

          {count > 0 && passwordBreaches.length > 0 && (
            <div className="result-cases">
              <h3>Large breaches that included passwords</h3>
              <ul className="result-cases-grid">
                {passwordBreaches.map((b) => (
                  <li key={b.name}>
                    <a href={`/case/${b.name}/`} className="case-link">
                      <span className="case-link-title">{b.title}</span>
                      <span className="case-link-meta data">
                        {new Date(b.breachDate).getFullYear()},{' '}
                        {b.pwnCount >= 1_000_000 ? (b.pwnCount / 1_000_000).toFixed(0) + 'M' : b.pwnCount.toLocaleString('en-US')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="outline" onClick={handleReset}>
            Check another password
          </Button>
        </motion.div>
      )}

      {state === 'error' && (
        <div className="notice" role="alert">
          <h2>The check did not finish</h2>
          <p>
            {errorMessage} Your password never left this browser. Check your connection and try again.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Try again
          </Button>
        </div>
      )}
    </section>
  )
}
