import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { formatINR } from '@/lib/cn'
import { Wallet } from 'lucide-react'
import {
  loadLedger,
  payTone,
  splitProgress,
  type LedgerBooking,
} from '@/pages/operator/bookings/ledger'
import { RefundModal } from '@/pages/operator/bookings/RefundModal'

export function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [refundOpen, setRefundOpen] = useState(false)
  const booking = useMemo(() => loadLedger().find((row) => row.id === id), [id, tick])

  if (!booking) {
    return (
      <EmptyState
        icon={<Wallet className="h-5 w-5" />}
        title="Invoice not on the ledger"
        body="That booking ID is not in the current desk file."
        action={<Button type="button" onClick={() => navigate('/operator/bookings')}>Bookings</Button>}
      />
    )
  }

  const split = splitProgress(booking)
  const due = Math.max(booking.amount - booking.collected, 0)

  return (
    <div>
      <PageHeader
        title={booking.id}
        description={`${booking.traveler} · ${booking.tour}`}
        crumbs={[
          { label: 'Bookings', to: '/operator/bookings' },
          { label: booking.id },
        ]}
        actions={
          <>
            <Badge tone={payTone(booking.paymentStatus)}>{booking.paymentStatus}</Badge>
            <Button
type="button"               variant="secondary"
              disabled={booking.paymentStatus === 'Refunded' || booking.paymentStatus === 'Pending'}
              onClick={() => setRefundOpen(true)}
            >
              Request Refund
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Invoice" value={booking.invoiceNo} />
        <Stat label="Amount" value={formatINR(booking.amount)} />
        <Stat label="Collected" value={formatINR(booking.collected)} hint={due ? `${formatINR(due)} due` : 'Settled'} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="meta">Traveler</p>
          <p className="mt-1 font-semibold">{booking.traveler}</p>
          <p className="meta mt-4">Tour</p>
          <p className="mt-1 font-semibold">{booking.tour}</p>
          {booking.tourId ? (
            <Button type="button" size="sm" className="mt-4" variant="secondary" onClick={() => navigate(`/operator/tours/${booking.tourId}`)}>
              Open tour
            </Button>
          ) : null}
        </Card>

        <Card>
          <p className="card-title">Invoice</p>
          <p className="meta mt-1">{booking.invoiceNo} · {booking.date}</p>
          <div className="mt-4 space-y-2 text-sm">
            {booking.invoice.map((line) => (
              <div key={line.label} className="flex justify-between gap-3">
                <span className="text-slate-600">{line.label}</span>
                <span className="tabular-nums font-medium">{formatINR(line.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatINR(booking.amount)}</span>
            </div>
          </div>
        </Card>

        {booking.members ? <SplitCard booking={booking} paid={split?.paid ?? 0} total={split?.total ?? 0} /> : null}

        <Card>
          <p className="card-title">Payment timeline</p>
          <div className="mt-3 space-y-3">
            {booking.timeline.map((event) => (
              <div key={`${event.at}-${event.title}`} className="border-l-2 border-line pl-3">
                <p className="meta">{event.at}</p>
                <p className="mt-0.5 text-sm font-semibold">{event.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{event.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="card-title">Transactions</p>
          {booking.transactions.length ? (
            <div className="mt-3 space-y-2 text-sm">
              {booking.transactions.map((txn) => (
                <div key={txn.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{txn.label}</p>
                    <p className="meta">{txn.at} · {txn.method}</p>
                  </div>
                  <p className={`tabular-nums font-semibold ${txn.amount < 0 ? 'text-rose-600' : ''}`}>
                    {formatINR(txn.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No capture yet.</p>
          )}
        </Card>

        <Card>
          <p className="card-title">Refund status</p>
          {booking.refund ? (
            <div className="mt-3 text-sm">
              <Badge tone={booking.refund.status === 'Processed' ? 'success' : 'warning'}>{booking.refund.status}</Badge>
              <p className="mt-3 font-semibold tabular-nums">{formatINR(booking.refund.amount)}</p>
              <p className="mt-1 text-slate-600">{booking.refund.reason}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No refund on this invoice.</p>
          )}
        </Card>
      </div>

      <RefundModal
        booking={booking}
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onChange={() => setTick((value) => value + 1)}
      />
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="meta">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-slate-500">{hint}</p> : null}
    </Card>
  )
}

function SplitCard({ booking, paid, total }: { booking: LedgerBooking; paid: number; total: number }) {
  return (
    <Card className="xl:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="card-title">Group payment</p>
          <p className="meta mt-1">Split across {total} members</p>
        </div>
        <p className="text-sm font-semibold">{paid}/{total} members paid</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(paid / total) * 100}%` }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {booking.members?.map((member) => (
          <div key={member.name} className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="font-semibold">{member.name}</p>
            <p className="mt-1 tabular-nums text-sm">{formatINR(member.amount)}</p>
            <Badge tone={payTone(member.status)} className="mt-2">
              {member.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
