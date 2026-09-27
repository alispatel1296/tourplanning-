import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { AuthVisual } from '@/pages/auth/AuthVisual'
import {
  confirmPasswordError,
  destFor,
  emailError,
  findAccount,
  nameError,
  passwordError,
  rememberEmail,
  rememberedEmail,
  upsertAccount,
  type AuthRole,
} from '@/lib/auth'
import { useAppState } from '@/state/AppState'
import { cn } from '@/lib/cn'

export function Login() {
  return <AuthPage mode="login" />
}

export function Signup() {
  return <AuthPage mode="signup" />
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn } = useAppState()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextPath = params.get('next')
  const demoHint = params.get('demo')
  const [preparing, setPreparing] = useState(false)

  const enter = (next: AuthRole, profile?: { name?: string; email?: string }) => {
    setPreparing(true)
    signIn(next, profile)
    window.setTimeout(() => navigate(destFor(next, nextPath), { replace: true }), 900)
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-warm-ivory)] text-[var(--color-charcoal)]">
      <AuthVisual />
      <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-8 lg:w-[55%]">
        {preparing ? (
          <PreparingState nextPath={nextPath} />
        ) : mode === 'login' ? (
          <LoginForm onEnter={enter} demoHint={demoHint} />
        ) : (
          <SignupForm onEnter={enter} />
        )}
      </div>
    </div>
  )
}

function PreparingState({ nextPath }: { nextPath: string | null }) {
  const planner = nextPath?.includes('/plan')
  return (
    <div className="w-full max-w-md text-center">
      <Brand />
      <div className="ai-generating mx-auto mt-8 max-w-sm rounded-xl border border-[var(--color-soft-sand)] bg-white px-5 py-6 shadow-sm">
        <Sparkles className="mx-auto h-5 w-5 text-[var(--color-muted-gold)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-charcoal)]">
          {planner ? 'Opening the Ahmedabad → Mumbai → Goa planner...' : 'Preparing your travel workspace...'}
        </p>
        <p className="mt-1 text-[13px] text-slate-600">
          {planner ? 'Dates, budget, and preferences are already on the brief.' : 'Loading itinerary graph, holds, and alerts.'}
        </p>
      </div>
    </div>
  )
}

function LoginForm({
  onEnter,
  demoHint,
}: {
  onEnter: (role: AuthRole, profile?: { name?: string; email?: string }) => void
  demoHint: string | null
}) {
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(rememberedEmail()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [demoOpen, setDemoOpen] = useState(demoHint === 'traveler' || demoHint === 'operator')
  const [googleOpen, setGoogleOpen] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = {
      email: emailError(email) ?? '',
      password: passwordError(password) ?? '',
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      setFormError(null)
      return
    }
    const account = findAccount(email)
    if (!account) {
      setFormError('No account found for that email')
      return
    }
    if (account.password !== password) {
      setFormError('Incorrect password')
      return
    }
    rememberEmail(remember ? account.email : null)
    onEnter(account.role, { name: account.name, email: account.email })
  }

  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="mt-8 lg:mt-0">
        <p className="font-display text-[13px] font-bold tracking-[0.2em] uppercase text-[var(--color-muted-gold)]">TripFlow AI</p>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[var(--color-charcoal)]">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          {demoHint === 'traveler'
            ? 'Choose Traveler to open Aarav Shah’s Ahmedabad → Mumbai → Goa brief.'
            : demoHint === 'operator'
              ? 'Choose Operator to open the Horizon Trails desk.'
              : 'Sign in to your traveler or operator workspace.'}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field
          label="Email"
          type="email"
          value={email}
          error={errors.email}
          onChange={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: '' }))
            setFormError(null)
          }}
        />
        <Field
          label="Password"
          type="password"
          value={password}
          error={errors.password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: '' }))
            setFormError(null)
          }}
        />
        {formError ? <p className="text-[13px] text-rose-600">{formError}</p> : null}
        <div className="flex items-center justify-between text-[13px]">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-soft-sand)] text-[var(--color-ocean)]"
            />
            Remember me
          </label>
          <button type="button" className="font-medium text-[var(--color-ocean)] hover:text-[var(--color-charcoal)]" onClick={() => setForgotOpen(true)}>
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <Divider />
      <Button type="button" variant="secondary" className="w-full" onClick={() => setGoogleOpen(true)}>
        <GoogleMark />
        Continue with Google
      </Button>

      <div className="mt-5">
        <Button type="button" variant="outline" size="sm" onClick={() => setDemoOpen((open) => !open)}>
          Try workspace
        </Button>
        {demoOpen ? <DemoChoices onPick={onEnter} /> : null}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-[var(--color-ocean)] hover:text-[var(--color-charcoal)]">
          Create one
        </Link>
      </p>

      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} />
      <GoogleAccounts open={googleOpen} onClose={() => setGoogleOpen(false)} onPick={onEnter} />
    </div>
  )
}

