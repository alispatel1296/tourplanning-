import { Suspense, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Menu,
  Radio,
  Search as SearchIcon,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  BarChart3,
  TriangleAlert,
  Orbit,
} from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/Button'
import { CommandPalette, type CommandItem } from '@/components/ui/CommandPalette'
import { Drawer } from '@/components/ui/Overlay'
import { ToastStack } from '@/components/ui/Feedback'
import { Search } from '@/components/ui/Search'
import { useAppState } from '@/state/AppState'
import { useInboxUnread } from '@/pages/intelligence/useInboxUnread'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/operator', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/operator/tours', label: 'Tours', icon: Briefcase },
  { to: '/operator/customers', label: 'Customers', icon: Users },
  { to: '/operator/vendors', label: 'Vendors', icon: Building2 },
  { to: '/operator/coordinators', label: 'Coordinators', icon: UsersRound },
  { to: '/operator/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/operator/groups', label: 'Group Tours', icon: Radio },
  { to: '/operator/conflicts', label: 'Conflicts', icon: TriangleAlert },
  { to: '/operator/twin', label: 'Weather Twin', icon: Orbit },
  { to: '/operator/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/operator/notifications', label: 'Notifications', icon: Bell },
  { to: '/operator/settings', label: 'Settings', icon: Settings },
]

export function OperatorShell() {
  const { user, toasts, dismissToast } = useAppState()
  const [query, setQuery] = useState('')
  const [palette, setPalette] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const navigate = useNavigate()
  const unread = useInboxUnread('operator')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commands: CommandItem[] = useMemo(
    () => [
      ...nav.map((item) => ({ id: item.to, label: item.label, hint: 'Operator', to: item.to })),
      { id: 'integrations', label: 'Integrations health', hint: 'APIs', to: '/operator/settings/integrations' },
    ],
    [],
  )

  const links = (
    <nav className="space-y-1">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileNav(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              isActive ? 'bg-white/10 text-[var(--color-muted-gold)]' : 'text-white/60 hover:bg-white/5 hover:text-white',
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[var(--color-warm-ivory)] text-[var(--color-charcoal)]">
      <ScrollToTop />
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[var(--color-charcoal)] px-4 py-5 lg:flex lg:flex-col shadow-xl">
        <Brand tone="dark" />
        <p className="mt-8 mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted-gold)]">Operations</p>
        {links}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--color-soft-sand)] bg-[var(--color-warm-ivory)]/95 backdrop-blur-md px-4">
          <IconButton label="Menu" className="lg:hidden" onClick={() => setMobileNav(true)}>
            <Menu className="h-4 w-4" />
          </IconButton>
          <Search
            value={query}
            onChange={setQuery}
            onFocus={() => setPalette(true)}
            placeholder="Global search — tours, pax, vendors"
            className="hidden max-w-xl flex-1 md:flex"
          />
          <IconButton label="Search" className="md:hidden" onClick={() => setPalette(true)}>
            <SearchIcon className="h-4 w-4" />
          </IconButton>
          <IconButton label="Alerts" onClick={() => navigate('/operator/notifications')}>
            <span className="relative">
              <Bell className="h-4 w-4" />
              {unread ? <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" /> : null}
            </span>
          </IconButton>
          <IconButton label="AI Assistant" onClick={() => setAssistant(true)}>
            <Sparkles className="h-4 w-4 text-[var(--color-muted-gold)]" />
          </IconButton>
          <button type="button" onClick={() => navigate('/operator/settings')}>
            <Avatar initials={user?.avatarInitials ?? 'MK'} name={user?.name} />
          </button>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Suspense fallback={<div className="flex h-32 items-center justify-center"><p className="text-sm font-medium text-slate-400 animate-pulse">Loading...</p></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Drawer open={mobileNav} onClose={() => setMobileNav(false)} title="Operator" side="left">
        <div className="rounded-2xl bg-[var(--color-charcoal)] p-3">{links}</div>
      </Drawer>
      <CommandPalette open={palette} onClose={() => setPalette(false)} items={commands} />
      <Drawer open={assistant} onClose={() => setAssistant(false)} title="AI Assistant">
        <p className="text-sm text-slate-600">
          Horizon Trails currently has one high-risk stay conflict and a moderate swell advisory. I can re-accommodate
          Aarav Shah at Caravela Varca without breaking the Baga activity hold.
        </p>
        <button
type="button"           className="mt-4 text-sm font-medium text-brand-700"
          onClick={() => {
            setAssistant(false)
            navigate('/operator/conflicts')
          }}
        >
          Open conflicts desk
        </button>
      </Drawer>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
