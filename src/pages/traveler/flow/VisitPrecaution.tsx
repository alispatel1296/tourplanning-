import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import type { TripNode } from '@/types'

const lists: Record<TripNode['category'], { title: string; intro: string; items: string[] }> = {
  stay: {
    title: 'Checking out — look once more',
    intro: 'You marked the hotel visited. Before the cab, confirm nothing is still in the room or the safe.',
    items: [
      'Room key / key card left at the desk (or in your hand if you still need it)',
      'Government ID and tickets out of the safe',
      'Phone, charger, and power bank',
      'Wallet, earphones, medicines',
      'Bathroom and wardrobe sweep — nothing on hangers',
      'Cab / station time still has the 45-minute buffer',
    ],
  },
  transport: {
    title: 'Leaving this hop',
    intro: 'Before you step off, check the seat pocket and the overhead.',
    items: [
      'Phone and earphones',
      'Tickets / PNR still on the phone',
      'Bag from the overhead or under-seat',
      'Bottle and any medicine you took out',
      'Jacket from the hook',
    ],
  },
  food: {
    title: 'Leaving the table',
    intro: 'Pay the bill, then do a chair-and-floor check.',
    items: [
      'Phone and wallet',
      'Bag on the extra chair',
      'Bill settled — UPI or card',
      'Any leftover you meant to take',
    ],
  },
  activity: {
    title: 'Leaving the activity',
    intro: 'Return gear, then check the locker.',
    items: [
      'Phone and dry bag',
      'Locker key returned',
      'Rented jacket / life vest returned',
      'Sunscreen and sandals',
      'Nothing on the beach chair',
    ],
  },
  free: {
    title: 'Moving on',
    intro: 'A 20-second sweep before the next green node.',
    items: ['Phone', 'Wallet', 'Keys', 'Bag'],
  },
}

export function VisitPrecaution({
  node,
  open,
  onCancel,
  onConfirm,
}: {
  node: TripNode | null
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState<string[]>([])
  const pack = node ? lists[node.category] : lists.free
  const ready = checked.length >= Math.min(3, pack.items.length)

  return (
    <Modal
      open={open}
      onClose={() => {
        setChecked([])
        onCancel()
      }}
      title={pack.title}
    >
      <p className="text-sm text-slate-600">{pack.intro}</p>
      <ul className="mt-4 space-y-2">
        {pack.items.map((item) => {
          const on = checked.includes(item)
          return (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setChecked((current) => (on ? current.filter((row) => row !== item) : [...current, item]))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-700"
                />
                {item}
              </label>
            </li>
          )
        })}
      </ul>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button
type="button"           variant="secondary"
          onClick={() => {
            setChecked([])
            onCancel()
          }}
        >
          Stay on this node
        </Button>
        <Button
type="button"           disabled={!ready}
          onClick={() => {
            setChecked([])
            onConfirm()
          }}
        >
          All checked — mark visited
        </Button>
      </div>
    </Modal>
  )
}