function SignupForm({ onEnter }: { onEnter: (role: AuthRole, profile?: { name?: string; email?: string }) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<AuthRole>('traveler')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = {
      name: nameError(name) ?? '',
      email: emailError(email) ?? '',
      password: passwordError(password) ?? '',
      confirm: confirmPasswordError(password, confirm) ?? '',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return
    const existing = findAccount(email)
    if (existing && DEMO_BLOCK.has(existing.email)) {
      setErrors((current) => ({ ...current, email: 'That workspace email is reserved. Sign in instead.' }))
      return
    }
    upsertAccount({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    })
    onEnter(role, { name: name.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="mt-8 lg:mt-0">
        <p className="font-display text-[13px] font-bold tracking-[0.2em] uppercase text-[var(--color-muted-gold)]">TripFlow AI</p>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[var(--color-charcoal)]">Create your workspace</h1>
        <p className="mt-1 text-sm text-slate-500">Traveler plans and operator desks use the same account model.</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field
          label="Full Name"
          value={name}
          error={errors.name}
          onChange={(value) => {
            setName(value)
            setErrors((current) => ({ ...current, name: '' }))
          }}
        />
        <Field
          label="Email"
          type="email"
          value={email}
          error={errors.email}
          onChange={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: '' }))
          }}
        />
        <Field
          label="Password"
          type="password"
          value={password}
          error={errors.password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: '' }))
          }}
        />
        <Field
          label="Confirm Password"
          type="password"
          value={confirm}
          error={errors.confirm}
          onChange={(value) => {
            setConfirm(value)
            setErrors((current) => ({ ...current, confirm: '' }))
          }}
        />
        <div>
          <p className="mb-2 text-[12px] font-medium text-slate-500">Role</p>
          <div className="grid grid-cols-2 gap-2">
            <RoleOption
              label="Traveler"
              hint="Plan and adapt trips"
              selected={role === 'traveler'}
              onSelect={() => setRole('traveler')}
            />
            <RoleOption
              label="Tour Operator"
              hint="Run live operations"
              selected={role === 'operator'}
              onSelect={() => setRole('operator')}
            />
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-[var(--color-ocean)] hover:text-[var(--color-charcoal)]">
          Sign in
        </Link>
      </p>
    </div>
  )
}

const DEMO_BLOCK = new Set(['aarav.shah@gmail.com', 'meera@horizontrails.in'])

