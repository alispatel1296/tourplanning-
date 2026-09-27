import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ArrowRight, MapPin, Radio, Sparkles } from 'lucide-react'
import { MapPanel } from '@/components/domain/MapPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { places, suggestedPlaces } from '@/lib/plan'
import { liveDay } from '@/pages/traveler/live/model'
import { cn } from '@/lib/cn'
import { useAppState } from '@/state/AppState'
import type { Trip } from '@/types'

const CITY_COVER: Record<string, string> = {
  mumbai: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2d4c?auto=format&fit=crop&w=1200&q=70',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70',
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70',
  kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70',
  munnar: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=70',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=70',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=70',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=70',
  rishikesh: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=70',
  pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  puducherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=70',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=70',
  hampi: 'https://images.unsplash.com/photo-1600100397676-0c25363d389d?auto=format&fit=crop&w=1200&q=70',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=70',
  udaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70',
  shimla: 'https://images.unsplash.com/photo-1597074866923-dc058de18517?auto=format&fit=crop&w=1200&q=70',
  ahmedabad: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=70',
}

function coverFor(trip: Trip) {
  const cities = [...trip.destinations.map((item) => item.city), trip.origin.city, ...trip.route.split(/→|,/).map((part) => part.trim())]
  for (const city of cities) {
    const match = CITY_COVER[city.toLowerCase()]
    if (match) return match
    const place = places.find((item) => item.name.toLowerCase() === city.toLowerCase())
    if (place?.image) return place.image
  }
  return CITY_COVER.goa
}

function currentNode(trip: Trip) {
  return trip.nodes.find((node) => node.status === 'active') ?? trip.nodes.find((node) => node.status === 'upcoming') ?? null
}

export function TravelerExplore() {
  const navigate = useNavigate()
  const { trips, plan, savePlan } = useAppState()
  const ongoing = useMemo(() => trips.filter((trip) => trip.status === 'live'), [trips])
  const [selectedId, setSelectedId] = useState(ongoing[0]?.id ?? '')
  const selected = ongoing.find((trip) => trip.id === selectedId) ?? ongoing[0] ?? null
  const now = selected ? currentNode(selected) : null
  const mapNodes = selected?.nodes.filter((node) => node.status !== 'alternative') ?? []

  return (
    <div className="space-y-10">
      <PageHeader
        title="Explore"
        description={`${ongoing.length} live circuits on the map. Open one that is already moving, or start a new corridor.`}
        actions={
          <Button type="button" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate('/traveler/plan')}>
            New journey
          </Button>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted-gold)]">On the move</p>
                <h2 className="font-display text-3xl text-ink">Ongoing circuits</h2>
              </div>
              <Badge tone="success">{ongoing.length} live</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ongoing.map((trip) => {
                const active = currentNode(trip)
                const days = Math.max(1, differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1)
                const day = liveDay(trip)
                const isOn = selected?.id === trip.id
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => setSelectedId(trip.id)}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                      isOn ? 'border-[var(--color-charcoal)] ring-2 ring-[var(--color-charcoal)]/10' : 'border-line',
                    )}
                  >
                    <div className="relative h-40">
                      <img src={coverFor(trip)} alt={trip.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Live
                      </span>
                      <div className="absolute inset-x-3 bottom-3 text-white">
                        <p className="font-display text-2xl leading-none">{trip.title}</p>
                        <p className="mt-1 text-xs font-medium text-white/80">{trip.route}</p>
                      </div>
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-sm font-semibold text-ink">
                        Day {day} of {days}
                        {active ? ` · ${active.city}` : ''}
                      </p>
                      <p className="line-clamp-2 text-sm text-slate-500">{active ? `${active.time} · ${active.title}` : 'Circuit in motion'}</p>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-slate-400">
                        {format(parseISO(trip.startDate), 'd MMM')} – {format(parseISO(trip.endDate), 'd MMM')}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted-gold)]">Plan next</p>
              <h2 className="font-display text-3xl text-ink">New destinations</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => {
                    savePlan({
                      ...plan,
                      destinations: [place.name],
                      origin: plan.origin || 'Ahmedabad',
                    })
                    navigate('/traveler/plan')
                  }}
                >
                  <img src={place.image} alt={place.name} className="h-32 w-full object-cover" />
                  <div className="p-4">
                    <p className="font-display text-xl text-ink">{place.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{place.tagline}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <MapPanel
            title={selected?.title ?? 'Live corridors'}
            caption={selected?.route ?? 'Select a circuit'}
            nodes={mapNodes}
            selectedId={now?.id}
            height={420}
          />
          {selected ? (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Selected circuit</p>
              <p className="mt-2 font-display text-2xl text-ink">{selected.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {selected.route}
              </p>
              {now ? (
                <p className="mt-3 text-sm font-medium text-ink">
                  Now · {now.city} · {now.title}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-2">
                <Button type="button" icon={<Radio className="h-4 w-4" />} onClick={() => navigate(`/traveler/live/${selected.id}`)}>
                  Open live companion
                </Button>
                <Button type="button" variant="secondary" icon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate(`/traveler/trips/${selected.id}`)}>
                  Open itinerary
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
