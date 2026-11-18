import { useRef, useState } from 'react'
import { Button } from '@/components/starwind-react/button'
import { Input } from '@/components/starwind-react/input'
import { formatCompact } from '../lib/utils'

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
  'Your browser hashes the password with SHA-1',
  'It sends only the first 5 characters of that hash',
  'Pwned Passwords returns every hash that starts with them',
  'Your browser looks for the full hash in that list',
]

const HASH_LENGTH = 40
const PREFIX_LENGTH = 5

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

  async function handleCheck(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!password) return

    setState('checking')
    setStep(1)
    setPrefix('')
    setCount(null)
    setCandidates(null)

    try {
      const fullHash = await sha1(password)
      setPassword('')
      setShowPassword(false)

      const hashPrefix = fullHash.slice(0, PREFIX_LENGTH)
      setPrefix(hashPrefix)
      setStep(2)

      const res = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
        headers: { 'Add-Padding': 'true' },
      })
      if (!res.ok) throw new Error(`Pwned Passwords answered with status ${res.status}.`)

      const text = await res.text()
      setCandidates(text.split('\n').length)
      setStep(3)

      const found = findCount(text, fullHash.slice(PREFIX_LENGTH))
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
    setPrefix('')
    setCandidates(null)
    setCount(null)
    setPassword('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isChecking = state === 'checking'
  const found = count !== null && count > 0

  return (
    <section className="checker" aria-label="Password exposure checker">
      <div className="checker-main">
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
              autoCapitalize="off"
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
              {isChecking ? 'Checking' : 'Check password'}
            </Button>
          </div>
          <p className="checker-privacy muted" id="pwd-privacy">
            Only the first 5 characters of its SHA-1 hash leave this browser.{' '}
            <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">
              How that works<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </form>

        {state === 'done' && count !== null && (
          <div className="checker-after">
            <p>
              {found
                ? 'Stop using this password. Change it everywhere it still protects an account, starting with email and banking.'
                : "That is good news, but it doesn't make the password safe. It only means the password hasn't turned up in a public dump. Keep one unique password per account and turn on two-factor authentication."}
            </p>

            {found && passwordBreaches.length > 0 && (
              <div className="result-cases">
                <h3>The largest breaches that leaked passwords</h3>
                <ul className="mini-rows">
                  {passwordBreaches.map((b) => (
                    <li key={b.name}>
                      <a href={`/case/${b.name}/`}>
                        <span className="mini-title">{b.title}</span>
                        <span>{b.breachDate.slice(0, 4)}</span>
                        <span>{formatCompact(b.pwnCount)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="outline" onClick={handleReset}>
              Check another password
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="notice" role="alert">
            <h2>The check did not finish</h2>
            <p>{errorMessage} Your password never left this browser. Check your connection and try again.</p>
            <Button variant="outline" onClick={handleReset}>
              Try again
            </Button>
          </div>
        )}
      </div>

      <div className="slip">
        <div>
          <h2 className="slip-heading">What happens to your password</h2>
          <ol className="checker-steps">
            {STEPS.map((label, i) => {
              const status =
                step > i + 1 || (state === 'done' && step > i) ? 'done' : step === i + 1 ? 'active' : 'waiting'
              return (
                <li key={label} data-status={status}>
                  <span>
                    {label}
                    {i === 1 && prefix && (
                      <span className="step-detail">
                        <span className="hash-sent">{prefix}</span>
                        <span className="hash-kept" aria-hidden="true">
                          {'·'.repeat(HASH_LENGTH - PREFIX_LENGTH)}
                        </span>
                        <span className="sr-only">, the other 35 characters stay here</span>
                      </span>
                    )}
                    {i === 2 && candidates !== null && (
                      <span className="step-detail">{candidates.toLocaleString('en-US')} hashes returned</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {state === 'done' && count !== null && (
          <>
            <hr />
            <div
              ref={resultRef}
              tabIndex={-1}
              className="slip-verdict"
              data-outcome={found ? 'found' : 'clear'}
              aria-live="polite"
            >
              <h2>{found ? 'Found in breach data' : 'Not found'}</h2>
              {found ? (
                <>
                  <span className="figure">{count.toLocaleString('en-US')}</span>
                  <span>{count === 1 ? 'time' : 'times'} in the Pwned Passwords dataset</span>
                </>
              ) : (
                <span>This password is not in the Pwned Passwords dataset.</span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
