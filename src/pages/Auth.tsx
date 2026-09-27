import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { AuthVisual } from '@/pages/auth/AuthVisual'
import { LoginPanel } from '@/pages/auth/LoginPanel'
import {
  confirmPasswordError,
  destFor,
  emailError,
  findAccount,
  nameError,
  passwordError,
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
  const roleHint = params.get('role') ?? params.get('demo')
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
          <LoginForm onEnter={enter} roleHint={roleHint} />
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
  roleHint,
}: {
  onEnter: (role: AuthRole, profile?: { name?: string; email?: string }) => void
  roleHint: string | null
}) {
  const intent = roleHint === 'operator' || roleHint === 'traveler' ? roleHint : null
  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="mt-8 lg:mt-0">
        <p className="font-display text-[13px] font-bold tracking-[0.2em] uppercase text-[var(--color-muted-gold)]">TripFlow AI</p>
        <h1 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[var(--color-charcoal)]">Welcome back</h1>
      </div>
      <div className="mt-6">
        <LoginPanel onEnter={onEnter} intent={intent} />
      </div>
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


