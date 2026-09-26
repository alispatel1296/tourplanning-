import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/Feedback'
import { BookingCard } from '@/components/domain/EntityCards'
import { BudgetMeter } from '@/components/domain/OperationalCards'
import { useAppState } from '@/state/AppState'
import { assignmentsFor, findCoordinator, loadAssignments as loadDeskFiles } from '@/pages/operator/coordinators/catalog'
import { formatINR } from '@/lib/cn'
import { Briefcase } from 'lucide-react'
import { activityLog, itineraryFor, loadTours } from '@/pages/operator/tours/catalog'
import { loadAssignments, loadVendors } from '@/pages/operator/vendors/catalog'
import { crmProfiles } from '@/pages/operator/customers/crm'

type DetailTab = 'overview' | 'traveler' | 'itinerary' | 'budget' | 'bookings' | 'coordinator' | 'alerts' | 'log'

export function TourDetail() {
  const { id } = useParams()
  const { bookings, trips } = useAppState()
  const navigate = useNavigate()
  const tour = loadTours().find((item) => item.id === id)
  const [tab, setTab] = useState<DetailTab>('overview')
  const traveler = crmProfiles().find(
    (person) => person.id === tour?.travelerId || person.name === tour?.party.split('·')[0]?.trim(),
  )
  const desk = findCoordinator(tour?.coordinator ?? '')
  const deskFile = loadDeskFiles().find((row) => row.tourId === tour?.id)
  const liveNodes = trips.find((item) => item.id === 'trip-amd-goa')?.nodes
  const nodes = useMemo(() => (tour ? itineraryFor(tour, liveNodes) : []), [tour, liveNodes])
  const assignedVendors = useMemo(() => {
    if (!tour) return []
    const vendors = loadVendors()
    return loadAssignments()
      .filter((row) => row.tourId === tour.id)
      .map((row) => ({ row, vendor: vendors.find((item) => item.id === row.vendorId) }))
      .filter((item) => item.vendor)
  }, [tour])
  const tourBookings = bookings.filter((item) => item.travelerName === traveler?.name || (tour && item.tripId === 'trip-amd-goa' && tour.id === 'op-aarav'))

  if (!tour) {
    return (
      <EmptyState
        icon={<Briefcase className="h-5 w-5" />}
        title="Tour not found"
        body="That file is not on the current desk."
        action={<Button type="button" onClick={() => navigate('/operator/tours')}>Tour management</Button>}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={tour.name}
        description={`${tour.code} · ${tour.party} · ${tour.route}`}
        crumbs={[
          { label: 'Tours', to: '/operator/tours' },
          { label: tour.code },
        ]}
        actions={
          <>
            <StatusBadge status={tour.status} />
            <Button type="button" onClick={() => navigate(`/operator/coordinators/assign?tour=${tour.id}`)}>
              Assign Coordinator
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Trip overview' },
          { id: 'traveler', label: 'Traveler details' },
          { id: 'itinerary', label: 'Itinerary' },
          { id: 'budget', label: 'Budget' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'coordinator', label: 'Coordinator' },
          { id: 'alerts', label: 'Alerts' },
          { id: 'log', label: 'Activity log' },
        ]}
      />

      <div className="mt-5">
        {tab === 'overview' ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <p className="meta">Route</p>
              <p className="mt-1 font-semibold">{tour.route}</p>
              <p className="mt-3 text-sm text-slate-600">{tour.dates} · {tour.pax} pax</p>
              <p className="mt-2 text-sm text-slate-600">{tour.notes}</p>
            </Card>
            <Card>
              <p className="meta">Desk</p>
              <p className="mt-1 font-semibold">{tour.coordinator}</p>
              <p className="mt-3 text-sm">Budget {formatINR(tour.budget)} · spent {formatINR(tour.spent)}</p>
              {tour.alert ? <Badge tone="danger" className="mt-3">{tour.alert}</Badge> : <p className="meta mt-3">No open alert</p>}
            </Card>
            <Card className="md:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="card-title">Assigned vendors</p>
                  <p className="meta mt-1">Reusable marketplace partners — the same file can sit on other tours.</p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate('/operator/vendors')}>
                  Open marketplace
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {assignedVendors.length ? (
                  assignedVendors.map(({ row, vendor }) => (
                    <button key={`${row.vendorId}-${row.tourId}`}
                      type="button"
                      className="rounded-xl border border-line px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => navigate(`/operator/vendors/${row.vendorId}`)}
                    >
                      <span className="font-semibold">{vendor?.name}</span>
                      <span className="meta mt-0.5 block capitalize">{vendor?.category} · {vendor?.city}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No marketplace partner assigned yet.</p>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {tab === 'traveler' ? (
          <Card>
            {traveler ? (
              <>
                <p className="card-title">{traveler.name}</p>
                <p className="meta mt-1">{traveler.email} · {traveler.phone}</p>
                <p className="mt-3 text-sm">{traveler.home}</p>
                <p className="mt-2 text-sm text-slate-600">{traveler.preferences}</p>
                <Button type="button" size="sm" className="mt-4" onClick={() => navigate(`/operator/customers/${traveler.id}`)}>
                  Open CRM file
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-600">{tour.party}</p>
            )}
          </Card>
        ) : null}

        {tab === 'itinerary' ? (
          <div className="space-y-2">
            {nodes.map((node) => (
              <Card
                key={node.id}
                className={
                  node.status === 'disrupted'
                    ? 'border-rose-200 bg-rose-50/50'
                    : node.status === 'alternative'
                      ? 'border-amber-200 bg-amber-50/40'
                      : node.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : undefined
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="meta">Day {node.day} · {node.time}</p>
                    <p className="card-title mt-1">{node.title}</p>
                    <p className="meta mt-1">{node.city}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={node.status} />
                    <p className="mt-2 text-sm font-semibold">{node.cost ? formatINR(node.cost) : 'Included'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === 'budget' ? (
          <BudgetMeter spent={tour.spent} budget={tour.budget} />
        ) : null}

        {tab === 'bookings' ? (
          <div className="grid gap-3 md:grid-cols-2">
            {tourBookings.length ? tourBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />) : (
              <p className="text-sm text-slate-500">No inventory rows on this file yet.</p>
            )}
          </div>
        ) : null}

        {tab === 'coordinator' ? (
          <Card>
            <p className="card-title">{desk?.name ?? tour.coordinator}</p>
            <p className="meta mt-1">{desk?.location ?? 'Field'} · {desk?.phone ?? 'Desk phone on file'}</p>
            <p className="mt-3 text-sm text-slate-600">{desk?.availability ?? 'Shift assigned at briefing.'}</p>
            {deskFile ? (
              <p className="mt-2 text-sm text-slate-600">Duties · {deskFile.responsibilities.join(' · ')}</p>
            ) : null}
            <p className="meta mt-3">
              {desk ? `${assignmentsFor(desk.id).length} live files on this desk` : 'No roster file yet'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => navigate(`/operator/coordinators/assign?tour=${tour.id}`)}>
                Assign Coordinator
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => navigate('/operator/coordinators')}>
                Coordinator roster
              </Button>
            </div>
          </Card>
        ) : null}

        {tab === 'alerts' ? (
          <Card>
            {tour.alert ? (
              <>
                <Badge tone="danger">{tour.alert}</Badge>
                <p className="mt-3 text-sm text-slate-600">{tour.notes}</p>
                <Button type="button" size="sm" className="mt-4" onClick={() => navigate('/operator/conflicts')}>
                  Open conflicts desk
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-600">No live alerts on this tour.</p>
            )}
          </Card>
        ) : null}

        {tab === 'log' ? (
          <div className="space-y-2">
            {activityLog(tour).map((row) => (
              <Card key={row.time}>
                <p className="meta">{row.time}</p>
                <p className="mt-1 text-sm font-semibold">{row.title}</p>
                <p className="mt-1 text-sm text-slate-600">{row.body}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
