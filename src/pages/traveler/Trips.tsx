import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Radio,
  Search,
  Sparkles,
  Star,
  Trash2,
  ArrowRight,
  CreditCard,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Feedback'
import { Card, MetricCard } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { savedPlaces } from '@/data/demo'
import { useAppState } from '@/state/AppState'
import { cn, formatINR } from '@/lib/cn'
import { liveDay } from '@/pages/traveler/live/model'
import type { Trip } from '@/types'

type LifeTab = 'upcoming' | 'ongoing' | 'completed'

export function Trips() {
  const { trips: allTrips, checkout } = useAppState()
  const [params, setParams] = useSearchParams()
  const [newTripModal, setNewTripModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  
  const saved = params.get('view') === 'saved'
  const tab = (params.get('tab') as LifeTab) || 'upcoming'
  const navigate = useNavigate()

  const trips = allTrips.filter((t) => !deletedIds.includes(t.id))

  const setTab = (value: LifeTab) => {
    setParams({ tab: value })
  }

  const upcoming = trips.filter((trip) => trip.status !== 'live' && trip.status !== 'completed' && trip.status !== 'cancelled')
  const ongoing = trips.filter((trip) => trip.status === 'live')
  const completed = trips.filter((trip) => trip.status === 'completed')
  
  const rawRows = tab === 'upcoming' ? upcoming : tab === 'ongoing' ? ongoing : completed
  const rows = rawRows.filter((trip) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return trip.title.toLowerCase().includes(q) || trip.route.toLowerCase().includes(q)
  })

  const totalSpent = trips.reduce((sum, item) => sum + item.spent, 0)
  const totalBudget = trips.reduce((sum, item) => sum + item.budget, 0)

  return (
    <div className="trips-page-root">
      {/* ── Page Header ─────────────────────────────────────── */}
      <PageHeader
        title="My Trips & Circuits"
        description="Manage your upcoming journeys, track live trip progress, and explore past circuits."
        actions={
          <div className="flex items-center gap-2">
            <Button type="button"
              variant="secondary"
              icon={<Layers className="h-4 w-4" />}
              onClick={() => navigate('/traveler/plan/build')}
            >
              Hop Builder
            </Button>
            <Button type="button"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => setNewTripModal(true)}
            >
              New Journey
            </Button>
          </div>
        }
      />

      {/* ── Metric Cards Overview ───────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Circuits"
          value={trips.length.toString()}
          hint="All planned journeys"
          icon={<MapPin className="h-4 w-4" />}
          tone="info"
        />
        <MetricCard
          label="Upcoming"
          value={upcoming.length.toString()}
          hint="Planning & confirmed"
          icon={<Compass className="h-4 w-4" />}
          tone="warning"
        />
        <MetricCard
          label="Live Active"
          value={ongoing.length.toString()}
          hint="Operating companion"
          icon={<Radio className="h-4 w-4" />}
          tone="success"
        />
        <MetricCard
          label="Total Investment"
          value={formatINR(totalSpent)}
          hint={`Of ${formatINR(totalBudget)} total budget`}
          icon={<CreditCard className="h-4 w-4" />}
          tone="ai"
        />
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { id: 'ongoing', label: `Ongoing (${ongoing.length})` },
              { id: 'completed', label: `Completed (${completed.length})` },
            ]}
          />
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trip or city..."
            className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-4 text-sm text-ink outline-none transition-colors focus:border-brand-500"
          />
        </div>
      </div>

      {/* ── Saved places toggle banner ───────────────────────── */}
      {saved ? (
        <SavedPlaces />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.length ? (
            rows.map((trip) => (
              <LifeCard
                key={trip.id}
                trip={trip}
                booked={
                  Boolean(checkout && checkout.tripId === trip.id) ||
                  trip.status === 'ready' ||
                  trip.status === 'live'
                }
                onOpenLive={() => navigate(`/traveler/live/${trip.id}`)}
                onOpenPlan={() => navigate(`/traveler/trips/${trip.id}`)}
                onOpenReview={() => navigate(`/traveler/review/${trip.id}`)}
                onDelete={() => setDeleteId(trip.id)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                icon={<Compass className="h-6 w-6 text-brand-600" />}
                title={
                  searchQuery
                    ? `No trips found matching "${searchQuery}"`
                    : tab === 'ongoing'
                    ? 'No trip is currently active'
                    : tab === 'completed'
                    ? 'No completed journeys yet'
                    : 'No upcoming trips'
                }
                body={
                  tab === 'ongoing'
                    ? 'Activate Live Mode on any confirmed circuit when you depart.'
                    : 'Create a circuit with our AI concierge or custom hop builder.'
                }
                action={
                  <Button type="button"
                    icon={<Sparkles className="h-4 w-4" />}
                    onClick={() => navigate('/traveler/plan')}
                  >
                    Plan New Circuit
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────── */}
      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Remove Circuit"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove this trip from your account? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
type="button"             variant="secondary"
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              if (deleteId) setDeletedIds((prev) => [...prev, deleteId])
              setDeleteId(null)
            }}
          >
            Delete Trip
          </Button>
        </div>
      </Modal>

      {/* ── New Trip Modal ────────────────────────────────────── */}
      <Modal
        open={newTripModal}
        onClose={() => setNewTripModal(false)}
        title="Create New Journey"
      >
        <p className="text-sm text-slate-600">
          Choose how you would like to build your upcoming journey:
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setNewTripModal(false)
              navigate('/traveler/plan')
            }}
            className="flex flex-col items-start gap-2 rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5 text-left transition-all hover:border-brand-500 hover:bg-brand-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-1 font-display text-base font-bold text-ink">AI Concierge</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe your dream trip in plain text or voice. AI crafts your itinerary in seconds.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewTripModal(false)
              navigate('/traveler/plan/build')
            }}
            className="flex flex-col items-start gap-2 rounded-2xl border-2 border-line bg-white p-5 text-left transition-all hover:border-brand-400 hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <p className="mt-1 font-display text-base font-bold text-ink">Hop-by-Hop Builder</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manually place train berths, hotels, and custom activities for full granular control.
            </p>
          </button>
        </div>
      </Modal>
    </div>
  )
}

