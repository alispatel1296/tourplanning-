import { Check, Download, Map, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatINR } from '@/lib/cn'
import { checkoutDates, TOTAL } from '@/pages/traveler/checkout/model'
import type { CheckoutRecord } from '@/lib/booking'
import type { Trip } from '@/types'

export function SuccessView({
  trip,
  record,
  onDownload,
  onView,
  onShare,
}: {
  trip: Trip
  record: CheckoutRecord
  onDownload: () => void
  onView: () => void
  onShare: () => void
}) {
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <Check className="h-8 w-8" strokeWidth={2.4} />
      </motion.div>
      <Badge tone="success" className="mt-5">
        Simulated confirmation
      </Badge>
      <h1 className="page-title mt-3">Trip Confirmed</h1>
      <p className="mt-2 text-sm text-slate-600">
        {trip.route} is held for {trip.adults} adults · {checkoutDates(trip.startDate, trip.endDate)}.
      </p>
      <Card className="mt-6 text-left">
        <p className="meta">Booking ID</p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{record.bookingId}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="meta">Paid (demo)</p>
            <p className="mt-1 font-semibold">{formatINR(record.total)}</p>
          </div>
          <div>
            <p className="meta">Method</p>
            <p className="mt-1 font-semibold capitalize">{methodLabel(record.method)}</p>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-slate-500">
          Total {formatINR(TOTAL)}. Nothing was charged — this is a TripFlow demo hold.
        </p>
      </Card>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={onDownload}>
          Download itinerary
        </Button>
        <Button type="button" icon={<Map className="h-4 w-4" />} onClick={onView}>
          My trips
        </Button>
        <Button type="button" variant="outline" icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
          Share trip
        </Button>
      </div>
    </div>
  )
}

function methodLabel(method: CheckoutRecord['method']) {
  if (method === 'upi') return 'UPI'
  if (method === 'card') return 'Credit/Debit Card'
  return 'Net Banking'
}
