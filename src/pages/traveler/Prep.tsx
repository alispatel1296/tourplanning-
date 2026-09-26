import { useEffect, useMemo, useState } from 'react'
import { searchTravelInformation } from '@/services/travel/TravelDataService'
import type { TravelEntity } from '@/services/travel/types'
import { useNavigate } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import {
  BatteryCharging,
  Check,
  Cloud,
  CloudRain,
  CloudSun,
  CreditCard,
  Droplets,
  HeartPulse,
  Hotel,
  IdCard,
  Phone,
  Shirt,
  Sun,
  Ticket,
  Backpack,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Overlay'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { AIInsightCard, AILabel } from '@/components/domain/AICards'
import { AlternativeCard } from '@/components/domain/OperationalCards'
import { dateRangeLabel, routeLabel } from '@/lib/plan'
import { cn } from '@/lib/cn'
import { useAppState, usePrimaryTrip } from '@/state/AppState'

const PREP_KEY = 'tf-prep-docs'

const defaultDocs = [
  {
    id: 'id',
    label: 'Government ID',
    description: 'Aadhaar or passport copies for both adults, saved offline.',
    done: true,
  },
  {
    id: 'tickets',
    label: 'Train/Flight tickets',
    description: 'Vande Bharat 22925 plus both IndiGo PNRs downloaded.',
    done: true,
  },
  {
    id: 'hotel',
    label: 'Hotel confirmation',
    description: 'Fern is confirmed. Novotel Candolim is still waitlisted.',
    done: false,
  },
  {
    id: 'emergency',
    label: 'Emergency contacts',
    description: 'Rohan Desai (Goa desk) and Meera Kulkarni (ops) saved.',
    done: true,
  },
  {
    id: 'payment',
    label: 'Payment method',
    description: 'Primary card plus ₹8,000 cash buffer for cabs and food.',
    done: true,
  },
]

const packing = [
  {
    id: 'clothing',
    title: 'Clothing',
    icon: Shirt,
    items: ['Light cotton clothes', 'Comfortable walking shoes', 'One light layer for AC coaches'],
  },
  {
    id: 'toiletries',
    title: 'Toiletries',
    icon: Droplets,
    items: ['Sunscreen', 'Basic toiletry pouch', 'After-sun lotion'],
  },
  {
    id: 'electronics',
    title: 'Electronics',
    icon: BatteryCharging,
    items: ['Power bank', 'Phone + camera chargers', 'Universal adaptor'],
  },
  {
    id: 'essentials',
    title: 'Travel essentials',
    icon: Backpack,
    items: ['Reusable water bottle', 'Offline tickets folder', 'Small dry bag for Baga'],
  },
  {
    id: 'health',
    title: 'Health & comfort',
    icon: HeartPulse,
    items: ['Small first-aid kit', 'Pack any personal medications you normally require.'],
  },
]

const weather = [
  { label: 'Sunny', icon: Sun },
  { label: 'Sunny', icon: Sun },
  { label: 'Cloudy', icon: Cloud },
  { label: 'Sunny', icon: CloudSun },
  { label: 'Rain possibility', icon: CloudRain },
  { label: 'Cloudy', icon: Cloud },
  { label: 'Sunny', icon: Sun },
]

function loadDocs() {
  const raw = localStorage.getItem(PREP_KEY)
  if (!raw) return defaultDocs
  try {
    const saved = JSON.parse(raw) as { id: string; done: boolean }[]
    return defaultDocs.map((item) => ({
      ...item,
      done: saved.find((row) => row.id === item.id)?.done ?? item.done,
    }))
  } catch {
    return defaultDocs
  }
}

export function Prep() {
  const trip = usePrimaryTrip()
  const { plan, pushToast } = useAppState()
  const navigate = useNavigate()
  const [docs, setDocs] = useState(loadDocs)
  const [guides, setGuides] = useState<TravelEntity[]>([])
  const [guideNote, setGuideNote] = useState<string | null>(null)

  useEffect(() => {
    const dest = plan.destinations[plan.destinations.length - 1] ?? 'Goa'
    void searchTravelInformation(`${dest} travel guide transport emergency services popular areas`)
      .then((result) => {
        setGuides(result.items.slice(0, 4))
        setGuideNote(result.message ?? 'Retrieved destination notes · Source: Google / SerpApi')
      })
      .catch(() => setGuideNote('Live destination notes are temporarily unavailable.'))
  }, [plan.destinations])
  const [packed, setPacked] = useState<string[]>([
    'Light cotton clothes',
    'Comfortable walking shoes',
    'One light layer for AC coaches',
    'Sunscreen',
    'Basic toiletry pouch',
    'Power bank',
    'Phone + camera chargers',
    'Reusable water bottle',
    'Offline tickets folder',
    'Small first-aid kit',
    'Pack any personal medications you normally require.',
  ])
  const [altOpen, setAltOpen] = useState(false)
  const [indoorHeld, setIndoorHeld] = useState(false)
  const [weatherNoted, setWeatherNoted] = useState(true)

  const docsDone = docs.filter((item) => item.done).length
  const packItems = packing.flatMap((group) => group.items)
  const packDone = packItems.filter((item) => packed.includes(item)).length
  const readiness = Math.round((docsDone / docs.length) * 50 + (packDone / packItems.length) * 35 + (weatherNoted ? 15 : 0))

  const days = useMemo(
    () => weather.map((item, index) => ({ ...item, date: addDays(parseISO(plan.startDate), index) })),
    [plan.startDate],
  )

  const toggleDoc = (id: string) => {
    setDocs((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
      localStorage.setItem(PREP_KEY, JSON.stringify(next.map(({ id: docId, done }) => ({ id: docId, done }))))
      return next
    })
  }

  const togglePack = (item: string) => {
    setPacked((current) => (current.includes(item) ? current.filter((row) => row !== item) : [...current, item]))
  }

  const indoorAlt = {
    id: 'alt-day5-indoor',
    title: 'Indoor food experience · Fontainhas + Viva Panjim',
    reason: 'Day 5 has rain possibility. Covered churches and a sit-down lunch stay dry.',
    impact: 'Keeps the photography morning indoors until showers pass. No extra cost.',
    extraCost: 0,
    risk: 'low' as const,
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500">Prep & packing</p>
          <h1 className="page-title mt-1">You're almost ready.</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            TripFlow checked your itinerary and prepared everything you may need.
          </p>
          <p className="mt-3 text-sm font-medium text-ink">
            {routeLabel(plan)} · {dateRangeLabel(plan)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/traveler/itinerary')}>
            Back to Itinerary
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/traveler/trips/${trip.id}`)}>
            View My Trip
          </Button>
          <Button type="button" onClick={() => navigate('/traveler/checkout')}>Checkout</Button>
        </div>
      </div>

      {guides.length || guideNote ? (
        <Card className="mb-4">
          <p className="card-title">Retrieved destination notes</p>
          <p className="meta mt-1">{guideNote}</p>
          <ul className="mt-3 space-y-2">
            {guides.map((item) => (
              <li key={item.id}>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-sm text-slate-600">{item.description ?? 'Information unavailable'}</p>
                {item.sourceUrl ? (
                  <a className="text-[12px] font-medium text-brand-700" href={item.sourceUrl} target="_blank" rel="noreferrer">
                    Open source
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Documents</h2>
            <Badge tone={docsDone === docs.length ? 'success' : 'warning'}>
              {docsDone}/{docs.length} completed
            </Badge>
          </div>
          <div className="grid gap-3">
            {docs.map((item) => (
              <button key={item.id}
                type="button"
                onClick={() => toggleDoc(item.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-md',
                  item.done ? 'border-emerald-100' : 'border-line',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border',
                    item.done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <StatusBadge status={item.done ? 'confirmed' : 'pending'} />
                  </div>
                  <p className="mt-1 text-[13px] text-slate-600">{item.description}</p>
                </div>
                {item.id === 'id' ? <IdCard className="h-4 w-4 text-slate-400" /> : null}
                {item.id === 'tickets' ? <Ticket className="h-4 w-4 text-electric-600" /> : null}
                {item.id === 'hotel' ? <Hotel className="h-4 w-4 text-amber-600" /> : null}
                {item.id === 'emergency' ? <Phone className="h-4 w-4 text-slate-400" /> : null}
                {item.id === 'payment' ? <CreditCard className="h-4 w-4 text-slate-400" /> : null}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Travel readiness</p>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={readiness} size={96} />
            <div>
              <p className="font-display text-xl font-semibold">{readiness >= 80 ? "You're travel-ready" : 'A few items left'}</p>
              <p className="mt-1 text-sm text-slate-600">Command center score across documents, packing, and weather.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <ReadyRow label="Documents" value={Math.round((docsDone / docs.length) * 100)} hint={`${docsDone} of ${docs.length}`} />
            <ReadyRow label="Packing" value={Math.round((packDone / packItems.length) * 100)} hint={`${packDone} of ${packItems.length}`} />
            <ReadyRow label="Weather noted" value={weatherNoted ? 100 : 0} hint={weatherNoted ? 'Day 5 rain flagged' : 'Review forecast'} />
          </div>
        </Card>
      </div>

      <h2 className="section-title mt-10">Packing advisory</h2>
      <p className="mt-1 text-sm text-slate-600">Built from your outdoor Goa days, mixed transport, and premium stays.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {packing.map((group) => (
          <Card key={group.id}>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <group.icon className="h-4 w-4" />
              </span>
              <h3 className="card-title">{group.title}</h3>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => {
                const on = packed.includes(item)
                return (
                  <button key={item}
                    type="button"
                    onClick={() => togglePack(item)}
                    className="flex w-full items-start gap-2 text-left text-[13px]"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 items-center justify-center rounded border',
                        on ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-line',
                      )}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className={on ? 'text-ink' : 'text-slate-600'}>{item}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="card-title">Weather preview</h2>
              <p className="meta">Seven days along the circuit</p>
            </div>
            <Badge tone="warning">Rain possible on Day 5</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((day, index) => (
              <button key={day.date.toISOString()}
                type="button"
                onClick={() => setWeatherNoted(true)}
                className={cn(
                  'rounded-xl border px-2 py-3 text-center',
                  index === 4 ? 'border-amber-200 bg-amber-50' : 'border-line bg-white',
                )}
              >
                <p className="text-[11px] font-medium text-slate-500">Day {index + 1}</p>
                <p className="mt-0.5 text-[12px] font-semibold">{format(day.date, 'd MMM')}</p>
                <day.icon
                  className={cn(
                    'mx-auto mt-2 h-5 w-5',
                    index === 4 ? 'text-amber-600' : 'text-electric-600',
                  )}
                />
                <p className="mt-2 text-[11px] leading-tight text-slate-600">{day.label}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="ai-glow rounded-xl border border-brand-200 bg-white p-5">
          <AILabel />
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-700">TripFlow noticed</p>
          <p className="mt-2 text-sm text-slate-600">
            Your Goa activities include outdoor plans on Day 5. Consider keeping one indoor alternative available.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setAltOpen(true)}>
            View Alternative
          </Button>
        </div>
      </div>

      <Drawer open={altOpen} onClose={() => setAltOpen(false)} title="Indoor alternative">
        <AIInsightCard
          title="Keep Fontainhas if the sky opens"
          body="Old Goa churches stay covered. Pair them with Viva Panjim and skip the open-air walk if showers hold."
          confidence={0.86}
        />
        <div className="mt-4">
          <AlternativeCard
            alternative={{ ...indoorAlt, selected: indoorHeld }}
            onSelect={() => {
              setIndoorHeld(true)
              setAltOpen(false)
              pushToast({ title: 'Indoor backup held', body: 'Day 5 now has a covered food-and-heritage option.' })
            }}
          />
        </div>
        <Button type="button" className="mt-4" variant="secondary" onClick={() => navigate('/traveler/itinerary')}>
          Open itinerary days
        </Button>
      </Drawer>
    </div>
  )
}

function ReadyRow({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] text-slate-500">
        <span>{label}</span>
        <span>{hint}</span>
      </div>
      <ProgressBar value={value} tone={value >= 80 ? 'success' : value >= 50 ? 'warning' : 'danger'} />
    </div>
  )
}

