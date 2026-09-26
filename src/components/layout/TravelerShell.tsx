import { Suspense, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Bookmark,
  Compass,
  HelpCircle,
  LayoutDashboard,
  Map,
  Radio,
  Search as SearchIcon,
  UserRound,
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
  { to: '/traveler', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/traveler/plan', label: 'Plan a Trip', icon: Compass },
  { to: '/traveler/trips', label: 'My Trips', icon: Map },
  { to: '/traveler/live/trip-amd-goa', label: 'Live Trip', icon: Radio },
  { to: '/traveler/trips?view=saved', label: 'Saved', icon: Bookmark },
  { to: '/traveler/notifications', label: 'Notifications', icon: Bell },
  { to: '/traveler/profile', label: 'Profile', icon: UserRound },
]

const mobileNav = [
  { to: '/traveler', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/traveler/plan', label: 'Plan', icon: Compass },
  { to: '/traveler/trips', label: 'Trips', icon: Map },
  { to: '/traveler/live/trip-amd-goa', label: 'Live', icon: Radio },
  { to: '/traveler/profile', label: 'Profile', icon: UserRound },
]

export function TravelerShell() {
  const { user, toasts, dismissToast, trips } = useAppState()
  const [query, setQuery] = useState('')
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const unread = useInboxUnread('traveler')

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
      { id: 'dash', label: 'Traveler dashboard', hint: 'Home', to: '/traveler' },
      { id: 'plan', label: 'Plan a trip', hint: 'AI planner', to: '/traveler/plan' },
      { id: 'build', label: 'Build hop by hop', hint: 'From home', to: '/traveler/plan/build' },
      { id: 'itin', label: 'West Coast itinerary', hint: 'Trip', to: '/traveler/itinerary' },
      { id: 'carry', label: 'What to carry', hint: 'Weather kit', to: '/traveler/carry' },
      { id: 'prep', label: 'Trip prep', hint: 'Documents', to: '/traveler/prep' },
      { id: 'checkout', label: 'Booking & checkout', hint: 'Pay', to: '/traveler/checkout' },
      { id: 'trips', label: 'My trips', hint: 'Upcoming', to: '/traveler/trips' },
      { id: 'live', label: 'Live trip', hint: 'Operate', to: '/traveler/live/trip-amd-goa' },
      { id: 'review', label: 'Post-trip review', hint: 'West Coast', to: '/traveler/review/trip-amd-goa' },
      { id: 'review-kutch', label: 'Review Rann of Kutch', hint: 'Completed', to: '/traveler/review/trip-kutch' },
      { id: 'notes', label: 'Notifications', hint: 'Inbox', to: '/traveler/notifications' },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-surface">
      <ScrollToTop />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:flex lg:flex-col">
        <Brand />
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const saved = item.label === 'Saved'
                const trips = item.label === 'My Trips'
                const savedOn = location.search.includes('view=saved')
                const active = saved ? savedOn : trips ? isActive && !savedOn : isActive
                return cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  active ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50',
                )
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-brand-50 p-3">
          <p className="text-[12px] font-semibold text-brand-800">AI concierge</p>
          <p className="mt-1 text-[12px] text-slate-600">Ask TripFlow to re-sequence Goa if the swell warning holds.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <Search
              value={query}
              onChange={setQuery}
              onFocus={() => setPalette(true)}
              placeholder="Search trips, stays, or ask AI"
              className="max-w-md"
            />
          </div>
          <IconButton label="Search" className="md:hidden" onClick={() => setPalette(true)}>
            <SearchIcon className="h-4 w-4" />
          </IconButton>
          <IconButton label="Notifications" onClick={() => navigate('/traveler/notifications')}>
            <span className="relative">
              <Bell className="h-4 w-4" />
              {unread ? <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" /> : null}
            </span>
          </IconButton>
          <IconButton label="Help" onClick={() => setHelp(true)}>
            <HelpCircle className="h-4 w-4" />
          </IconButton>
          <button type="button" onClick={() => navigate('/traveler/profile')} className="ml-1">
            <Avatar initials={user?.avatarInitials ?? 'AS'} name={user?.name} />
          </button>
        </header>
        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <Suspense fallback={<div className="flex h-32 items-center justify-center"><p className="text-sm font-medium text-slate-400 animate-pulse">Loading...</p></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 px-1 py-2 backdrop-blur lg:hidden">
        {mobileNav.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 rounded-lg py-1 text-[11px]',
                isActive ? 'text-brand-700' : 'text-slate-500',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} items={commands} trips={trips} />
      <Drawer open={help} onClose={() => setHelp(false)} title="Help">
        <p className="text-sm text-slate-600">
          TripFlow keeps your itinerary feasible as vendors, weather, and trains change. Use Plan to generate, Live to
          adapt, and Review to close the loop.
        </p>
        <p className="meta mt-4">Press Ctrl/Cmd + K for global search.</p>
      </Drawer>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
