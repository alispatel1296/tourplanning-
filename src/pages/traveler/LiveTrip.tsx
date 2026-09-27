import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CloudRain, CloudSun, TriangleAlert, Navigation, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'
import { getCurrentWeather } from '@/services/weather/weather'
import { detectWeatherSignal, runDisruptionPipeline, simulationSignal, type DisruptionProposal } from '@/services/disruption/disruption'
import { haversineKm, requestOnce, type UserFix } from '@/services/location/location'
import { seedLookup } from '@/services/geo/seeds'
import { formatDistance } from '@/services/maps/routing'
import type { WeatherNow } from '@/services/geo/types'
import { Button } from '@/components/ui/Button'
import { LiveMap } from '@/pages/traveler/live/LiveMap'
import { useAppState } from '@/state/AppState'
import { INDOOR_ALT_ID, liveDay } from '@/pages/traveler/live/model'

export function LiveTrip() {
  const { id } = useParams()
  const {
    trips,
    enterLiveTrip,
    markNodeVisited,
    applyLiveReroute,
    keepLivePlan,
    pushToast,
  } = useAppState()
  const trip = trips.find((item) => item.id === id) ?? trips[0]
  const navigate = useNavigate()
  
  const [disruption, setDisruption] = useState<'idle' | 'open' | 'accepted'>('idle')
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [weatherAlert, setWeatherAlert] = useState<DisruptionProposal | null>(null)
  const [fix, setFix] = useState<UserFix | null>(null)

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

  const next = useMemo(() => {
    if (!current)
      return nodes.find((node) => node.status === 'upcoming' || node.status === 'alternative') ?? null
    const index = nodes.findIndex((node) => node.id === current.id)
    return nodes.slice(index + 1).find((node) => node.status !== 'visited' && node.status !== 'disrupted') ?? null
  }, [nodes, current])

  const nextPin = next ? seedLookup(next.city) ?? seedLookup(next.title) : null
  const nextKm = fix && nextPin ? haversineKm(fix, nextPin) : null

  if (!trip || !nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="font-display text-2xl text-[var(--color-charcoal)] mb-4">Trip not ready</p>
        <Button type="button" onClick={() => navigate('/traveler/plan')}>Plan this trip</Button>
      </div>
    )
  }

  const simulate = () => {
    applyLiveReroute(trip.id, current?.id ?? next?.id ?? trip.nodes[0].id, 'stage')
    setDisruption('open')
    const fake = simulationSignal(current?.id ?? next?.id ?? trip.nodes[0].id)
    pushToast({ title: fake.title, body: fake.body })
  }

  const accept = () => {
    applyLiveReroute(trip.id, current?.id ?? next?.id ?? trip.nodes[0].id, 'accept')
    setDisruption('accepted')
  }

  const keep = () => {
    keepLivePlan(trip.id)
    setDisruption('idle')
    pushToast({ title: 'Original plan kept', body: 'Baga water sports stays on the live path.' })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 animate-in fade-in duration-500">
      {/* Editorial Header */}
      <div className="text-center space-y-3 pt-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <p className="meta tracking-[0.2em] text-red-600 font-bold">YOU'RE ON THE MOVE</p>
        </div>
        <h1 className="font-display text-5xl md:text-7xl text-[var(--color-charcoal)] font-medium tracking-tight">
          {current?.city ?? 'Goa'} <span className="text-[var(--color-muted-gold)] font-serif italic">· Day {liveDay(trip)}</span>
        </h1>
      </div>

      {/* Disruption Alert / Recovery Flow */}
      {weatherAlert && disruption === 'idle' ? (
        <div className="bg-[var(--color-charcoal)] text-white rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-red-900/20" />
          <div className="relative z-10 text-center space-y-6">
            <TriangleAlert className="h-10 w-10 text-red-400 mx-auto" />
            <h2 className="font-display text-3xl font-medium">WEATHER CHANGE</h2>
            <p className="text-lg text-white/90">
              {weatherAlert.signal.title}.<br />
              Your {current?.title ?? 'next visit'} may be affected.
            </p>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm tracking-[0.1em] text-[var(--color-muted-gold)] uppercase mb-6">VoyageOS found a better sequence.</p>
              <Button type="button" className="bg-white text-[var(--color-charcoal)] hover:bg-[var(--color-warm-ivory)] px-8 py-3 rounded-full font-bold" onClick={simulate}>
                REVIEW NEW PLAN
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {disruption === 'open' ? (
        <div className="bg-[var(--color-charcoal)] text-white rounded-[2rem] p-8 md:p-10 shadow-2xl">
          <div className="text-center space-y-8">
            <div>
              <h2 className="font-display text-3xl font-medium mb-2">YOUR JOURNEY CHANGED</h2>
              <p className="text-lg text-red-400">Weather disruption near Baga Beach.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 p-6 rounded-2xl border border-white/10 hover:bg-white/20 transition cursor-pointer" onClick={accept}>
                <p className="meta text-[var(--color-muted-gold)] mb-2">OPTION A</p>
                <p className="font-sans text-xl font-medium mb-4">Replace activity</p>
                <div className="space-y-1 text-sm text-white/80">
                  <p>+ ₹850 additional cost</p>
                  <p>45 min saved</p>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer" onClick={keep}>
                <p className="meta text-white/50 mb-2">OPTION B</p>
                <p className="font-sans text-xl font-medium mb-4 text-white/80">Keep original plan</p>
                <div className="space-y-1 text-sm text-red-400/80">
                  <p>High timing risk</p>
                  <p>High weather risk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {disruption === 'accepted' ? (
        <div className="bg-[var(--color-ocean)] text-white rounded-[2rem] p-8 md:p-10 shadow-2xl text-center">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-muted-gold)] mx-auto mb-4" />
          <h2 className="font-display text-3xl font-medium mb-2">JOURNEY RECOVERED</h2>
          <p className="text-lg text-white/90">
            Indoor food is now on the live path.
          </p>
          <div className="mt-8 flex justify-center gap-8 text-sm font-medium tracking-wide text-white/80">
            <span>5 activities preserved</span>
            <span>₹850 additional cost</span>
            <span>45 min recovered</span>
          </div>
        </div>
      ) : null}

      <LiveMap nodes={nodes} current={current} next={next} selectedId={current?.id ?? next?.id} userLocation={fix} />

      {/* Up Next & Weather */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[var(--color-soft-sand)]">
          <p className="meta tracking-widest mb-6">NEXT</p>
          <div className="space-y-2 mb-8">
            <h3 className="font-display text-4xl text-[var(--color-charcoal)]">{next?.time ?? '16:30'}</h3>
            <p className="font-sans text-xl font-medium text-[var(--color-warm-brown)]">{next?.title ?? 'Fort Aguada'}</p>
            <p className="text-sm font-medium text-[var(--color-charcoal)]/50 flex items-center gap-1 mt-2">
              <Navigation className="h-4 w-4" /> {nextKm ? `${formatDistance(nextKm * 1000)} away` : '12 min away'}
            </p>
          </div>
          <Button type="button" className="w-full bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-charcoal)]/90 rounded-full"
            onClick={async () => {
              if (!fix) {
                const once = await requestOnce().catch(() => null)
                setFix(once)
              }
            }}
          >
            Navigate
          </Button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[var(--color-soft-sand)] flex flex-col justify-between">
          <p className="meta tracking-widest mb-6">WEATHER</p>
          <div className="flex items-center gap-6">
            <h4 className="font-display text-7xl text-[var(--color-charcoal)] leading-none">
              {weather ? `${weather.temperatureC}°` : '29°'}
            </h4>
            {weather && weather.precipitationProbability > 50 ? (
              <CloudRain className="h-12 w-12 text-[var(--color-ocean)]" />
            ) : (
              <CloudSun className="h-12 w-12 text-[var(--color-muted-gold)]" />
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--color-soft-sand)]">
            <p className="font-medium text-[var(--color-warm-brown)] text-lg">
              {weatherAlert ? 'Rain possible at 18:00' : (weather?.condition ?? 'Partly cloudy')}
            </p>
          </div>
        </div>
      </div>

      {/* Live Timeline */}
      <div className="pt-8">
        <h3 className="section-title text-center mb-12">LIVE JOURNEY</h3>
        <div className="max-w-2xl mx-auto space-y-6">
          {nodes.filter(n => n.status !== 'alternative' && n.status !== 'disrupted').map((node, i, arr) => (
            <div key={node.id} className="flex gap-6 items-start group">
              <div className="flex flex-col items-center relative mt-1">
                {node.status === 'visited' ? (
                  <div className="h-6 w-6 rounded-full bg-[var(--color-muted-gold)] flex items-center justify-center z-10">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : node.status === 'active' ? (
                  <div className="h-6 w-6 rounded-full bg-[var(--color-ocean)] border-[4px] border-[var(--color-surface)] z-10 shadow-sm flex items-center justify-center">
                     <ArrowRight className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--color-soft-sand)] bg-white z-10 my-1" />
                )}
                {i < arr.length - 1 && (
                  <div className="absolute top-6 bottom-[-24px] w-[2px] bg-[var(--color-soft-sand)]" />
                )}
              </div>
              
              <div className={`flex-1 pb-6 ${node.status === 'visited' ? 'opacity-50' : ''}`}>
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="font-sans text-xl font-medium text-[var(--color-charcoal)]">{node.title}</h4>
                  <span className="font-display text-lg text-[var(--color-warm-brown)]">{node.time}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-charcoal)]/60">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {node.city}</span>
                </div>
                
                {node.status === 'active' && (
                  <Button type="button" variant="outline" size="sm" className="mt-4 rounded-full border-[var(--color-soft-sand)] text-[var(--color-ocean)]"
                    onClick={() => {
                      markNodeVisited(trip.id, node.id)
                      pushToast({ title: 'Marked as visited', body: `${node.title} closed.` })
                    }}
                  >
                    Mark as Visited
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

