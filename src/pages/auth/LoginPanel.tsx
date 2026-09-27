import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Eye, EyeOff, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DEMO_ACCOUNTS,
  emailError,
  findAccount,
  passwordError,
  rememberEmail,
  rememberedEmail,
  type AuthRole,
} from '@/lib/auth'
import { cn } from '@/lib/cn'

export function LoginPanel({
  onEnter,
  intent,
  compact,
}: {
  onEnter: (role: AuthRole, profile?: { name?: string; email?: string }) => void
  intent?: AuthRole | null
  compact?: boolean
}) {
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(rememberedEmail()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

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
    <div className={cn('w-full', compact ? '' : 'max-w-md')}>
      <p className="text-sm text-slate-600">
        {intent === 'operator'
          ? 'Sign in to open the operator desk, or continue as Operator below.'
          : intent === 'traveler'
            ? 'Sign in to plan a journey, or continue as User below.'
            : 'Sign in to your traveler or operator workspace.'}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => {
          const isUser = account.role === 'traveler'
          return (
            <button
              key={account.email}
              type="button"
              onClick={() => onEnter(account.role, { name: account.name, email: account.email })}
              className={cn(
                'rounded-xl border px-3 py-3 text-left transition-colors',
                isUser
                  ? 'border-brand-200 bg-brand-50 hover:border-brand-400'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-400',
              )}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                Continue as {isUser ? 'User' : 'Operator'}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-charcoal)]">{account.name}</p>
              <p className="text-[12px] text-slate-500">{account.email}</p>
            </button>
          )
        })}
      </div>

      <div className="my-5 flex items-center gap-3 text-[12px] font-medium tracking-[0.12em] text-[var(--color-warm-brown)]">
        <span className="h-px flex-1 bg-[var(--color-soft-sand)]" />
        OR SIGN IN
        <span className="h-px flex-1 bg-[var(--color-soft-sand)]" />
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
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
        </div>
        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-[var(--color-ocean)] hover:text-[var(--color-charcoal)]">
          Create one
        </Link>
      </p>
    </div>
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
            onClick={() => setShow((open) => !open)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-1 block text-[12px] text-rose-600">{error}</span> : null}
    </label>
  )
}
