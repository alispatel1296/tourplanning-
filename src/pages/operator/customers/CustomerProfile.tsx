import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { AIInsightCard } from '@/components/domain/AICards'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import { Users } from 'lucide-react'
import { crmProfiles } from '@/pages/operator/customers/crm'
import { loadTours, persistTours, type ManagedTour } from '@/pages/operator/tours/catalog'

export function CustomerProfile() {
  const { id } = useParams()
  const { pushToast } = useAppState()
  const navigate = useNavigate()
  const person = crmProfiles().find((item) => item.id === id)
  const [message, setMessage] = useState(false)
  const [note, setNote] = useState('')
  const [history, setHistory] = useState(false)

  if (!person) {
    return (
      <EmptyState
        icon={<Users className="h-5 w-5" />}
        title="Traveler not on file"
        body="Open the CRM table and pick a name."
        action={<Button type="button" onClick={() => navigate('/operator/customers')}>Customer CRM</Button>}
      />
    )
  }

  const customize = () => {
    const tours = loadTours()
    const next: ManagedTour = {
      id: `op-${person.id}-${crypto.randomUUID().slice(0, 4)}`,
      code: `TF-CUS-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      name: `Custom circuit · ${person.city}`,
      party: `${person.name} · FIT`,
      route: `${person.city} → ${person.favorites[0] ?? 'Goa'}`,
      destination: person.favorites[0] ?? 'Goa',
      start: '2026-11-14',
      end: '2026-11-18',
      dates: '14–18 Nov 2026',
      budget: 48000,
      spent: 0,
      status: 'planning',
      coordinator: 'Riya',
      alert: '',
      pax: 2,
      travelerId: person.id,
      notes: `Built from ${person.name}'s CRM file.`,
    }
    persistTours([next, ...tours])
    pushToast({ title: 'Custom trip opened', body: `${next.code} is in Tour management · Planning.` })
    navigate(`/operator/tours/${next.id}`)
  }

  return (
    <div>
      <PageHeader
        title={person.name}
        description={`${person.home} · ${person.trips} trips on file`}
        crumbs={[
          { label: 'Customers', to: '/operator/customers' },
          { label: person.name },
        ]}
        actions={<StatusBadge status={person.status} />}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Button type="button" onClick={customize}>Create customized trip</Button>
        <Button type="button" variant="secondary" onClick={() => setMessage(true)}>
          Send message
        </Button>
        <Button type="button" variant="outline" onClick={() => setHistory(true)}>
          View history
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar initials={person.initials} name={person.name} />
              <div>
                <p className="card-title">Personal info</p>
                <p className="meta">{person.email} · {person.phone}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{person.home}</p>
          </Card>

          <Card>
            <p className="card-title">Travel preferences</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {person.styles.map((style) => (
                <Badge key={style} tone="info">
                  {style}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-sm">Stay · {person.stay}</p>
            <p className="mt-1 text-sm text-slate-600">{person.preferences}</p>
          </Card>

          <Card>
            <p className="card-title">Past trips</p>
            <div className="mt-3 space-y-2">
              {person.pastTrips.map((trip) => (
                <div key={trip.name} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{trip.name}</p>
                    <p className="meta">{trip.dates}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatINR(trip.spend)}</p>
                    <StatusBadge status={trip.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="card-title">Booking history</p>
            <div className="mt-3 space-y-2">
              {person.bookings.length ? (
                person.bookings.map((booking) => (
                  <div key={booking.item} className="flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{booking.item}</p>
                      <p className="meta">{booking.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(booking.amount)}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No inventory on file yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <AIInsightCard title="AI profile summary" body={person.aiSummary} confidence={0.87} />
          <Card>
            <p className="card-title">Budget patterns</p>
            <p className="mt-2 text-sm text-slate-600">{person.budgetPattern}</p>
            <p className="mt-3 font-display text-2xl font-semibold">{formatINR(person.spend)}</p>
            <p className="meta">Lifetime on Horizon Trails</p>
          </Card>
          <Card>
            <p className="card-title">Favorite destinations</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {person.favorites.map((place) => (
                <Badge key={place}>{place}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={message} onClose={() => setMessage(false)} title={`Message ${person.name}`}>
        <p className="text-sm text-slate-600">Desk note only — nothing is emailed from this workspace.</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-3 min-h-28 w-full rounded-lg border border-line p-3 text-sm"
          placeholder="Hold the Palolem morning if the swell warning stands…"
        />
        <Button
type="button"           className="mt-3"
          onClick={() => {
            setMessage(false)
            pushToast({ title: 'Message queued', body: `A desk note is on ${person.name}'s file. Simulated.` })
            setNote('')
          }}
        >
          Send
        </Button>
      </Modal>

      <Modal open={history} onClose={() => setHistory(false)} title="Trip history" wide>
        <div className="space-y-2">
          {person.pastTrips.map((trip) => (
            <div key={trip.name} className="rounded-xl border border-line px-3 py-3">
              <p className="text-sm font-semibold">{trip.name}</p>
              <p className="meta">{trip.dates} · {formatINR(trip.spend)} · {trip.status}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
