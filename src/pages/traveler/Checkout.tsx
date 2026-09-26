import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Hotel, TrainFront, UtensilsCrossed, Waves, CarFront } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { formatINR, cn } from '@/lib/cn'
import { DEMO_BOOKING_ID } from '@/lib/booking'
import { BudgetHealth } from '@/pages/traveler/flow/BudgetHealth'
import { predictedBudgetCopy } from '@/pages/traveler/flow/model'
import {
  checkoutDates,
  computeQuote,
  itineraryText,
  quoteSections,
} from '@/pages/traveler/checkout/model'
import { emptyPayment, PaymentForm, validatePayment, type PaymentValues } from '@/pages/traveler/checkout/PaymentForm'
import { SuccessView } from '@/pages/traveler/checkout/SuccessView'

const sectionIcons = {
  transport: TrainFront,
  hotels: Hotel,
  activities: Waves,
  food: UtensilsCrossed,
  local: CarFront,
}

const paySteps = ['Authorizing demo payment', 'Confirming vendor holds', 'Issuing TripFlow tickets']

export function Checkout() {
  const trip = usePrimaryTrip()
  const { user, checkout, confirmCheckout, pushToast } = useAppState()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string[]>(['transport', 'hotels'])
  const [payment, setPayment] = useState<PaymentValues>(emptyPayment)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>(checkout ? 'success' : 'form')
  const [payStep, setPayStep] = useState(0)
  const [receipt, setReceipt] = useState(checkout)
  const sections = useMemo(() => quoteSections(trip), [trip])
  const quote = useMemo(() => computeQuote(trip), [trip])
  const remaining = trip.budget - quote.total
  const record = receipt ?? checkout

  const toggle = (id: string) => {
    setOpen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const download = () => {
    const blob = new Blob([itineraryText(trip, record?.bookingId ?? DEMO_BOOKING_ID, sections)], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `TripFlow-${record?.bookingId ?? DEMO_BOOKING_ID}.txt`
    link.click()
    URL.revokeObjectURL(url)
    pushToast({ title: 'Itinerary downloaded', body: 'A demo text itinerary was saved to your device.' })
  }

  const share = async () => {
    const text = `${trip.route} confirmed · ${record?.bookingId ?? DEMO_BOOKING_ID} · ${checkoutDates(trip.startDate, trip.endDate)}`
    try {
      await navigator.clipboard.writeText(text)
      pushToast({ title: 'Trip link copied', body: 'Share text is on your clipboard. No live link was published.' })
    } catch {
      pushToast({ title: 'Share text ready', body: text })
    }
  }

  const pay = () => {
    const issue = validatePayment(payment)
    if (issue) {
      setError(issue)
      return
    }
    setError(null)
    setPhase('processing')
    setPayStep(0)
    window.setTimeout(() => setPayStep(1), 700)
    window.setTimeout(() => setPayStep(2), 1400)
    window.setTimeout(() => {
      const saved = confirmCheckout({ tripId: trip.id, total: quote.total, method: payment.method })
      setReceipt(saved)
      setPhase('success')
    }, 2200)
  }

  if (phase === 'success' && record) {
    return (
      <SuccessView
        trip={trip}
        record={record}
        onDownload={download}
        onView={() => navigate('/traveler/trips')}
        onShare={share}
      />
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Booking"
        title="Checkout"
        description={`Review ${trip.title} · ${trip.route || 'your trip'}, then confirm a simulated payment. Nothing is charged.`}
        crumbs={[
          { label: 'Itinerary', to: '/traveler/itinerary' },
          { label: 'Checkout' },
        ]}
      />

      {phase === 'processing' ? (
        <ProcessingCard step={payStep} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="meta">Trip</p>
                  <p className="mt-1 font-display text-lg font-semibold">{trip.route}</p>
                </div>
                <Badge tone="info">Demo quote</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Meta label="Dates" value={checkoutDates(trip.startDate, trip.endDate)} />
                <Meta label="Travelers" value={`${trip.adults} Adults`} />
                <Meta label="Lead traveler" value={user?.name ?? 'Aarav Shah'} />
              </div>
            </Card>

            {sections.map((section) => {
              const Icon = sectionIcons[section.id]
              const expanded = open.includes(section.id)
              return (
                <Card key={section.id} padded={false}>
                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{section.title}</span>
                        <span className="meta">{section.lines.length} items</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatINR(section.total)}</span>
                      <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', expanded && 'rotate-180')} />
                    </span>
                  </button>
                  {expanded ? (
                    <div className="border-t border-line px-5 py-3">
                      {section.lines.map((line) => (
                        <div key={line.id} className="flex items-start justify-between gap-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{line.title}</p>
                            <p className="meta truncate">{line.detail}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">{formatINR(line.amount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              )
            })}

            <Card>
              <p className="meta">Price breakdown</p>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Hotels" value={quote.hotels} />
                <Row label="Transport" value={quote.transport} />
                <Row label="Activities" value={quote.activities} />
                <Row label="Food" value={quote.food} />
                <Row label="Local transport" value={quote.local} />
                <div className="border-t border-line pt-2">
                  <Row label="Subtotal" value={quote.subtotal} />
                </div>
                <Row label="Taxes (5%)" value={quote.taxes} />
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatINR(quote.total)}</span>
                </div>
                <Row label="Budget" value={trip.budget} mute />
                <Row label="Remaining" value={remaining} emphasis />
              </div>
              <div className="mt-4">
                <BudgetHealth
                  budget={trip.budget}
                  planned={quote.total}
                  prediction={predictedBudgetCopy(trip.budget, quote.total)}
                />
              </div>
            </Card>
          </div>

          <div className="xl:sticky xl:top-20 xl:self-start">
            <Card>
              <h2 className="section-title">Payment</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pay {formatINR(quote.total)} to lock your {trip.title}. Gateway calls are simulated.
              </p>
              <div className="mt-5">
                <PaymentForm values={payment} onChange={setPayment} error={error} onPay={pay} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="meta">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function Row({
  label,
  value,
  mute,
  emphasis,
}: {
  label: string
  value: number
  mute?: boolean
  emphasis?: boolean
}) {
  return (
    <div className={cn('flex justify-between', mute && 'text-slate-500', emphasis && 'font-semibold text-emerald-700')}>
      <span>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  )
}

function ProcessingCard({ step }: { step: number }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <div className="ai-generating mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <motion.span
          className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      </div>
      <p className="mt-4 font-display text-xl font-semibold">Confirming your trip…</p>
      <p className="mt-1 text-sm text-slate-500">Demo authorization only. No bank or UPI app is contacted.</p>
      <ul className="mt-5 space-y-2 text-left text-sm">
        {paySteps.map((label, index) => (
          <li
            key={label}
            className={cn('rounded-lg px-3 py-2', index <= step ? 'bg-brand-50 text-brand-900' : 'bg-slate-50 text-slate-400')}
          >
            {label}
          </li>
        ))}
      </ul>
    </Card>
  )
}
