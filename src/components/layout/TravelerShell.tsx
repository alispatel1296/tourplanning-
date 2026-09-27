import { Suspense, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  Compass,
  LayoutDashboard,
  Map as MapIcon,
  Orbit,
  PanelLeft,
  PanelLeftClose,
  Radio,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/Button'
import { CommandPalette, type CommandItem } from '@/components/ui/CommandPalette'
import { ToastStack } from '@/components/ui/Feedback'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { useInboxUnread } from '@/pages/intelligence/useInboxUnread'
import { cn } from '@/lib/cn'

const nav = [
  { to: '/traveler', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/traveler/explore', label: 'Explore', icon: Compass },
  { to: '/traveler/trips?tab=upcoming', label: 'My Trips', icon: Briefcase },
  { to: '/traveler/plan', label: 'Plan', icon: Sparkles },
  { to: '/traveler/map', label: 'Map', icon: MapIcon },
  { to: '/traveler/live/trip-amd-goa', label: 'Live', icon: Radio },
  { to: '/traveler/twin/trip-amd-goa', label: 'Weather Twin', icon: Orbit },
  { to: '/traveler/predict/trip-amd-goa', label: 'Predict', icon: ShieldAlert },
  { to: '/traveler/profile', label: 'Profile', icon: UserRound },
]

const mobileNav = [
  { to: '/traveler', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/traveler/trips?tab=upcoming', label: 'Trips', icon: Compass },
  { to: '/traveler/plan', label: 'Plan', icon: Sparkles },
  { to: '/traveler/live/trip-amd-goa', label: 'Live', icon: Radio },
  { to: '/traveler/predict/trip-amd-goa', label: 'Predict', icon: ShieldAlert },
]

export function TravelerShell() {
  const { user, toasts, dismissToast, trips } = useAppState()
  const live = usePrimaryTrip()
  const [palette, setPalette] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('tf-sidebar-collapsed') !== '1'
    } catch {
      return true
    }
  })

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      const next = !open
      try {
        localStorage.setItem('tf-sidebar-collapsed', next ? '0' : '1')
      } catch {
        /* ignore */
      }
      return next
    })
  }
  const navigate = useNavigate()
  const unread = useInboxUnread('traveler')
  const showcase = trips.find((item) => item.id === 'trip-amd-goa') ?? live
  const liveTo = showcase?.id ? `/traveler/live/${showcase.id}` : '/traveler/live/trip-amd-goa'
  const twinTo = showcase?.id ? `/traveler/twin/${showcase.id}` : '/traveler/twin/trip-amd-goa'
  const predictTo = showcase?.id ? `/traveler/predict/${showcase.id}` : '/traveler/predict/trip-amd-goa'

  const items = nav.map((item) =>
    item.label === 'Live'
      ? { ...item, to: liveTo }
      : item.label === 'Weather Twin'
        ? { ...item, to: twinTo }
        : item.label === 'Predict'
          ? { ...item, to: predictTo }
          : item,
  )

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
      { id: 'dash', label: 'Traveler home', hint: 'Home', to: '/traveler' },
      { id: 'explore', label: 'Explore destinations', hint: 'Places', to: '/traveler/explore' },
      { id: 'plan', label: 'Plan a trip', hint: 'AI planner', to: '/traveler/plan' },
      { id: 'map', label: 'Trip map', hint: 'Route', to: '/traveler/map' },
      { id: 'trips', label: 'My trips', hint: 'Upcoming', to: '/traveler/trips?tab=upcoming' },
      { id: 'live', label: 'Live trip', hint: 'On the move', to: liveTo },
      { id: 'twin', label: 'Weather Digital Twin', hint: 'What-if', to: twinTo },
      { id: 'predict', label: 'Predictive emergency', hint: 'USP', to: predictTo },
      { id: 'notes', label: 'Notifications', hint: 'Inbox', to: '/traveler/notifications' },
    ],
    [liveTo, twinTo, predictTo],
  )

  const links = (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div
      className="min-h-screen bg-[var(--color-warm-ivory)] lg:flex"
      data-sidebar-collapsed={sidebarOpen ? 'false' : 'true'}
    >
      <ScrollToTop />

      {sidebarOpen ? (
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <div className="flex items-start justify-between gap-2">
          <Brand />
          <IconButton label="Hide sidebar" onClick={toggleSidebar}>
            <PanelLeftClose className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">{links}</div>
        <button type="button" onClick={() => navigate('/traveler/profile')} className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
          <Avatar initials={user?.avatarInitials ?? 'AS'} name={user?.name} className="h-9 w-9 bg-[var(--color-ocean)] text-white" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{user?.name ?? 'Traveler'}</span>
            <span className="block truncate text-[12px] text-slate-500">{user?.email}</span>
          </span>
        </button>
      </aside>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            {!sidebarOpen ? (
              <IconButton label="Show sidebar" className="hidden lg:inline-flex" onClick={toggleSidebar}>
                <PanelLeft className="h-4 w-4" />
              </IconButton>
            ) : null}
            <div className="lg:hidden">
              <Brand compact />
            </div>
            <p className="hidden text-sm font-medium text-slate-500 lg:block">TripFlow traveler workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Notifications" onClick={() => navigate('/traveler/notifications')}>
              <span className="relative">
                <Bell className="h-5 w-5" />
                {unread ? <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--color-muted-gold)]" /> : null}
              </span>
            </IconButton>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:px-8 lg:pb-16">
          <Suspense
            fallback={
              <div className="flex h-32 items-center justify-center">
                <p className="animate-pulse text-sm font-medium text-[var(--color-warm-brown)]">Loading journey...</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 px-1 py-3 backdrop-blur lg:hidden">
        {mobileNav.map((item) => {
          const to = item.label === 'Live' ? liveTo : item.label === 'Predict' ? predictTo : item.to
          return (
            <NavLink
              key={item.label}
              to={to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 text-[11px] font-medium',
                  isActive ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-warm-brown)]',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} items={commands} trips={trips} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
