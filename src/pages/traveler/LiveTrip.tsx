import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloudRain, CloudSun, Radio, TriangleAlert, Navigation, CheckCircle2 } from 'lucide-react'
import { getCurrentWeather } from '@/services/weather/weather'
import { detectWeatherSignal, runDisruptionPipeline, simulationSignal, type DisruptionProposal } from '@/services/disruption/disruption'
import { haversineKm, requestOnce, watchLive, type UserFix } from '@/services/location/location'
import { seedLookup } from '@/services/geo/seeds'
import { formatDistance, formatDuration } from '@/services/maps/routing'
import type { WeatherNow } from '@/services/geo/types'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppState } from '@/state/AppState'
import { formatINR, cn } from '@/lib/cn'
import { DEMO_BOOKING_ID } from '@/lib/booking'
import { coordinatorRohan } from '@/data/demo'
import { LiveFlow } from '@/pages/traveler/live/LiveFlow'
import { LiveMap } from '@/pages/traveler/live/LiveMap'
import { SosButton, SosModal } from '@/pages/traveler/live/SosModal'
import {
  INDOOR_ALT_ID,
  LIVE_DAYS,
  clockFor,
  liveDay,
  nextActionLabel,
  remainingBudget,
} from '@/pages/traveler/live/model'

export function LiveTrip() {
  const { id } = useParams()
  const {
    trips,
    checkout,
    enterLiveTrip,
    markNodeVisited,
    applyLiveReroute,
    keepLivePlan,
    pushToast,
    signIn,
  } = useAppState()
  const trip = trips.find((item) => item.id === id) ?? trips[0]
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [disruption, setDisruption] = useState<'idle' | 'open' | 'accepted'>('idle')
  const [sos, setSos] = useState(false)
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [weatherAlert, setWeatherAlert] = useState<DisruptionProposal | null>(null)
  const [fix, setFix] = useState<UserFix | null>(null)
  const [liveShare, setLiveShare] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  useEffect(() => {
    if (id) enterLiveTrip(id)
  }, [id, enterLiveTrip])

  useEffect(() => {
    if (!trip) return
    const accepted = trip.nodes.some(
      (node) => node.id === INDOOR_ALT_ID && (node.status === 'active' || node.status === 'visited'),
    )
    const staged = trip.nodes.some((node) => node.status === 'disrupted')
    if (accepted) setDisruption('accepted')
    else if (staged) setDisruption('open')
    else setDisruption('idle')
  }, [trip])

  const nodes = trip?.nodes ?? []
  const current = nodes.find((node) => node.status === 'active') ?? null

  useEffect(() => {
    if (!trip) return
    const city = current?.city ?? 'Goa'
    const pin = seedLookup(city) ?? seedLookup('Goa')
    if (!pin) return
    const list = trip.nodes
    void getCurrentWeather(pin.lat, pin.lng)
      .then(async (now) => {
        setWeather(now)
        const outdoor = list.find(
          (node) => node.category === 'activity' && /beach|baga|water/i.test(`${node.title} ${node.notes}`),
        )
        const signal = await detectWeatherSignal(pin.lat, pin.lng, outdoor)
        if (signal) {
          const proposal = await runDisruptionPipeline(signal, list)
          setWeatherAlert(proposal)
        } else {
          setWeatherAlert(null)
        }
      })
      .catch(() => setWeather(null))
  }, [trip?.id, current?.city])

  useEffect(() => {
    if (!liveShare) return
    const stop = watchLive(setFix, (message) => {
      setLocError(message)
      setLiveShare(false)
    })
    return stop
  }, [liveShare])

  const next = useMemo(() => {
    if (!current)
      return nodes.find((node) => node.status === 'upcoming' || node.status === 'alternative') ?? null
    const index = nodes.findIndex((node) => node.id === current.id)
    return nodes.slice(index + 1).find((node) => node.status !== 'visited' && node.status !== 'disrupted') ?? null
  }, [nodes, current])

  const selected = nodes.find((node) => node.id === selectedId) ?? current
  const raining = disruption !== 'idle'
  const remaining = trip ? remainingBudget(trip) : 0
  const nextPin = next ? seedLookup(next.city) ?? seedLookup(next.title) : null
  const nextKm = fix && nextPin ? haversineKm(fix, nextPin) : null

  if (!trip) {
    return (
      <EmptyState
        icon={<Radio className="h-5 w-5" />}
        title="Live trip unavailable"
        body="Start from My Trips to open a circuit."
        action={<Button type="button" onClick={() => navigate('/traveler/trips')}>My trips</Button>}
      />
    )
  }

  if (!nodes.length) {
    return (
      <EmptyState
        icon={<Radio className="h-5 w-5" />}
        title="This trip is not live yet"
        body="Generate and confirm the itinerary first, then open the live companion."
        action={<Button type="button" onClick={() => navigate('/traveler/plan')}>Plan this trip</Button>}
      />
    )
  }

  const simulate = () => {
    applyLiveReroute(trip.id, current?.id ?? next?.id ?? trip.nodes[0].id, 'stage')
    setDisruption('open')
    setSelectedId(current?.id ?? next?.id ?? trip.nodes[0].id)
    const fake = simulationSignal(current?.id ?? next?.id ?? trip.nodes[0].id)
    pushToast({ title: fake.title, body: fake.body })
  }

  const accept = () => {
    applyLiveReroute(trip.id, current?.id ?? next?.id ?? trip.nodes[0].id, 'accept')
    setDisruption('accepted')
    setSelectedId(INDOOR_ALT_ID)
  }

  const keep = () => {
    keepLivePlan(trip.id)
    setDisruption('idle')
    setSelectedId(current?.id ?? next?.id ?? trip.nodes[0].id)
    pushToast({ title: 'Original plan kept', body: 'Baga water sports stays on the live path.' })
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100vh-4rem)] flex-col bg-[#101823] text-[#F3EFE7] lg:-mx-8 overflow-hidden">
      {/* ── Top Bar: Live Mission Control ────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-[#16212F]/95 px-6 py-3.5 backdrop-blur-md shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA772] text-white shadow-md animate-pulse">
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#3FA772]/20 border border-[#3FA772]/40 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#3FA772]">
                  Live Companion Active
                </span>
                <span className="text-xs text-slate-400 font-semibold">{trip.title}</span>
              </div>
              <h1 className="font-display text-lg font-extrabold text-[#F3EFE7] mt-0.5">
                Day {liveDay(trip)} of {LIVE_DAYS} · {current?.city ?? 'Goa'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
type="button"               size="sm"
              variant="secondary"
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              disabled={disruption !== 'idle'}
              onClick={simulate}
            >
              Simulate Weather Reroute
            </Button>
            <Button
type="button"               size="sm"
              variant="secondary"
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              onClick={async () => {
                try {
                  setLocError(null)
                  const once = await requestOnce()
                  setFix(once)
                  pushToast({ title: 'GPS position acquired', body: `${once.lat.toFixed(3)}, ${once.lng.toFixed(3)}` })
                } catch (error) {
                  setLocError(error instanceof Error ? error.message : 'Location permission denied.')
                }
              }}
            >
              <Navigation className="h-3.5 w-3.5 text-[#3FA772]" />
              Use My Location
            </Button>
            <Button
type="button"               size="sm"
              variant="secondary"
              className={cn(
                'border-slate-700 font-bold',
                liveShare ? 'bg-[#3FA772] text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700',
              )}
              onClick={() => {
                setLiveShare((v) => {
                  if (v) setFix(null)
                  return !v
                })
              }}
            >
              {liveShare ? 'Live Location On ✓' : 'Enable Live GPS'}
            </Button>
            <Button
type="button"               size="sm"
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => navigate(`/traveler/trips/${trip.id}`)}
            >
              Planning Canvas
            </Button>
          </div>
        </div>

        {/* Live Metrics Header Bar */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-[#101823] p-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Current Stop" value={current?.city ?? 'Goa'} />
          <Stat
            label="Next Up"
            value={
              disruption === 'open'
                ? 'Beach Activity'
                : nextActionLabel(current?.status === 'active' ? current : next ?? current ?? undefined)
            }
          />
          <Stat label="Scheduled Time" value={clockFor(current ?? undefined)} />
          <Stat
            label="Weather Signal"
            value={
              weather
                ? `${weather.temperatureC}°C · ${weather.condition}`
                : raining
                ? '24°C · Rain'
                : 'Loading…'
            }
            icon={
              weather && weather.precipitationProbability >= 55 ? (
                <CloudRain className="h-3.5 w-3.5 text-sky-400" />
              ) : (
                <CloudSun className="h-3.5 w-3.5 text-amber-400" />
              )
            }
          />
          <Stat label="Remaining Budget" value={formatINR(remaining)} highlight />
          <Stat label="Live Coordinator" value={coordinatorRohan.name.split(' ')[0]} />
        </div>
      </div>

      {/* Weather Reroute Alerts */}
      {weatherAlert && disruption === 'idle' ? (
        <div className="mx-6 mt-4 rounded-2xl border border-[#E0A63A]/50 bg-[#E0A63A]/10 p-4 text-[#F3EFE7]">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#E0A63A]" />
            <div>
              <p className="font-bold text-[#F3EFE7]">{weatherAlert.signal.title}</p>
              <p className="mt-0.5 text-xs text-slate-300">{weatherAlert.signal.body}</p>
            </div>
          </div>
          <Button
type="button"             size="sm"
            className="mt-3 bg-[#E0A63A] hover:bg-[#c9922e] text-slate-950 font-extrabold"
            onClick={() => {
              applyLiveReroute(trip.id, current?.id ?? next?.id ?? trip.nodes[0].id, 'stage')
              setDisruption('open')
              setSelectedId(current?.id ?? next?.id ?? trip.nodes[0].id)
            }}
          >
            Stage AI Reroute Alternative
          </Button>
        </div>
      ) : null}

      {locError && <p className="mx-6 mt-3 text-xs text-[#C96A4B]">{locError}</p>}

      {fix && nextKm != null ? (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl border border-[#3FA772]/30 bg-[#3FA772]/10 px-4 py-2 text-xs font-semibold text-[#3FA772]">
          <Navigation className="h-4 w-4" />
          <span>
            GPS Position Acquired · {formatDistance(nextKm * 1000)} to {next?.title ?? 'next stop'}
            {nextKm > 0 ? ` · approx ${formatDuration((nextKm / 35) * 3600)} drive` : ''}
          </span>
        </div>
      ) : null}

      {disruption === 'open' ? (
        <div className="mx-6 mt-4 rounded-2xl border border-[#C96A4B]/60 bg-[#C96A4B]/15 p-4 text-[#F3EFE7]">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#C96A4B]" />
            <div>
              <p className="font-bold text-base text-[#F3EFE7]">Weather Disruption Staged</p>
              <p className="mt-0.5 text-xs text-slate-300">
                Heavy rain expected near Baga Beach. Replace outdoor activity with indoor food experience.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" className="bg-[#3FA772] hover:bg-[#32895d] text-white font-bold" onClick={accept}>
              Accept Update to Green Path
            </Button>
            <Button type="button" size="sm" variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700" onClick={keep}>
              Keep Original Outdoor Plan
            </Button>
          </div>
        </div>
      ) : null}

      {disruption === 'accepted' ? (
        <div className="mx-6 mt-4 rounded-2xl border border-[#3FA772]/60 bg-[#3FA772]/15 p-4 text-[#F3EFE7]">
          <p className="font-bold text-base text-[#F3EFE7]">Reroute Accepted & Live</p>
          <p className="mt-0.5 text-xs text-slate-300">
            Indoor food is now on the green live path. Horizon Trails operator desk synced.
          </p>
          <Button
type="button"             size="sm"
            className="mt-3 bg-[#3FA772] hover:bg-[#32895d] text-white"
            onClick={() => {
              signIn('operator')
              navigate('/operator')
            }}
          >
            Switch to Operator Portal
          </Button>
        </div>
      ) : null}

      {/* Main Surface: Stream Flow + Map Sidebar */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[7fr_3fr]">
        <div className="min-h-[480px] border-b border-slate-800 lg:border-r lg:border-b-0">
          <LiveFlow nodes={nodes} selectedId={selectedId ?? current?.id ?? null} onSelect={setSelectedId} />
        </div>

        {/* Sidebar: Map & Selected Node Actions */}
        <aside className="space-y-4 overflow-y-auto p-4 app-scrollbar bg-[#16212F]">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Live Companion Map
          </p>
          <LiveMap
            nodes={nodes}
            current={current}
            next={next}
            selectedId={selectedId ?? current?.id ?? null}
            userLocation={fix}
            onSelect={setSelectedId}
          />

          <div className="rounded-2xl border border-slate-800 bg-[#101823] p-4 text-[#F3EFE7]">
            <p className="font-bold text-base">{selected?.title ?? 'Select a node'}</p>
            <p className="text-xs font-medium text-[#3FA772] mt-0.5">
              {selected?.city} · {selected?.time}
            </p>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">{selected?.notes}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected && selected.status !== 'visited' && selected.status !== 'disrupted' ? (
                <Button
type="button"                   size="sm"
                  className="w-full bg-[#3FA772] hover:bg-[#32895d] text-white font-bold"
                  onClick={() => {
                    markNodeVisited(trip.id, selected.id)
                    pushToast({
                      title: 'Marked as visited',
                      body: `${selected.title} closed. Position advanced to next stop.`,
                    })
                    setSelectedId(null)
                  }}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Mark as Visited
                </Button>
              ) : selected?.status === 'visited' ? (
                <p className="w-full text-xs font-bold text-[#3FA772]">✓ Visited Stop</p>
              ) : null}

              <Button
type="button"                 size="sm"
                variant="secondary"
                className="w-full bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                onClick={() => navigate('/traveler/plan/build')}
              >
                Custom Hop Builder
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Node Detail Drawer */}
      <Drawer
        open={Boolean(selectedId && selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? 'Node'}
      >
        {selected ? (
          <div className="space-y-3 text-[#F3EFE7]">
            <p className="text-xs text-slate-300">{selected.notes}</p>
            <p className="text-xs font-semibold text-[#3FA772]">
              {selected.city} · {selected.time} · Day {selected.day}
            </p>
            {selected.status === 'visited' ? (
              <p className="text-xs font-bold text-[#3FA772]">✓ Visited</p>
            ) : selected.status !== 'disrupted' ? (
              <Button
type="button"                 className="w-full bg-[#3FA772] hover:bg-[#32895d] text-white font-bold mt-2"
                onClick={() => {
                  markNodeVisited(trip.id, selected.id)
                  pushToast({
                    title: 'Marked as visited',
                    body: `${selected.title} closed. Next stop is now active.`,
                  })
                  setSelectedId(null)
                }}
              >
                Mark as Visited
              </Button>
            ) : (
              <p className="text-xs text-[#C96A4B]">Held as a historical disruption on the live path.</p>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* Terracotta SOS Button & Modal */}
      <SosButton onOpen={() => setSos(true)} />
      <SosModal
        open={sos}
        trip={trip}
        location={`${current?.city ?? 'Goa'} · ${current?.title ?? 'live fix'}`}
        bookingId={checkout?.bookingId ?? DEMO_BOOKING_ID}
        onClose={() => setSos(false)}
        onCall={() => {
          setSos(false)
          pushToast({
            title: 'Calling coordinator',
            body: `${coordinatorRohan.name} · ${coordinatorRohan.phone}.`,
          })
        }}
        onAlert={() => {
          setSos(false)
          pushToast({ title: 'Alert sent', body: 'Horizon Trails desk received your live SOS signal.' })
        }}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon?: ReactNode
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</p>
      <p
        className={cn(
          'mt-1 flex items-center gap-1 text-xs font-extrabold truncate',
          highlight ? 'text-[#3FA772]' : 'text-[#F3EFE7]',
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  )
}

