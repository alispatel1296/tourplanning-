import { useEffect, useMemo, useState } from 'react'
import { Hotel, LoaderCircle, MapPin, Sparkles, UtensilsCrossed, Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CoverImage } from '@/components/ui/CoverImage'
import { Modal } from '@/components/ui/Overlay'
import { formatINR, cn } from '@/lib/cn'
import { requestOnce } from '@/services/location/location'
import { reverseGeocode } from '@/services/geo/geocode'
import {
  categoryFor,
  searchNearbyStops,
  slotAfter,
  type NearbyStop,
  type PriceOption,
  type StopKind,
} from '@/pages/traveler/flow/nearbyStops'
import type { TripNode } from '@/types'

const TABS: { id: 'all' | StopKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'activity', label: 'Places' },
  { id: 'stay', label: 'Hotels' },
  { id: 'food', label: 'Restaurants' },
]

const KIND_ICON = {
  stay: Hotel,
  food: UtensilsCrossed,
  activity: Waves,
}

export function AddStopModal({
  open,
  after,
  onClose,
  onAdd,
}: {
  open: boolean
  after: TripNode | null
  onClose: () => void
  onAdd: (node: Partial<TripNode> & Pick<TripNode, 'title' | 'category'>) => void
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [stops, setStops] = useState<NearbyStop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [nearMe, setNearMe] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab('all')
    setPicked({})
    setNearMe(false)
    setCity(after?.city ?? '')
  }, [open, after?.id, after?.city])

  const focusCity = city || after?.city || ''

  useEffect(() => {
    if (!open || !focusCity) return
    let cancelled = false
    setLoading(true)
    setError(null)
    searchNearbyStops(focusCity, after?.lat, after?.lng)
      .then((items) => {
        if (!cancelled) setStops(items)
      })
      .catch(() => {
        if (!cancelled) setError('Nearby search is delayed. Showing a local shortlist.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, focusCity, after?.lat, after?.lng])

  const visible = useMemo(() => (tab === 'all' ? stops : stops.filter((item) => item.kind === tab)), [stops, tab])

  const useMyLocation = async () => {
    try {
      const fix = await requestOnce()
      const geo = await reverseGeocode(fix.lat, fix.lng)
      const nextCity = geo?.city || after?.city || city
      setNearMe(true)
      setCity(nextCity)
    } catch {
      setError('Location permission is off. Searching near this hop instead.')
      setNearMe(false)
    }
  }

  const add = (stop: NearbyStop, option: PriceOption) => {
    onAdd({
      title: stop.name,
      category: categoryFor(stop.kind),
      city: stop.city || city,
      time: slotAfter(after),
      cost: option.cost,
      notes: `${option.label} · ${option.note}. Added from nearby search in ${city}.`,
      lat: stop.lat,
      lng: stop.lng,
      placeId: stop.id,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add a stop in ${focusCity || 'this city'}`} wide>
      <p className="text-sm text-slate-600">
        {nearMe ? 'Using your live location.' : `Near ${after?.title ?? 'this hop'} · ${focusCity}.`}
        {' '}Pick a hotel, restaurant, or place and a price. It drops onto the green path after this card.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
              tab === item.id ? 'bg-[var(--color-charcoal)] text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {item.label}
          </button>
        ))}
        <Button type="button" size="sm" variant="secondary" onClick={() => void useMyLocation()}>
          <MapPin className="mr-1 h-3.5 w-3.5" />
          Near me
        </Button>
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Searching live hotels, kitchens, and places…
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-amber-800">{error}</p> : null}

      <div className="mt-4 grid max-h-[58vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {visible.map((stop) => {
          const Icon = KIND_ICON[stop.kind]
          const selected = stop.options.find((option) => option.id === (picked[stop.id] ?? 'standard')) ?? stop.options[1] ?? stop.options[0]
          return (
            <article key={stop.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <div className="h-28 bg-slate-800">
                <CoverImage src={stop.image ?? ''} alt={stop.name} />
              </div>
              <div className="space-y-2 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Icon className="h-3.5 w-3.5" />
                  {stop.kind === 'stay' ? 'Hotel' : stop.kind === 'food' ? 'Restaurant' : 'Place'}
                  {stop.rating ? ` · ${stop.rating.toFixed(1)}` : ''}
                  {stop.source === 'live' ? ' · live' : ''}
                </p>
                <p className="font-display text-lg leading-tight text-ink">{stop.name}</p>
                <p className="line-clamp-2 text-[12px] text-slate-500">{stop.address ?? stop.city}</p>
                <div className="flex flex-wrap gap-1.5">
                  {stop.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPicked((current) => ({ ...current, [stop.id]: option.id }))}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                        selected?.id === option.id
                          ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-white'
                          : 'border-line text-slate-600',
                      )}
                    >
                      {option.label} · {option.cost ? formatINR(option.cost) : 'Free'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">{selected?.note}</p>
                <Button type="button" size="sm" className="w-full" onClick={() => selected && add(stop, selected)}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Add to this day
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      {!loading && !visible.length ? (
        <p className="mt-6 text-sm text-slate-500">No nearby matches yet. Try Near me, or add a stop after another city card.</p>
      ) : null}
    </Modal>
  )
}
