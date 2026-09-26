import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppState } from '@/state/AppState'
import { Building2 } from 'lucide-react'
import { loadTours } from '@/pages/operator/tours/catalog'
import {
  loadAssignments,
  loadVendors,
  persistAssignments,
  persistVendor,
} from '@/pages/operator/vendors/catalog'
import { searchLocalBusinesses } from '@/services/travel/TravelDataService'

type DetailTab = 'profile' | 'locations' | 'pricing' | 'availability' | 'performance' | 'reviews' | 'policy'

export function VendorDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { pushToast } = useAppState()
  const navigate = useNavigate()
  const vendor = loadVendors().find((item) => item.id === id)
  const [tab, setTab] = useState<DetailTab>('profile')
  const [tourId, setTourId] = useState(loadTours()[0]?.id ?? '')
  const [tick, setTick] = useState(0)
  const assignOpen = params.get('assign') === '1'
  const assigned = useMemo(
    () => loadAssignments().filter((row) => row.vendorId === id),
    [id, tick],
  )

  if (!vendor) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" />}
        title="Vendor not on the desk"
        body="Onboard them or pick another card from the marketplace."
        action={<Button type="button" onClick={() => navigate('/operator/vendors')}>Vendor marketplace</Button>}
      />
    )
  }

  const assign = () => {
    const tour = loadTours().find((item) => item.id === tourId)
    if (!tour) return
    const rows = loadAssignments()
    if (rows.some((row) => row.vendorId === vendor.id && row.tourId === tour.id)) {
      pushToast({ title: 'Already assigned', body: `${vendor.name} is already on ${tour.code}.` })
      return
    }
    persistAssignments([{ vendorId: vendor.id, tourId: tour.id, tourCode: tour.code, party: tour.party }, ...rows])
    setTick((value) => value + 1)
    pushToast({ title: 'Vendor assigned', body: `${vendor.name} is now reusable on ${tour.code}. Other tours can still use this partner.` })
    setParams({})
  }

  return (
    <div>
      <PageHeader
        title={vendor.name}
        description={`${vendor.city} · reusable ${vendor.category} infrastructure`}
        crumbs={[
          { label: 'Vendors', to: '/operator/vendors' },
          { label: vendor.name },
        ]}
        actions={
          <>
            <StatusBadge status={vendor.status} />
            <Button
type="button"               variant="secondary"
              onClick={() => {
                void searchLocalBusinesses(`${vendor.name} ${vendor.city}`)
                  .then((result) => {
                    const hit = result.items[0]
                    if (!hit) {
                      pushToast({ title: 'Refresh', body: result.message ?? 'No live match. Information unavailable.' })
                      return
                    }
                    persistVendor({
                      ...vendor,
                      rating: hit.rating ?? vendor.rating,
                      phone: hit.phone || vendor.phone,
                      contact: hit.website || vendor.contact,
                      image: hit.images[0] ?? vendor.image,
                      about: vendor.about,
                    })
                    setTick((value) => value + 1)
                    pushToast({ title: 'Vendor refreshed', body: `${hit.name} · Source: Google / SerpApi` })
                  })
                  .catch(() => pushToast({ title: 'Refresh failed', body: 'Live search is temporarily unavailable.' }))
              }}
            >
              Refresh Vendor Data
            </Button>
            <Button type="button" onClick={() => setParams({ assign: '1' })}>Assign to tour</Button>
          </>
        }
      />

      <img src={vendor.image} alt="" className="mb-5 h-48 w-full rounded-2xl object-cover" />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'locations', label: 'Locations' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'availability', label: 'Availability' },
          { id: 'performance', label: 'Performance' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'policy', label: 'Cancellation policy' },
        ]}
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          {tab === 'profile' ? <Card><p className="text-sm text-slate-600">{vendor.about}</p><p className="meta mt-3">{vendor.contact} · {vendor.phone}</p></Card> : null}
          {tab === 'locations' ? (
            <Card>
              <div className="flex flex-wrap gap-2">
                {vendor.locations.map((place) => (
                  <Badge key={place}>{place}</Badge>
                ))}
              </div>
            </Card>
          ) : null}
          {tab === 'pricing' ? (
            <Card>
              <ul className="space-y-2 text-sm">
                {vendor.pricing.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="meta mt-3">Band {vendor.priceBand}</p>
            </Card>
          ) : null}
          {tab === 'availability' ? (
            <Card>
              <Badge tone={vendor.availability === 'Confirmed' ? 'success' : 'warning'}>{vendor.availability}</Badge>
              <p className="mt-3 text-sm text-slate-600">This availability is shared across every tour that uses the partner — not a one-off booking.</p>
            </Card>
          ) : null}
          {tab === 'performance' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><p className="font-display text-2xl font-semibold">{vendor.performance.onTime}%</p><p className="meta">On-time</p></Card>
              <Card><p className="font-display text-2xl font-semibold">{vendor.performance.disputes}</p><p className="meta">Open disputes</p></Card>
              <Card><p className="font-display text-2xl font-semibold">{vendor.performance.repeats}</p><p className="meta">Repeat assignments</p></Card>
            </div>
          ) : null}
          {tab === 'reviews' ? (
            <div className="space-y-2">
              {vendor.reviews.length ? (
                vendor.reviews.map((review) => (
                  <Card key={review.text}>
                    <p className="text-sm font-semibold">{review.by} · {review.rating.toFixed(1)} ★</p>
                    <p className="mt-1 text-sm text-slate-600">{review.text}</p>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-slate-500">No desk reviews yet.</p>
              )}
            </div>
          ) : null}
          {tab === 'policy' ? <Card><p className="text-sm text-slate-600">{vendor.cancellation}</p><p className="meta mt-3">Documents · {vendor.documents.join(' · ') || 'Pending'}</p></Card> : null}
        </div>

        <Card>
          <p className="card-title">Assigned tours</p>
          <p className="meta mt-1">Same vendor, many customized circuits.</p>
          <div className="mt-3 space-y-2">
            {assigned.length ? (
              assigned.map((row) => (
                <button key={row.tourId}
                  type="button"
                  className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-sm"
                  onClick={() => navigate(`/operator/tours/${row.tourId}`)}
                >
                  <span className="font-semibold">{row.tourCode}</span>
                  <span className="meta mt-0.5 block">{row.party}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">Not assigned yet. Reuse this partner on any FIT or group.</p>
            )}
          </div>
        </Card>
      </div>

      <Modal open={assignOpen} onClose={() => setParams({})} title="Assign to a tour">
        <p className="text-sm text-slate-600">
          {vendor.name} stays on the marketplace. Assigning does not lock them to a single traveler.
        </p>
        <select
          className="mt-4 h-11 w-full rounded-lg border border-line px-3 text-sm"
          value={tourId}
          onChange={(event) => setTourId(event.target.value)}
        >
          {loadTours().map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.code} · {tour.party}
            </option>
          ))}
        </select>
        <Button type="button" className="mt-4" onClick={assign}>
          Assign vendor
        </Button>
      </Modal>
    </div>
  )
}
