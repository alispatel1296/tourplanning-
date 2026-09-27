import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloudSun,
  Train,
  ArrowRight,
  Sun,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  Mic,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import { defaultPlan, persistPlan, tripDuration } from '@/lib/plan'
import { VoicePanel, VOICE_SAMPLE } from '@/pages/traveler/plan/VoicePanel'
import { composeTrip } from '@/services/travel/TravelDataService'
import { getCurrentWeather } from '@/services/weather/weather'
import { seedLookup } from '@/services/geo/seeds'
import type { WeatherNow } from '@/services/geo/types'
import type { TripPlan } from '@/types/plan'

export function TravelerDashboard() {
  const { user, plan, savePlan, generateItinerary } = useAppState()
  const trip = usePrimaryTrip()
  const navigate = useNavigate()
  const [voice, setVoice] = useState(false)

  const generateFromVoice = (patch: Partial<TripPlan>) => {
    const next = { ...(plan ?? defaultPlan), ...patch }
    savePlan(next)
    persistPlan(next)
    generateItinerary(next)
    sessionStorage.removeItem('tf-itin-ready')
    sessionStorage.removeItem('tf-trip-compose')
    const duration = tripDuration(next)
    void composeTrip({
      origin: next.origin,
      destination: next.destinations[next.destinations.length - 1],
      interests: next.styles,
      budget: next.budget,
      duration: duration.days,
      adults: next.adults,
      startDate: next.startDate,
      endDate: next.endDate,
      brief: next.brief,
    })
      .then((result) => sessionStorage.setItem('tf-trip-compose', JSON.stringify(result)))
      .catch(() => sessionStorage.removeItem('tf-trip-compose'))
    setVoice(false)
    navigate('/traveler/itinerary', { state: { generate: true } })
  }

  const [goaWx, setGoaWx] = useState<WeatherNow | null>(null)

  useEffect(() => {
    const pin = seedLookup('Goa')
    if (pin) {
      getCurrentWeather(pin.lat, pin.lng).then(setGoaWx).catch(console.error)
    }
  }, [])

  const firstName = user?.name.split(' ')[0] ?? 'Traveler'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-10 pb-12"
    >
      {/* Cinematic Hero - Editorial Style */}
      <div 
        className="relative overflow-hidden rounded-[2rem] bg-[var(--color-charcoal)] shadow-2xl group cursor-pointer min-h-[520px] flex flex-col border border-[var(--color-surface)]"
        onClick={() => navigate('/traveler/itinerary')}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2874&auto=format&fit=crop')] bg-cover bg-center opacity-80 transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[var(--color-charcoal)]/95" />
        
        <div className="relative z-10 flex flex-col justify-between h-full flex-1 p-8 md:p-12">
          {/* Top Bar inside Hero */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-sans text-xs font-bold tracking-[0.2em] text-[var(--color-muted-gold)] uppercase">
                Good Morning, {firstName.toUpperCase()}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-white">Your next journey</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white border border-white/20 shadow-sm">
                6 Days · 2 Travelers
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-black/20">
                <ShieldCheck className="h-3 w-3 text-[var(--color-muted-gold)]" />
                Trip readiness 86%
              </span>
            </div>
          </div>
          
          {/* Bottom Hero Content */}
          <div className="mt-20 flex flex-col justify-end h-full">
            <p className="font-sans text-sm font-semibold tracking-[0.2em] text-[var(--color-muted-gold)] uppercase mb-3 drop-shadow-md">
              The West Coast Circuit
            </p>
            <h2 className="font-display text-6xl md:text-[7rem] font-medium tracking-tight text-white mb-6 leading-none drop-shadow-lg">
              GOA
            </h2>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-white/10 pt-6">
              <div>
                <p className="font-sans text-lg font-bold tracking-wider text-white uppercase flex items-center gap-3 mb-2">
                  Ahmedabad <ArrowRight className="h-4 w-4 text-[var(--color-muted-gold)]" /> Mumbai <ArrowRight className="h-4 w-4 text-[var(--color-muted-gold)]" /> Goa
                </p>
                <p className="font-display text-2xl text-white/80">
                  15–21 October 2026
                </p>
              </div>
              
              <Button type="button"
                className="bg-white text-[var(--color-charcoal)] hover:bg-[var(--color-soft-sand)] font-bold px-8 py-3 rounded-full shadow-xl transition-all hover:scale-105"
                onClick={(e) => { e.stopPropagation(); navigate('/traveler/itinerary'); }}
              >
                Open journey <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_340px] gap-8">
        {/* Left Column: Route / Glace */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] p-8 border-2 border-[var(--color-surface)] shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="section-title text-[var(--color-charcoal)]">Route Overview</h3>
              <span className="text-sm font-bold text-[var(--color-charcoal)]/40 uppercase tracking-widest">At a glance</span>
            </div>
            
            <div className="relative">
              {/* Route Line Connector */}
              <div className="absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-[var(--color-surface)] hidden md:block" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Node 1 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-muted-gold)] border-[6px] border-white relative z-10 mb-4 shadow-sm ring-1 ring-[var(--color-surface)]" />
                  <p className="meta mb-2 text-[var(--color-muted-gold)]">15 OCT</p>
                  <h4 className="font-display text-2xl font-bold text-[var(--color-charcoal)] mb-1">Ahmedabad</h4>
                </div>
                
                {/* Node 2 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-charcoal)] border-[6px] border-white relative z-10 mb-4 shadow-sm ring-1 ring-[var(--color-surface)]" />
                  <p className="meta mb-2">17 OCT</p>
                  <h4 className="font-display text-2xl font-bold text-[var(--color-charcoal)] mb-1">Mumbai</h4>
                  <p className="text-[13px] font-semibold text-[var(--color-charcoal)]/50">Vande Bharat Express</p>
                </div>

                {/* Node 3 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 border-[6px] border-white relative z-10 mb-4 shadow-sm ring-1 ring-[var(--color-surface)]" />
                  <p className="meta mb-2">21 OCT</p>
                  <h4 className="font-display text-2xl font-bold text-[var(--color-charcoal)] mb-1">Goa</h4>
                  <p className="text-[13px] font-semibold text-[var(--color-charcoal)]/50">Caravela Beach Resort</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          <button
            type="button"
            className="w-full rounded-[2rem] border border-brand-100 bg-white p-6 text-left shadow-sm transition hover:border-brand-200"
            onClick={() => setVoice(true)}
          >
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-800">
              <Mic className="h-3.5 w-3.5" />
              Speak a trip
            </p>
            <p className="mt-2 font-display text-2xl text-[var(--color-charcoal)]">Say the route. Get the itinerary.</p>
            <p className="mt-1 text-sm text-slate-600">“{VOICE_SAMPLE}”</p>
          </button>

          {/* Up Next Widget */}
          <div className="bg-[var(--color-charcoal)] text-white rounded-[2rem] p-8 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-white/5">
              <Train className="h-40 w-40" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--color-muted-gold)] uppercase mb-6">Up Next</p>
              <div className="mb-8">
                <p className="font-display text-5xl mb-2">06:10</p>
                <p className="text-[15px] font-medium text-white/70">Vande Bharat Express</p>
              </div>
              <div className="flex items-center gap-3 text-[14px] font-bold uppercase tracking-wider mb-8 text-[var(--color-muted-gold)]">
                Ahmedabad <ArrowRight className="h-4 w-4 text-white/40" /> Mumbai
              </div>
              <Button type="button" className="w-full rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 font-bold" onClick={() => navigate('/traveler/itinerary')}>
                View ticket details
              </Button>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-[2rem] border border-sky-100 bg-sky-50 p-6 text-left shadow-sm transition hover:border-sky-200"
            onClick={() => navigate(`/traveler/twin/${trip.id}`)}
          >
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-800">
              <CloudSun className="h-3.5 w-3.5" />
              Auto replan · rain & shock
            </p>
            <p className="mt-2 font-display text-2xl text-[var(--color-charcoal)]">High rain rewrites from that day</p>
            <p className="mt-1 text-sm text-slate-600">
              Twin detects a wet cell, shows hop swaps and budget change, then you apply. Same panel on Twin, Predict, and Live.
            </p>
          </button>

          <button
            type="button"
            className="w-full rounded-[2rem] border border-rose-100 bg-rose-50 p-6 text-left shadow-sm transition hover:border-rose-200"
            onClick={() => navigate(`/traveler/predict/${trip.id}`)}
          >
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              USP · Predictive emergency
            </p>
            <p className="mt-2 font-display text-2xl text-[var(--color-charcoal)]">Score the next shock</p>
            <p className="mt-1 text-sm text-slate-600">
              Nowcast, cascade, and social Bayes on {trip.title} — before the live companion feels it.
            </p>
          </button>

          {/* Weather & Readiness */}
          <div className="bg-white rounded-[2rem] p-6 border-2 border-[var(--color-surface)] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--color-charcoal)]/40 uppercase mb-1">Weather · Goa</p>
                <div className="flex items-center gap-3">
                  <h4 className="font-display text-4xl font-bold text-[var(--color-charcoal)]">
                    {goaWx ? `${goaWx.temperatureC}°` : '28°'}
                  </h4>
                  {goaWx && goaWx.precipitationProbability > 50 ? (
                    <CloudSun className="h-8 w-8 text-[var(--color-ocean)]" />
                  ) : (
                    <Sun className="h-8 w-8 text-[var(--color-muted-gold)]" />
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold text-[var(--color-charcoal)]/60">
                  {goaWx ? goaWx.condition : 'Partly cloudy'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-[2rem] p-6 border border-white shadow-sm flex items-center justify-between">
            <span className="text-[13px] font-bold uppercase tracking-wider text-[var(--color-charcoal)]">Budget</span>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-[var(--color-charcoal)]">{formatINR(Math.max(0, trip.budget - trip.spent))}</span>
              <span className="text-[11px] font-bold text-[var(--color-charcoal)]/40 uppercase tracking-widest block">remaining</span>
            </div>
          </div>
        </div>
      </div>

      <VoicePanel
        open={voice}
        onClose={() => setVoice(false)}
        onApply={(patch) => savePlan({ ...(plan ?? defaultPlan), ...patch })}
        onGenerate={generateFromVoice}
      />
    </motion.div>
  )
}
