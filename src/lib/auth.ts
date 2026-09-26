import type { Role } from '@/types'

export type AuthRole = Extract<Role, 'traveler' | 'operator'>

export interface StoredAccount {
  name: string
  email: string
  password: string
  role: AuthRole
}

export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    name: 'Aarav Shah',
    email: 'aarav.shah@gmail.com',
    password: 'demo1234',
    role: 'traveler',
  },
  {
    name: 'Meera Kulkarni',
    email: 'meera@horizontrails.in',
    password: 'demo1234',
    role: 'operator',
  },
]

const ACCOUNTS_KEY = 'tf-accounts'
const REMEMBER_KEY = 'tf-remember-email'
const SESSION_KEY = 'tf-session'

export interface AuthSession {
  role: Role
  name: string
  email: string
  avatarInitials: string
}

export function initialsFrom(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function emailError(email: string) {
  const value = email.trim()
  if (!value) return 'Enter your email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email'
  return null
}

export function passwordError(password: string) {
  if (!password) return 'Enter a password'
  if (password.length < 8) return 'Password too short'
  return null
}

export function nameError(name: string) {
  if (!name.trim()) return 'Enter your full name'
  if (name.trim().length < 2) return 'Name is too short'
  return null
}

export function confirmPasswordError(password: string, confirm: string) {
  if (!confirm) return 'Confirm your password'
  if (password !== confirm) return 'Passwords don\'t match'
  return null
}

function readAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as StoredAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getAccounts() {
  const stored = readAccounts()
  const extras = stored.filter(
    (account) => !DEMO_ACCOUNTS.some((demo) => demo.email.toLowerCase() === account.email.toLowerCase()),
  )
  return [...DEMO_ACCOUNTS, ...extras]
}

export function upsertAccount(account: StoredAccount) {
  const next = [
    ...readAccounts().filter((item) => item.email.toLowerCase() !== account.email.toLowerCase()),
    { ...account, email: account.email.trim().toLowerCase() },
  ]
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next))
}

export function findAccount(email: string) {
  return getAccounts().find((account) => account.email.toLowerCase() === email.trim().toLowerCase())
}

export function rememberEmail(email: string | null) {
  if (email) localStorage.setItem(REMEMBER_KEY, email)
  else localStorage.removeItem(REMEMBER_KEY)
}

export function rememberedEmail() {
  return localStorage.getItem(REMEMBER_KEY) ?? ''
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }
  return null
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem('tf-role')
}

export function homeFor(role: Role) {
  if (role === 'operator') return '/operator'
  if (role === 'coordinator') return '/coordinator'
  if (role === 'vendor') return '/vendor'
  return '/traveler'
}

export function destFor(role: Role, next: string | null) {
  if (!next || !next.startsWith('/')) return homeFor(role)
  if (role === 'traveler' && next.startsWith('/traveler')) return next
  if (role === 'operator' && next.startsWith('/operator')) return next
  return homeFor(role)
}
