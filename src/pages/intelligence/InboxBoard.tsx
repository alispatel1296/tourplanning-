import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { AILabel } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { cn } from '@/lib/cn'
import {
  Bell,
  Search,
  CloudRain,
  Sparkles,
  Building2,
  Plane,
  CreditCard,
  UserCheck,
  Compass,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
} from 'lucide-react'
import {
  decideNotice,
  markAllRead,
  markRead,
  noticeCategories,
  noticesFor,
  addSimulatedNotice,
  resetDemoInbox,
  type InboxNotice,
  type NoticeCategory,
} from '@/pages/intelligence/catalog'
import { AiActivityPanel } from '@/pages/intelligence/AiActivity'
import { BEACH_NODE_ID } from '@/pages/traveler/live/model'
import type { Role } from '@/types'

type Tab = 'all' | NoticeCategory
type Audience = Extract<Role, 'traveler' | 'operator'>

export function InboxBoard({ role }: { role: Audience }) {
  const navigate = useNavigate()
  const { pushToast, applyLiveReroute, keepLivePlan } = useAppState()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [tick, setTick] = useState(0)

  const rows = useMemo(() => noticesFor(role), [role, tick])
  const home = role === 'traveler' ? '/traveler' : '/operator'
  const refresh = () => setTick((value) => value + 1)

  // Filtered dataset
  const filtered = useMemo(() => {
    return rows.filter((item) => {
      if (tab !== 'all' && item.category !== tab) return false
      if (onlyUnread && item.read) return false
      if (query.trim()) {
        const text = `${item.title} ${item.body} ${item.affected ?? ''} ${item.category}`.toLowerCase()
        if (!text.includes(query.toLowerCase().trim())) return false
      }
      return true
    })
  }, [rows, tab, onlyUnread, query])

  const pending = useMemo(() => {
    return rows.filter((item) => item.decision?.status === 'pending')
  }, [rows])

  const unreadCount = useMemo(() => rows.filter((item) => !item.read).length, [rows])

  const review = (item: InboxNotice) => {
    markRead(item.id)
    refresh()
    navigate(item.reviewTo[role])
  }

  const decide = (item: InboxNotice, status: 'accepted' | 'rejected') => {
    decideNotice(item.id, status)
    if (item.id === 'in-weather' || item.id.startsWith('sim-')) {
      if (status === 'accepted') applyLiveReroute('trip-amd-goa', BEACH_NODE_ID, 'accept')
      else keepLivePlan('trip-amd-goa')
    }
    pushToast({
      title: status === 'accepted' ? 'AI Proposal Accepted ✓' : 'AI Proposal Rejected ✗',
      body: item.decision?.change ?? 'Itinerary updated.',
    })
    refresh()
  }

  const handleSimulate = () => {
    const notice = addSimulatedNotice(role)
    pushToast({
      title: '⚡ Live Weather Signal Triggered',
      body: `${notice.title} added to your notification feed.`,
    })
    refresh()
  }

  const handleReset = () => {
    resetDemoInbox()
    pushToast({ title: 'Inbox Reset', body: 'Restored the standard notification feed.' })
    refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Real-time alerts, AI trip reroutes, stay confirmations, and coordinator updates — with instant controls for every signal."
        crumbs={[{ label: role === 'traveler' ? 'Home' : 'Command', to: home }, { label: 'Notifications' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
type="button"               size="sm"
              variant="secondary"
              className="bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 font-bold"
              onClick={handleSimulate}
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              Simulate Live Signal
            </Button>
            <Button
type="button"               size="sm"
              variant="secondary"
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
              onClick={() => {
                markAllRead(role)
                refresh()
                pushToast({ title: 'Inbox Cleared', body: 'All notifications marked as read.' })
              }}
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Mark All Read
            </Button>
            <Button
type="button"               size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-slate-800"
              onClick={handleReset}
              title="Reset notification stream"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total Notifications" value={rows.length.toString()} highlight={false} />
        <MetricCard
          label="Unread Alerts"
          value={unreadCount.toString()}
          highlight={unreadCount > 0}
          badgeText={unreadCount > 0 ? 'Action Needed' : 'All Clear'}
        />
        <MetricCard
          label="Pending AI Control"
          value={pending.length.toString()}
          highlight={pending.length > 0}
          isAi
        />
        <MetricCard label="Shared AI Engine" value="Online ⚡" highlight={false} isLive />
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications by title, trip, or impact..."
              className="w-full rounded-xl border border-line bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Unread Only ({unreadCount})</span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line/60">
          <button
type="button"             onClick={() => setTab('all')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all',
              tab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            All ({rows.length})
          </button>
          {noticeCategories.map((cat) => {
            const count = rows.filter((r) => r.category === cat).length
            const unreadCat = rows.filter((r) => r.category === cat && !r.read).length
            if (count === 0) return null
            return (
              <button
type="button"                 key={cat}
                onClick={() => setTab(cat)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  tab === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                <span>{cat}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-extrabold',
                    tab === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700',
                  )}
                >
                  {count}
                </span>
                {unreadCat > 0 && tab !== cat ? (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          {/* AI Decision Control Cards */}
          {pending.length ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                  Needs Your Control ({pending.length})
                </p>
              </div>
              {pending.map((item) => (
                <ExplainCard
                  key={`x-${item.id}`}
                  item={item}
                  onAccept={() => decide(item, 'accepted')}
                  onReject={() => decide(item, 'rejected')}
                  onReview={() => review(item)}
                />
              ))}
            </div>
          ) : null}

          {/* Standard Notifications Feed */}
          <div className="space-y-3">
            {filtered.length ? (
              filtered.map((item) => (
                <NoticeCard key={item.id} item={item} onReview={() => review(item)} onRead={() => {
                  markRead(item.id)
                  refresh()
                }} />
              ))
            ) : (
              <EmptyState
                icon={<Bell className="h-6 w-6 text-slate-400" />}
                title="No notifications match your filter"
                body="Try adjusting your search terms or clearing the unread filter."
                action={
                  <Button
type="button"                     size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setTab('all')
                      setOnlyUnread(false)
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Right Sidebar: Shared AI Activity Radar */}
        <div className="space-y-4">
          <AiActivityPanel />
        </div>
      </div>
    </div>
  )
}

function NoticeCard({
  item,
  onReview,
  onRead,
}: {
  item: InboxNotice
  onReview: () => void
  onRead: () => void
}) {
  return (
    <Card
      padded={false}
      className={cn(
        'relative overflow-hidden transition-all duration-200 border p-4',
        item.critical && !item.read ? 'border-rose-300 bg-rose-50/40 shadow-sm' : '',
        !item.read && !item.critical ? 'border-brand-200 bg-brand-50/30 shadow-sm' : '',
        item.read ? 'border-line bg-white hover:border-slate-300' : '',
      )}
    >
      {/* Unread Left Border Line */}
      {!item.read ? (
        <span
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1.5',
            item.critical ? 'bg-rose-500' : 'bg-brand-600',
          )}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs',
              item.critical
                ? 'bg-rose-100 text-rose-600'
                : item.category === 'AI'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-slate-100 text-slate-700',
            )}
          >
            <CategoryIcon category={item.category} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-extrabold text-sm text-slate-900">{item.title}</p>
              <Badge tone={item.critical ? 'danger' : item.category === 'AI' ? 'ai' : 'neutral'}>
                {item.category}
              </Badge>
              {!item.read ? <Badge tone={item.critical ? 'danger' : 'info'}>Unread</Badge> : null}
            </div>

            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.body}</p>

            {item.affected ? (
              <p className="mt-2 text-xs font-semibold text-slate-700">
                <span className="text-slate-400 font-normal">Target: </span>
                {item.affected}
              </p>
            ) : null}

            {item.aiRecommendation && item.decision?.status === 'pending' ? (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-[11px] font-extrabold text-brand-800">
                <AILabel />
                <span>AI recommendation needs your approval</span>
              </div>
            ) : null}

            {item.decision && item.decision.status !== 'pending' ? (
              <p className="mt-2 text-xs font-bold text-emerald-700">
                ✓ Decision Logged: {item.decision.status} · {item.decision.change}
              </p>
            ) : null}
          </div>
        </div>

        <span className="shrink-0 text-[11px] font-semibold text-slate-400">{item.time}</span>
      </div>

      {/* Card Action Controls */}
      <div className="mt-3.5 flex items-center justify-between border-t border-line/50 pt-3">
        {!item.read ? (
          <button
type="button"             onClick={onRead}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Mark as read
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">Read</span>
        )}

        <Button
type="button"           size="sm"
          className="bg-slate-900 text-white hover:bg-slate-800 font-bold"
          onClick={onReview}
        >
          Review & Inspect
        </Button>
      </div>
    </Card>
  )
}

function ExplainCard({
  item,
  onAccept,
  onReject,
  onReview,
}: {
  item: InboxNotice
  onAccept: () => void
  onReject: () => void
  onReview: () => void
}) {
  const decision = item.decision
  if (!decision) return null

  return (
    <Card className="border-2 border-brand-500/40 bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 p-5 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-slate-950 font-black shadow-md">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <AILabel />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-300">
                AI Autonomous Proposal
              </span>
            </div>
            <p className="font-extrabold text-base text-white mt-0.5">{item.title}</p>
          </div>
        </div>
        <Badge tone="danger">Action Required</Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3 border border-white/10">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-brand-300">What Changed</dt>
          <dd className="mt-1 font-extrabold text-white text-sm">{decision.change}</dd>
        </div>
        <div className="rounded-xl bg-white/5 p-3 border border-white/10">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Why AI Acted</dt>
          <dd className="mt-1 text-slate-200 leading-relaxed">{decision.why}</dd>
        </div>
        <div className="rounded-xl bg-white/5 p-3 border border-white/10">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Financial & Time Impact</dt>
          <dd className="mt-1 font-bold text-emerald-300">{decision.impact}</dd>
        </div>
        <div className="rounded-xl bg-white/5 p-3 border border-white/10">
          <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Your Traveler Control</dt>
          <dd className="mt-1 text-slate-300">Accepting updates green live path. Rejecting retains original node.</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <Button
type="button"           size="sm"
          variant="ghost"
          className="text-brand-300 hover:text-white hover:bg-white/10 text-xs font-bold"
          onClick={onReview}
        >
          View Full Circuit
        </Button>

        <div className="flex gap-2">
          <Button
type="button"             size="sm"
            variant="secondary"
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 font-bold"
            onClick={onReject}
            icon={<XCircle className="h-4 w-4 text-rose-400" />}
          >
            Reject Change
          </Button>
          <Button
type="button"             size="sm"
            className="bg-[#3FA772] hover:bg-[#32895d] text-white font-extrabold shadow-md"
            onClick={onAccept}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Accept AI Change
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CategoryIcon({ category }: { category: NoticeCategory }) {
  switch (category) {
    case 'Weather':
      return <CloudRain className="h-4 w-4 text-sky-500" />
    case 'AI':
      return <Sparkles className="h-4 w-4 text-purple-500" />
    case 'Booking':
      return <Building2 className="h-4 w-4 text-amber-500" />
    case 'Transport':
      return <Plane className="h-4 w-4 text-blue-500" />
    case 'Payment':
      return <CreditCard className="h-4 w-4 text-emerald-500" />
    case 'Coordinator':
      return <UserCheck className="h-4 w-4 text-orange-500" />
    case 'Trip':
    default:
      return <Compass className="h-4 w-4 text-indigo-500" />
  }
}

function MetricCard({
  label,
  value,
  highlight,
  badgeText,
  isAi,
  isLive,
}: {
  label: string
  value: string
  highlight?: boolean
  badgeText?: string
  isAi?: boolean
  isLive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5 transition-all shadow-xs',
        highlight ? 'border-rose-200 bg-rose-50/50' : 'border-line bg-white',
        isAi ? 'border-purple-200 bg-purple-50/40' : '',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</p>
        {isLive ? (
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        ) : badgeText ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase',
              highlight ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            {badgeText}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-1 font-display text-xl font-extrabold',
          highlight ? 'text-rose-600' : isAi ? 'text-purple-700' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}

