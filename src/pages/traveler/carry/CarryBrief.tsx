import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudRain, CloudSun, Mic, Sparkles } from 'lucide-react'
import { getCurrentWeather } from '@/services/weather/weather'
import { seedLookup } from '@/services/geo/seeds'
import type { WeatherNow } from '@/services/geo/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { AILabel } from '@/components/domain/AICards'
import { dateRangeLabel, routeLabel } from '@/lib/plan'
import { listenOnce, speak } from '@/lib/speech'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { carryAdvice, weatherStrip } from '@/pages/traveler/carry/catalog'

export function CarryBrief() {
  const trip = usePrimaryTrip()
  const { plan, pushToast } = useAppState()
  const navigate = useNavigate()
  const groups = carryAdvice(plan)
  const [listening, setListening] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  const [liveWx, setLiveWx] = useState<Array<{ city: string; now: WeatherNow | null; note: string }>>(
    weatherStrip.map((row) => ({ city: row.city, now: null, note: row.note })),
  )

  useEffect(() => {
    void Promise.all(
      weatherStrip.map(async (row) => {
        const pin = seedLookup(row.city)
        if (!pin) return { city: row.city, now: null, note: row.note }
        try {
          const now = await getCurrentWeather(pin.lat, pin.lng)
          return {
            city: row.city,
            now,
            note:
              now.precipitationProbability >= 50
                ? `Rain chance ${now.precipitationProbability}%. Pack a compact rain layer.`
                : row.note,
          }
        } catch {
          return { city: row.city, now: null, note: `${row.note} · live weather unavailable` }
        }
      }),
    ).then(setLiveWx)
  }, [])

  const askVoice = async () => {
    setListening(true)
    const heard = await listenOnce('What should I carry for Goa weather?')
    setListening(false)
    setSaid(heard)
    const reply =
      'For this corridor: Aadhaar and PNRs on the phone, your usual medicines plus ORS, cotton clothes, walking shoes, one AC layer, and a compact rain layer for the Goa shower window.'
    speak(reply)
    pushToast({ title: 'Carry advice', body: reply })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Before the live graph"
        title="What to carry"
        description={`${routeLabel(plan)} · ${dateRangeLabel(plan)}. Credentials, medicine, and clothes for this weather — then we open the flow.`}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <AILabel />
        <Badge tone="info">Weather-aware</Badge>
        <Button type="button" size="sm" variant="outline" icon={<Mic className="h-3.5 w-3.5" />} loading={listening} onClick={askVoice}>
          Ask by voice
        </Button>
      </div>

      {said ? (
        <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">You: {said}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {liveWx.map((row) => (
          <Card key={row.city}>
            <p className="meta flex items-center gap-1.5">
              {row.now && row.now.precipitationProbability >= 50 ? (
                <CloudRain className="h-3.5 w-3.5" />
              ) : (
                <CloudSun className="h-3.5 w-3.5" />
              )}
              {row.city}
              {row.now ? <Badge tone="success">Live</Badge> : <Badge tone="warning">Cached</Badge>}
            </p>
            <p className="mt-1 font-semibold">
              {row.now ? `${row.now.condition} ${row.now.temperatureC}°C` : weatherStrip.find((item) => item.city === row.city)?.sky}
            </p>
            <p className="mt-1 text-sm text-slate-600">{row.note}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <p className="card-title">{group.title}</p>
            <p className="mt-1 text-sm text-slate-600">{group.why}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate(`/traveler/trips/${trip.id}`)}>
          Open trip flow
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/traveler/prep')}>
          Full prep checklist
        </Button>
      </div>
    </div>
  )
}
