import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Overlay'
import { useAppState } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import {
  approveRefund,
  loadLedger,
  processRefund,
  requestRefund,
  type LedgerBooking,
} from '@/pages/operator/bookings/ledger'

export function RefundModal({
  booking,
  open,
  onClose,
  onChange,
}: {
  booking: LedgerBooking
  open: boolean
  onClose: () => void
  onChange: () => void
}) {
  const { pushToast } = useAppState()
  const live = loadLedger().find((row) => row.id === booking.id) ?? booking
  const [amount, setAmount] = useState(String(live.collected || live.amount))
  const [reason, setReason] = useState(live.refund?.reason ?? '')

  const submit = () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      pushToast({ title: 'Enter an amount', body: 'Refund needs a positive rupee value.' })
      return
    }
    if (!reason.trim()) {
      pushToast({ title: 'Add a reason', body: 'Desk audit needs a one-line reason.' })
      return
    }
    requestRefund(live.id, value, reason.trim())
    onChange()
    pushToast({ title: 'Refund requested', body: `${formatINR(value)} is waiting on approval.` })
  }

  const approve = () => {
    approveRefund(live.id)
    onChange()
    pushToast({ title: 'Refund approved', body: 'Simulating payout to the original instrument.' })
    window.setTimeout(() => {
      processRefund(live.id)
      onChange()
      pushToast({ title: 'Refund processed', body: `${live.id} is now refunded.` })
    }, 700)
  }

  const stage = live.refund?.status ?? 'None'

  return (
    <Modal open={open} onClose={onClose} title="Request Refund">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500">Amount</span>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-11 w-full rounded-lg border border-line px-3 text-sm tabular-nums"
            disabled={Boolean(live.refund)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-line px-3 py-2 text-sm"
            disabled={Boolean(live.refund)}
          />
        </label>
        <div>
          <p className="meta">Refund status</p>
          <Badge tone={stage === 'Processed' ? 'success' : stage === 'None' ? 'neutral' : 'warning'} className="mt-1">
            {stage}
          </Badge>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        {!live.refund ? (
          <Button type="button" onClick={submit}>Submit request</Button>
        ) : live.refund.status === 'Requested' ? (
          <Button type="button" onClick={approve}>Approve refund</Button>
        ) : null}
      </div>
    </Modal>
  )
}
