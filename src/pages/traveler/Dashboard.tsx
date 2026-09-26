import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  CalendarDays,
  CloudSun,
  Compass,
  IndianRupee,
  Layers,
  MapPin,
  Radio,
  Sparkles,
  ShieldCheck,
  Waypoints,
  ArrowUpRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, MetricCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AIInsightCard } from '@/components/domain/AICards'
import { BudgetMeter } from '@/components/domain/OperationalCards'
import { MapPanel } from '@/components/domain/MapPanel'
import { TripSummaryCard } from '@/components/domain/EntityCards'
import { travelerInsights } from '@/data/demo'
import { weatherStrip } from '@/pages/traveler/carry/catalog'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { formatDate, formatINR } from '@/lib/cn'
import { getCurrentWeather } from '@/services/weather/weather'
import { seedLookup } from '@/services/geo/seeds'
import type { WeatherNow } from '@/services/geo/types'

export function TravelerDashboard() {
  const { user, trips } = useAppState()
  const trip = usePrimaryTrip()
  const navigate = useNavigate()

  const [liveWx, setLiveWx] = useState<Array<{ city: string; now: WeatherNow | null; note: string }>>(
    weatherStrip.map((row: { city: string; note: string }) => ({ city: row.city, now: null, note: row.note })),
  )

  useEffect(() => {
    void Promise.all(
      weatherStrip.map(async (row: { city: string; note: string }) => {
        const pin = seedLookup(row.city)
        if (!pin) return { city: row.city, now: null, note: row.note }
        try {
          const now = await getCurrentWeather(pin.lat, pin.lng)
          return {
            city: row.city,
            now,
            note:
              now.precipitationProbability >= 50
                ? `Rain chance ${now.precipitationProbability}%. Compact rain layer recommended.`
                : row.note,
          }
        } catch {
          return { city: row.city, now: null, note: row.note }
        }
      }),
    ).then(setLiveWx)
  }, [])

  const firstName = user?.name.split(' ')[0] ?? 'Traveler'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Page Header */}
      <PageHeader
        eyebrow="Traveler Workspace"
        title={`Welcome back, ${firstName}`}
        description={`${trip.route} circuit is ${trip.feasibility}% feasible for ${formatDate(trip.startDate)} – ${formatDate(trip.endDate, 'long')}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button"
              variant="secondary"
              icon={<Layers className="h-4 w-4 text-brand-700" />}
              onClick={() => navigate('/traveler/plan/build')}
            >
              Hop-by-Hop Builder
            </Button>
            <Button type="button"
              variant="secondary"
              icon={<Briefcase className="h-4 w-4" />}
              onClick={() => navigate('/traveler/carry')}
            >
              What to Carry
            </Button>
            <Button type="button"
              variant="primary"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={() => navigate('/traveler/plan')}
            >
              AI Trip Planner
            </Button>
          </div>
        }
      />

      {/* Hero CTA Card */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-900 via-brand-850 to-slate-900 p-6 text-white shadow-lg">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-400/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-200 border border-brand-400/30">
                <Sparkles className="h-3 w-3" />
                Interactive Workflow Engine
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Feasibility Twin Active
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Design & Customize Your Hop-by-Hop Journey
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Place train hops, hotel holds, eateries, and activities node by node. Set primary green paths versus yellow alternatives and commit them directly to your live companion.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button"
              size="lg"
              className="bg-white text-brand-950 hover:bg-slate-100 font-semibold"
              icon={<Compass className="h-4.5 w-4.5" />}
              onClick={() => navigate('/traveler/plan/build')}
            >
              Launch Workflow Builder
            </Button>
            <Button type="button"
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10"
              icon={<ArrowUpRight className="h-4.5 w-4.5" />}
              onClick={() => navigate('/traveler/itinerary')}
            >
              View Full Itinerary
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Next Departure"
          value="15 Oct · 06:10"
          hint="Vande Bharat 22925 from Ahmedabad Kalupur"
          icon={<CalendarDays className="h-5 w-5 text-brand-600" />}
          tone="info"
        />
        <MetricCard
          label="Budget Remaining"
          value={formatINR(Math.max(0, trip.budget - trip.spent))}
          hint={`${formatINR(trip.budget)} allocated for ${trip.adults} adults`}
          icon={<IndianRupee className="h-5 w-5 text-emerald-600" />}
          tone="success"
        />
        <MetricCard
          label="Circuit Feasibility"
          value={`${trip.feasibility}%`}
          hint="Novotel Candolim waitlist hold on review"
          icon={<Waypoints className="h-5 w-5 text-amber-600" />}
          tone="warning"
        />
      </div>

      {/* Main Grid: Interactive Leaflet Map & My Trips | AI Feeds & Weather */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-6 xl:col-span-2">
          {/* Real Leaflet Map Component */}
          <MapPanel
            title="Real-World Interactive Map & Corridor Route"
            caption={`${trip.route} · ${trip.nodes.length} connected stops with routing polylines`}
            nodes={trip.nodes}
            height={380}
          />

          {/* Active Circuits Header & List */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">My Active Circuits</h3>
                <p className="meta">Your active, planned, and completed journeys</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => navigate('/traveler/trips')}>
                View All ({trips.length})
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trips.map((item) => (
                <TripSummaryCard
                  key={item.id}
                  trip={item}
                  onOpen={() =>
                    navigate(
                      item.status === 'completed'
                        ? `/traveler/review/${item.id}`
                        : item.status === 'live'
                          ? `/traveler/live/${item.id}`
                          : `/traveler/trips/${item.id}`,
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Live Weather Forecast Feed */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="card-title flex items-center gap-1.5">
                <CloudSun className="h-4 w-4 text-amber-500" />
                Live Circuit Weather
              </h3>
              <Badge tone="info">Open-Meteo</Badge>
            </div>
            <div className="space-y-3 text-sm">
              {liveWx.map((row) => (
                <div key={row.city} className="flex items-center justify-between border-b border-line pb-2.5 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-ink flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {row.city}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{row.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-900">
                      {row.now ? `${row.now.temperatureC}°C` : '28°C'}
                    </p>
                    <p className="text-[11px] text-slate-500">{row.now?.condition ?? 'Sunny'}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button"
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              icon={<Radio className="h-3.5 w-3.5" />}
              onClick={() => navigate('/traveler/carry')}
            >
              Open Weather Packing Kit
            </Button>
          </Card>

          {/* Budget Health Meter */}
          <BudgetMeter spent={trip.spent} budget={trip.budget} />

          {/* AI Insights Feed */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-400">
              AI Intelligence Feed
            </h3>
            {travelerInsights.map((insight) => (
              <AIInsightCard
                key={insight.id}
                {...insight}
                onAction={() =>
                  navigate(insight.id === 'ai-2' ? '/traveler/itinerary' : '/traveler/prep')
                }
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
