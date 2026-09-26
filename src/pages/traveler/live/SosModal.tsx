import { useState } from 'react'
import { Siren } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { coordinatorRohan } from '@/data/demo'
import type { Trip } from '@/types'

export function SosButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-rose-700 lg:bottom-6"
    >
      <Siren className="h-4 w-4" />
      SOS
    </button>
  )
}

export function SosModal({
  open,
  trip,
  location,
  bookingId,
  onClose,
  onCall,
  onAlert,
}: {
  open: boolean
  trip: Trip
  location: string
  bookingId: string
  onClose: () => void
  onCall: () => void
  onAlert: () => void
}) {
  const [share, setShare] = useState(true)

  return (
    <Modal open={open} onClose={onClose} title="Contact Trip Coordinator?">
      <p className="text-sm text-slate-600">
        {coordinatorRohan.name} is on duty in {coordinatorRohan.city}. This alert is simulated — no call is placed.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} />
        Share live location
      </label>
      <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
        <Row label="Trip ID" value={bookingId} />
        <Row label="Current location" value={share ? location : 'Hidden'} />
        <Row label="Emergency context" value={`Day ${trip.nodes.find((node) => node.status === 'active')?.day ?? 4} live trip · traveler requested help.`} />
        <Row label="Coordinator" value={`${coordinatorRohan.name} · ${coordinatorRohan.phone}`} />
      </dl>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" onClick={onCall}>
          Call Coordinator
        </Button>
        <Button type="button" variant="danger" onClick={onAlert}>
          Send Alert
        </Button>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="meta">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
