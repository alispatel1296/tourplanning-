import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Hotel, Sparkles, TrainFront, UtensilsCrossed, Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, MetricCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Overlay'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { AIInsightCard, AILabel } from '@/components/domain/AICards'
import { MapPanel } from '@/components/domain/MapPanel'
import { formatDate, formatINR, cn } from '@/lib/cn'
import { dateRangeLabel, tripDuration } from '@/lib/plan'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import type { TripNode } from '@/types'
import type { ComposeTripResult, LivePlanResult } from '@/services/travel/types'
import { categoryFor, entityToPatch, priceLabel } from '@/services/travel/toNode'

const nodeTone: Record<TripNode['category'], { label: string; className: string; icon: typeof TrainFront }> = {
  transport: { label: 'Transport', className: 'border-electric-100 bg-electric-50 text-electric-700', icon: TrainFront },
  stay: { label: 'Hotel', className: 'border-brand-100 bg-brand-50 text-brand-800', icon: Hotel },
  food: { label: 'Food', className: 'border-amber-100 bg-amber-50 text-amber-700', icon: UtensilsCrossed },
  activity: { label: 'Activity', className: 'border-emerald-100 bg-emerald-50 text-emerald-700', icon: Waves },
  free: { label: 'Free time', className: 'border-line bg-slate-50 text-slate-600', icon: Waves },
}

/** Build a human-readable day label from the node cities for a given day. */
function buildDayLabel(nodes: TripNode[]): string {
  const cities = [...new Set(nodes.map((n) => n.city))]
  return cities.length > 1 ? cities.join(' → ') : cities[0] ?? ''
}

