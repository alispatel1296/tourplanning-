import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { AILabel } from '@/components/domain/AICards'
import { Sparkles } from 'lucide-react'
import { loadVendors, matchAarav, type MarketVendor, type MatchScore } from '@/pages/operator/vendors/catalog'

export function MatchingStudio() {
  const navigate = useNavigate()
  const vendors = useMemo(() => loadVendors(), [])
  const [ready, setReady] = useState(true)
  const [picks, setPicks] = useState<string[]>([])
  const matches = useMemo(() => (ready ? matchAarav(vendors) : []), [ready, vendors])

  const selected = picks.map((id) => {
    const vendor = vendors.find((item) => item.id === id)
    const score = matches.find((item) => item.vendorId === id)
    return vendor && score ? { vendor, score } : null
  }).filter(Boolean) as { vendor: MarketVendor; score: MatchScore }[]

  const toggle = (id: string) => {
    setPicks((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 2) return [current[1], id]
      return [...current, id]
    })
  }

  return (
    <div>
      <PageHeader
        title="Find best vendor for traveler"
        description="AI scores fit on preference, budget, location, and availability. You choose — TripFlow will not crown a winner."
        crumbs={[
          { label: 'Vendors', to: '/operator/vendors' },
          { label: 'Match' },
        ]}
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="meta">Traveler</p>
            <p className="card-title mt-1">Aarav Shah</p>
            <p className="mt-2 text-sm text-slate-600">Premium · Food · Beach · Adventure · Budget ₹65,000</p>
          </div>
          <Button type="button" variant="ai" icon={<Sparkles className="h-4 w-4" />} onClick={() => setReady(true)}>
            Run AI match
          </Button>
        </div>
      </Card>

      {ready ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {matches.map((score) => {
            const vendor = vendors.find((item) => item.id === score.vendorId)
            if (!vendor) return null
            const on = picks.includes(vendor.id)
            return (
              <Card key={vendor.id} className={on ? 'border-brand-300' : undefined}>
                <div className="flex gap-3">
                  <img src={vendor.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="card-title">{vendor.name}</p>
                      <AILabel />
                    </div>
                    <p className="meta mt-0.5 capitalize">
                      {vendor.category} · {vendor.city}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Fit label="Preference match" value={score.preference} />
                  <Fit label="Budget fit" value={score.budget} />
                  <Fit label="Location fit" value={score.location} />
                  <div>
                    <p className="meta">Availability</p>
                    <Badge tone={score.availability === 'Confirmed' ? 'success' : 'warning'} className="mt-1">
                      {score.availability}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{score.reason}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant={on ? 'outline' : 'secondary'} onClick={() => toggle(vendor.id)}>
                    {on ? 'Selected' : 'Select to compare'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => navigate(`/operator/vendors/${vendor.id}`)}>
                    Open file
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Run the match to score reusable partners against Aarav’s brief. No ranked winner is produced.</p>
      )}

      {ready ? (
        <div className="mt-5">
          <CompareDock
            left={selected[0]}
            right={selected[1]}
            onClear={() => setPicks([])}
            onOpen={(id) => navigate(`/operator/vendors/${id}?assign=1`)}
          />
        </div>
      ) : null}
    </div>
  )
}

function Fit({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="meta">{label}</p>
      <p className="mt-1 font-semibold">{value}%</p>
    </div>
  )
}

function CompareDock({
  left,
  right,
  onClear,
  onOpen,
}: {
  left?: { vendor: MarketVendor; score: MatchScore }
  right?: { vendor: MarketVendor; score: MatchScore }
  onClear: () => void
  onOpen: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            {left && right ? `Compare ${left.vendor.name} with ${right.vendor.name}. No winner is assigned.` : 'Select two vendors to compare side by side.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={onClear} disabled={!left && !right}>
              Clear
            </Button>
            <Button type="button" size="sm" disabled={!left || !right} onClick={() => setOpen(true)}>
              Compare
            </Button>
          </div>
        </div>
      </Card>
      <Modal open={open && Boolean(left && right)} onClose={() => setOpen(false)} title="Compare vendors" wide>
        {left && right ? (
          <div>
            <p className="mb-4 text-sm text-slate-600">Facts only. Assign the partner that fits this traveler and this tour.</p>
            <div className="overflow-hidden rounded-xl border border-line text-sm">
              <div className="grid grid-cols-3 bg-slate-50 font-semibold">
                <p className="px-3 py-2" />
                <p className="px-3 py-2">{left.vendor.name}</p>
                <p className="px-3 py-2">{right.vendor.name}</p>
              </div>
              {[
                ['Category', left.vendor.category, right.vendor.category],
                ['Location', left.vendor.city, right.vendor.city],
                ['Preference match', `${left.score.preference}%`, `${right.score.preference}%`],
                ['Budget fit', `${left.score.budget}%`, `${right.score.budget}%`],
                ['Location fit', `${left.score.location}%`, `${right.score.location}%`],
                ['Availability', left.score.availability, right.score.availability],
                ['Price band', left.vendor.priceBand, right.vendor.priceBand],
                ['Rating', left.vendor.rating.toFixed(1), right.vendor.rating.toFixed(1)],
              ].map(([label, a, b]) => (
                <div key={label} className="grid grid-cols-3 border-t border-line">
                  <p className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
                  <p className="px-3 py-2 capitalize">{a}</p>
                  <p className="px-3 py-2 capitalize">{b}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpen(left.vendor.id)}>
                Assign {left.vendor.name.split(' ')[0]}
              </Button>
              <Button type="button" variant="secondary" onClick={() => onOpen(right.vendor.id)}>
                Assign {right.vendor.name.split(' ')[0]}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