function LifeCard({
  trip,
  booked,
  onOpenLive,
  onOpenPlan,
  onOpenReview,
  onDelete,
}: {
  trip: Trip
  booked: boolean
  onOpenLive: () => void
  onOpenPlan: () => void
  onOpenReview: () => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const planned = trip.status !== 'planning' && trip.status !== 'draft'
  const confirmed = booked || trip.status === 'ready' || trip.status === 'live'
  const live = trip.status === 'live'
  const done = trip.status === 'completed'
  const statusLabel = done ? 'Completed' : live ? 'Live' : confirmed ? 'Confirmed' : 'Planning'

  const durationDays = differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-brand-200">
      <div>
        {/* Header line */}
        <div className="flex items-start justify-between gap-3">
          <div className="pr-6">
            <h3 className="font-display text-lg font-bold leading-snug text-ink group-hover:text-brand-700 transition-colors">
              {trip.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <MapPin className="h-3.5 w-3.5" />
              {trip.route}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {confirmed && !live && !done ? (
              <Badge tone="success">Confirmed</Badge>
            ) : (
              <StatusBadge status={statusLabel.toLowerCase()} />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="rounded-lg p-1 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
              aria-label="Delete trip"
              title="Delete trip"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live banner */}
        {live ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 shadow-sm">
            <span className="flex items-center gap-2">
              <Radio className="h-4 w-4 animate-pulse text-emerald-600" />
              Day {liveDay(trip)} of {durationDays} · Live Companion
            </span>
            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-800">
              Active
            </span>
          </div>
        ) : null}

        {/* Details row */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Duration</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {durationDays} Days ({rangeWithYear(trip.startDate, trip.endDate)})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Budget / Spent</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {formatINR(trip.spent)} / {formatINR(trip.budget)}
            </span>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Circuit State</p>
          <ol className="flex items-center gap-2 text-xs">
            <Step label="Draft" done={planned || confirmed || done} current={!planned && !done} />
            <span className="text-slate-300">—</span>
            <Step label="Booked" done={confirmed || done} current={planned && !confirmed && !done} />
            <span className="text-slate-300">—</span>
            <Step
              label={done ? 'Done' : live ? 'Live' : 'Ready'}
              done={done}
              current={confirmed && !done}
            />
          </ol>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex items-center gap-2 border-t border-line pt-3">
        {live ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={(e) => {
                e.stopPropagation()
                onOpenPlan()
              }}
              className="flex-1"
            >
              Map & Flow
            </Button>
            <Button
              type="button"
              size="sm"
              icon={<Radio className="h-3.5 w-3.5" />}
              onClick={(e) => {
                e.stopPropagation()
                onOpenLive()
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Live
            </Button>
          </>
        ) : done ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={(e) => {
                e.stopPropagation()
                onOpenPlan()
              }}
              className="flex-1"
            >
              Map & Flow
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
              onClick={(e) => {
                e.stopPropagation()
                onOpenReview()
              }}
              className="flex-1"
            >
              Review
            </Button>
          </>
        ) : (
          <>
            <Button
type="button"               size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onOpenPlan()
              }}
              className="flex-1"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              View Map & Flow
            </Button>
            <Button
type="button"               size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                navigate('/traveler/plan/build')
              }}
            >
              Edit Hop
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

function Step({ label, done, current }: { label: string; done: boolean; current?: boolean }) {
  return (
    <li
      className={cn(
        'inline-flex items-center gap-1 font-semibold text-[11px]',
        done && 'text-emerald-700',
        current && !done && 'text-brand-700',
        !done && !current && 'text-slate-400',
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {label}
    </li>
  )
}

function SavedPlaces() {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {savedPlaces.length ? (
        savedPlaces.map((place) => (
          <Card key={place.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <p className="font-display font-bold text-base text-ink">{place.name}</p>
                <Badge tone="info">{place.kind}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {place.city}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-2 text-xs text-slate-400">
              <span>Saved place</span>
              <Bookmark className="h-4 w-4 fill-amber-400 text-amber-500" />
            </div>
          </Card>
        ))
      ) : (
        <div className="col-span-full">
          <EmptyState
            icon={<Bookmark className="h-6 w-6 text-brand-600" />}
            title="Nothing saved yet"
            body="Pin cafes, viewpoints, and hotels while exploring your circuit."
          />
        </div>
      )}
    </div>
  )
}

function rangeWithYear(start: string, end: string) {
  try {
    const from = parseISO(start)
    const to = parseISO(end)
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      return `${format(from, 'd')}–${format(to, 'd MMM yyyy')}`
    }
    return `${format(from, 'd MMM')} – ${format(to, 'd MMM yyyy')}`
  } catch {
    return `${start} – ${end}`
  }
}