function DemoChoices({ onPick }: { onPick: (role: AuthRole, profile?: { name?: string; email?: string }) => void }) {
  return (
    <div className="mt-3 grid gap-2">
      <button
        type="button"
        onClick={() => onPick('traveler', { name: 'Aarav Shah', email: 'aarav.shah@gmail.com' })}
        className="rounded-xl border border-[var(--color-soft-sand)] bg-[var(--color-warm-ivory)] px-3 py-3 text-left transition-colors hover:border-[var(--color-muted-gold)] hover:bg-white"
      >
        <p className="text-sm font-semibold">Traveler</p>
        <p className="meta">Aarav Shah · Ahmedabad → Mumbai → Goa</p>
      </button>
      <button
        type="button"
        onClick={() => onPick('operator', { name: 'Meera Kulkarni', email: 'meera@horizontrails.in' })}
        className="rounded-xl border border-[var(--color-soft-sand)] bg-white px-3 py-3 text-left transition-colors hover:border-[var(--color-muted-gold)] hover:bg-[var(--color-warm-ivory)]"
      >
        <p className="text-sm font-semibold">Operator</p>
        <p className="meta">Meera Kulkarni · Horizon Trails desk</p>
      </button>
    </div>
  )
}

function GoogleAccounts({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (role: AuthRole, profile?: { name?: string; email?: string }) => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Continue with Google">
      <p className="text-sm text-slate-600">Choose a workspace identity. No Google request is sent.</p>
      <div className="mt-4 grid gap-2">
        <button
          type="button"
          className="rounded-xl border border-line px-3 py-3 text-left hover:bg-slate-50"
          onClick={() => {
            onClose()
            onPick('traveler', { name: 'Aarav Shah', email: 'aarav.shah@gmail.com' })
          }}
        >
          <p className="text-sm font-semibold">Aarav Shah</p>
          <p className="meta">aarav.shah@gmail.com</p>
        </button>
        <button
          type="button"
          className="rounded-xl border border-line px-3 py-3 text-left hover:bg-slate-50"
          onClick={() => {
            onClose()
            onPick('operator', { name: 'Meera Kulkarni', email: 'meera@horizontrails.in' })
          }}
        >
          <p className="text-sm font-semibold">Meera Kulkarni</p>
          <p className="meta">meera@horizontrails.in</p>
        </button>
      </div>
    </Modal>
  )
}

function ForgotPassword({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <Modal
      open={open}
      onClose={() => {
        setSent(false)
        setError('')
        onClose()
      }}
      title="Forgot password"
    >
      {sent ? (
        <p className="text-sm text-slate-600">
          Reset is simulated for this workspace. Use <span className="font-medium">Try workspace</span>, or sign in with the
          password you created.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">Enter the email on the account. Nothing is sent to a server.</p>
          <div className="mt-4">
            <Field
              label="Email"
              type="email"
              value={email}
              error={error}
              onChange={(value) => {
                setEmail(value)
                setError('')
              }}
            />
          </div>
          <Button
type="button"             className="mt-4"
            onClick={() => {
              const issue = emailError(email)
              if (issue) {
                setError(issue)
                return
              }
              setSent(true)
            }}
          >
            Continue
          </Button>
        </>
      )}
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-11 w-full rounded-lg border bg-white px-3 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-muted-gold)]/30',
            error ? 'border-red-400' : 'border-[var(--color-soft-sand)] focus:border-[var(--color-muted-gold)]',
            isPassword && 'pr-10',
          )}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
            onClick={() => setShow((value) => !value)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-1 block text-[12px] text-rose-600">{error}</span> : null}
    </label>
  )
}

function RoleOption({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string
  hint: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-xl border px-3 py-3 text-left transition-colors',
        selected ? 'border-[var(--color-ocean)] bg-[var(--color-sky)]/30' : 'border-[var(--color-soft-sand)] bg-white hover:bg-[var(--color-warm-ivory)]',
      )}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="meta">{hint}</p>
    </button>
  )
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[12px] font-medium tracking-[0.12em] text-[var(--color-warm-brown)]">
      <span className="h-px flex-1 bg-[var(--color-soft-sand)]" />
      OR
      <span className="h-px flex-1 bg-[var(--color-soft-sand)]" />
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.6h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 16 5.5 18 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6V5.1H.9C.3 6.3 0 7.6 0 9s.3 2.7.9 3.9l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.4l2.5-2.5C13.5.9 11.4 0 9 0 5.5 0 2.4 2 0.9 5.1l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
    </svg>
  )
}

