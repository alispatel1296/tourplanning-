import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Search } from '@/components/ui/Search'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/Feedback'
import { Building2, Sparkles } from 'lucide-react'
import { categoryTabs, loadVendors, persistVendor, type MarketVendor, type VendorCategory } from '@/pages/operator/vendors/catalog'
import { OnboardVendor } from '@/pages/operator/vendors/OnboardVendor'
import { searchLocalBusinesses } from '@/services/travel/TravelDataService'
import type { TravelEntity } from '@/services/travel/types'

type Tab = 'all' | VendorCategory

export function OperatorVendors() {
  const [vendors, setVendors] = useState(loadVendors)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [onboard, setOnboard] = useState(false)
  const [webHits, setWebHits] = useState<TravelEntity[]>([])
  const [webNote, setWebNote] = useState<string | null>(null)
  const navigate = useNavigate()

  const saveDiscovered = (entity: TravelEntity) => {
    const vendor: MarketVendor = {
      id: `serp-${entity.id}`.slice(0, 40),
      name: entity.name,
      category: tab === 'all' ? 'hotel' : tab,
      city: entity.location?.split(',')[0] ?? query,
      locations: [entity.location ?? query],
      rating: entity.rating ?? 0,
      priceBand: entity.price != null ? `₹${entity.price}` : 'Price unavailable',
      availability: 'Limited',
      status: 'active',
      contact: entity.website ?? 'Discovered via SerpApi',
      phone: entity.phone ?? '',
      image: entity.images[0] ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=70',
      about: `${entity.description ?? entity.location ?? 'Retrieved business'} · Discovered via SerpApi`,
      pricing: entity.price != null ? [`Listed ${entity.currency ?? 'INR'} ${entity.price}`] : ['Price unavailable'],
      performance: { onTime: 0, disputes: 0, repeats: 0 },
      reviews: [],
      cancellation: 'Information unavailable',
      documents: ['Discovered via SerpApi'],
    }
    persistVendor(vendor)
    setVendors(loadVendors())
  }

  const rows = useMemo(
    () =>
      vendors.filter((vendor) => {
        if (tab !== 'all' && vendor.category !== tab) return false
        return `${vendor.name} ${vendor.city} ${vendor.category}`.toLowerCase().includes(query.toLowerCase())
      }),
    [vendors, tab, query],
  )

  return (
    <div>
      <PageHeader
        title="Vendor marketplace"
        description="Reusable hotels, hops, tables, and guides — assign the same partner across many customized tours."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Vendors' }]}
        actions={
          <>
            <Button type="button" variant="ai" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate('/operator/vendors/match')}>
              Find best vendor for traveler
            </Button>
            <Button type="button" onClick={() => setOnboard(true)}>Add Vendor</Button>
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={categoryTabs} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Search value={query} onChange={setQuery} placeholder="Search vendor, city, or category" className="max-w-md" />
        {!rows.length && query.length >= 3 ? (
          <Button
type="button"             size="sm"
            variant="secondary"
            onClick={() => {
              void searchLocalBusinesses(`${query} ${tab === 'all' ? 'Goa' : tab}`)
                .then((result) => {
                  setWebHits(result.items)
                  setWebNote(result.message ?? 'Source: Google / SerpApi')
                })
                .catch(() => setWebNote('Live search is temporarily unavailable.'))
            }}
          >
            Search the web
          </Button>
        ) : null}
      </div>
      {webNote ? <p className="meta mt-2">{webNote}</p> : null}
      {webHits.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {webHits.slice(0, 6).map((item) => (
            <Card key={item.id}>
              <p className="card-title">{item.name}</p>
              <p className="meta mt-1">{item.location ?? 'Location unavailable'}</p>
              <p className="mt-2 text-sm text-slate-600">
                {item.rating != null ? `${item.rating.toFixed(1)}★` : 'Rating unavailable'}
                {item.phone ? ` · ${item.phone}` : ''}
              </p>
              <Button type="button" size="sm" className="mt-3" onClick={() => saveDiscovered(item)}>
                Add Vendor
              </Button>
              <p className="meta mt-2">Discovered via SerpApi</p>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.length ? (
          rows.map((vendor) => (
            <Card key={vendor.id} padded={false} className="overflow-hidden">
              <img src={vendor.image} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="card-title">{vendor.name}</p>
                    <p className="meta mt-0.5 capitalize">{vendor.category}</p>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{vendor.city}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <p className="meta">Rating</p>
                    <p className="font-semibold">{vendor.rating.toFixed(1)} ★</p>
                  </div>
                  <div>
                    <p className="meta">Price range</p>
                    <p className="font-semibold">{vendor.priceBand}</p>
                  </div>
                  <div>
                    <p className="meta">Availability</p>
                    <Badge tone={vendor.availability === 'Confirmed' ? 'success' : vendor.availability === 'Waitlist' ? 'warning' : 'info'}>
                      {vendor.availability}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" size="sm" onClick={() => navigate(`/operator/vendors/${vendor.id}`)}>
                    Open
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/operator/vendors/${vendor.id}?assign=1`)}>
                    Assign to tour
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState icon={<Building2 className="h-5 w-5" />} title="No vendors in this category" body="Onboard a partner or switch tabs." />
          </div>
        )}
      </div>

      <OnboardVendor
        open={onboard}
        onClose={() => setOnboard(false)}
        onSave={(vendor) => {
          setVendors(loadVendors())
          setOnboard(false)
          navigate(`/operator/vendors/${vendor.id}`)
        }}
      />
    </div>
  )
}