/** Estimate travel time from transport nodes in a day. */
function buildTravelTime(nodes: TripNode[]): string {
  const transportNodes = nodes.filter((n) => n.category === 'transport')
  if (!transportNodes.length) return '—'
  // ~90 min default per transport leg
  const totalMinutes = transportNodes.length * 90
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function ResultView({ onRegenerate }: { onRegenerate: () => void }) {
  const primary = usePrimaryTrip()
  const { plan, trips, activeTripId, pushToast, insertTravelNode, liveSources } = useAppState()
  const trip = trips.find((item) => item.id === activeTripId) ?? primary
  const navigate = useNavigate()
  const [openDays, setOpenDays] = useState<number[]>([])
  const composed = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('tf-trip-compose')
      return raw ? (JSON.parse(raw) as ComposeTripResult) : null
    } catch {
      return null
    }
  }, [])
  const livePlan = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('tf-live-plan')
      return raw ? (JSON.parse(raw) as LivePlanResult) : null
    } catch {
      return null
    }
  }, [])
  const sources = livePlan?.sources?.length ? livePlan.sources : liveSources
  const [flow, setFlow] = useState(false)
  const [saved, setSaved] = useState(false)
  const duration = tripDuration(plan)
  const remaining = trip.budget - trip.spent
  const days = useMemo(() => groupDays(trip.nodes.filter((node) => node.status !== 'alternative')), [trip.nodes])

  useEffect(() => {
    setOpenDays(days.map((day) => day.day))
  }, [days])

  const toggle = (day: number) => {
    setOpenDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="success">Generated</Badge>
        <Badge tone="info">{sources.length || composed?.configured ? 'Live candidates retrieved' : 'Structured circuit'}</Badge>
        <Badge tone="ai">OpenRouter sequenced</Badge>
        <Badge tone="success">Optimized</Badge>
      </div>
      <h1 className="page-title">{trip.title} is ready.</h1>
      <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        This circuit is saved in <strong>My Trips → Upcoming</strong> (status Ready). Ongoing is only for trips already on the
        road. Open the day-wise flow anytime — it is not only in the backend.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        {duration.nights} nights • {duration.days} days • {trip.adults} travelers · {dateRangeLabel(plan)} · {trip.route}
        {sources.length ? ` · ${sources.join(' · ')}` : ''}
        {livePlan?.narrative &&
        [trip.origin.city, ...trip.destinations.map((item) => item.city)].some((city) =>
          livePlan.narrative.toLowerCase().includes(city.toLowerCase()),
        )
          ? ` — ${livePlan.narrative}`
          : ''}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Budget" value={formatINR(trip.budget)} hint={`${formatINR(remaining)} still free`} tone="success" />
        <MetricCard label="Feasibility" value={`${trip.feasibility}%`} hint={livePlan ? 'Live OpenRouter score' : 'After conflict resolution'} tone="ai" />
        <MetricCard
          label="Travel time"
          value={buildTravelTime(trip.nodes)}
          hint={trip.transport.join(' + ') || 'Mixed legs'}
          tone="info"
        />
        <MetricCard label="Safety buffer" value="45 min" hint={`${formatINR(5000)} cash buffer`} tone="warning" />
      </div>

      {composed?.options.length ? (
        <div className="mt-6">
          <h2 className="section-title mb-3">Real options from Google / SerpApi</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {composed.options.map((option) => (
              <Card key={option.id}>
                <p className="card-title">{option.title}</p>
                <p className="meta mt-1">{option.focus}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {option.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-semibold">
                  {option.estimatedTotal != null ? `Retrieved prices total ₹${option.estimatedTotal.toLocaleString('en-IN')}` : 'Some prices unavailable'}
                </p>
                <p className="meta mt-1">{option.tradeoffs.join(' · ')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[option.hotel, option.restaurant, option.activity].filter(Boolean).map((entity) => (
                    <Button
type="button"                       key={entity!.id}
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        insertTravelNode(trip.id, trip.nodes.at(-1)?.id ?? null, {
                          ...entityToPatch(entity!),
                          title: entity!.name,
                          category: categoryFor(entity!),
                        })
                        pushToast({ title: 'Added to trip flow', body: `${entity!.name} · ${priceLabel(entity!)}` })
                      }}
                    >
                      + {entity!.type}
                    </Button>
                  ))}
                </div>
                <p className="meta mt-2">Source: Google / SerpApi · no overall winner</p>
              </Card>
            ))}
          </div>
        </div>
      ) : composed?.message ? (
        <p className="mt-4 text-sm text-slate-600">{composed.message}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" onClick={() => navigate('/traveler/carry')}>What to carry</Button>
        <Button type="button" variant="secondary" onClick={() => navigate(`/traveler/trips/${trip.id}`)}>
          Open trip flow
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/traveler/trips?tab=upcoming')}>
          Show in My Trips
        </Button>
        <Button type="button" variant="secondary" onClick={() => setFlow(true)}>
          Day list
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/traveler/plan')}>
          Edit Trip
        </Button>
        <Button type="button" variant="secondary" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button
type="button"           variant={saved ? 'outline' : 'secondary'}
          onClick={() => {
            setSaved(true)
            pushToast({ title: 'Trip saved', body: `${trip.title} is in My Trips → Upcoming.` })
          }}
        >
          {saved ? 'Saved' : 'Save Trip'}
        </Button>
        <Button type="button" variant="secondary" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate('/traveler/prep')}>
          Continue to Prep
        </Button>
        <Button type="button" onClick={() => navigate('/traveler/checkout')}>Book & checkout</Button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <h2 className="section-title">Itinerary overview</h2>
          {days.map((day) => {
            const open = openDays.includes(day.day)
            const cost = day.nodes.reduce((sum, node) => sum + node.cost, 0)
            const dayLabel = buildDayLabel(day.nodes)
            const tTime = buildTravelTime(day.nodes)
            return (
              <Card key={day.day} padded={false}>
                <button
                  type="button"
                  onClick={() => toggle(day.day)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div>
                    <p className="meta">
                      Day {day.day} · {formatDate(day.date, 'long')}
                    </p>
                    <p className="card-title mt-1">{dayLabel || day.location}</p>
                    <p className="meta mt-1">
                      {formatINR(cost)} · {tTime} travel
                    </p>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
                </button>
                {open ? (
                  <div className="space-y-2 border-t border-line px-5 py-4">
                    {day.nodes.map((node) => {
                      const tone = nodeTone[node.category]
                      const Icon = tone.icon
                      return (
                        <div key={node.id} className="flex items-start gap-3">
                          <span className={cn('mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border', tone.className)}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{node.title}</p>
                              <span className={cn('rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tone.className)}>
                                {tone.label}
                              </span>
                            </div>
                            <p className="meta mt-0.5">
                              {node.time} · {node.city}
                              {node.cost ? ` · ${formatINR(node.cost)}` : ''}
                            </p>
                            <p className="mt-1 text-[13px] text-slate-600">{node.notes}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="card-title">Trip feasibility</p>
              <AILabel />
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={trip.feasibility} label="ready" size={88} />
              <div className="flex-1 space-y-2">
                <Score label="Transport" value={96} />
                <Score label="Timing" value={92} />
                <Score label="Budget" value={97} />
                <Score label="Activity availability" value={93} />
              </div>
            </div>
          </Card>
          <div>
            <p className="card-title mb-3">AI Insights</p>
            <div className="space-y-3">
              {livePlan?.narrative ? (
                <AIInsightCard title="Live compose note" body={livePlan.narrative} confidence={0.9} />
              ) : (
                <AIInsightCard
                  title="45-minute arrival buffer"
                  body="Your itinerary leaves 45 minutes between arrival and check-in."
                  confidence={0.93}
                />
              )}
              <AIInsightCard
                title={sources.length ? `Sourced from ${sources.slice(0, 2).join(' + ')}` : 'Day 4 is activity-heavy'}
                body={
                  sources.length
                    ? 'Hotel, transport, and activity names were retrieved first. OpenRouter only sequenced those rows.'
                    : 'Day 4 is activity-heavy. Consider moving one activity to Day 5.'
                }
                confidence={0.86}
              />
              <AIInsightCard
                title="Budget vs live prices"
                body={`You're currently ${formatINR(Math.max(0, trip.budget - trip.spent))} under the ceiling after retrieved prices.`}
                confidence={0.9}
              />
            </div>
          </div>
        </div>
      </div>

      <Drawer open={flow} onClose={() => setFlow(false)} title="Trip flow">
        <MapPanel title={trip.title} caption={trip.route} />
        <div className="mt-4 space-y-3">
          {days.map((day) => (
            <div key={day.day} className="rounded-xl border border-line px-3 py-3">
              <p className="text-sm font-semibold">
                Day {day.day} · {buildDayLabel(day.nodes)}
              </p>
              <p className="meta mt-1">{day.nodes.map((node) => node.title).join(' → ')}</p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <ProgressBar value={value} tone={value >= 95 ? 'success' : 'info'} />
    </div>
  )
}

function groupDays(nodes: TripNode[]) {
  const map = new Map<number, { day: number; date: string; location: string; nodes: TripNode[] }>()
  nodes.forEach((node) => {
    const current = map.get(node.day) ?? { day: node.day, date: node.date, location: node.city, nodes: [] }
    current.nodes.push(node)
    map.set(node.day, current)
  })
  return [...map.values()]
}
