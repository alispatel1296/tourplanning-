export type PayStatus = 'Paid' | 'Partial' | 'Pending' | 'Refunded'
export type RefundStage = 'Requested' | 'Approved' | 'Processed'

export interface InvoiceLine {
  label: string
  amount: number
}

export interface TimelineEvent {
  at: string
  title: string
  body: string
}

export interface LedgerTxn {
  id: string
  at: string
  label: string
  amount: number
  method: string
}

export interface SplitMember {
  name: string
  amount: number
  status: PayStatus
}

export interface LedgerRefund {
  amount: number
  reason: string
  status: RefundStage
}

export interface LedgerBooking {
  id: string
  traveler: string
  tour: string
  tourId?: string
  amount: number
  collected: number
  paymentStatus: PayStatus
  date: string
  invoiceNo: string
  invoice: InvoiceLine[]
  timeline: TimelineEvent[]
  transactions: LedgerTxn[]
  members?: SplitMember[]
  refund?: LedgerRefund
}

const STORE = 'tf-ops-ledger'

export const seedLedger: LedgerBooking[] = [
  {
    id: 'TF-2026-10482',
    traveler: 'Aarav Shah',
    tour: 'West Coast Circuit',
    tourId: 'op-aarav',
    amount: 63000,
    collected: 63000,
    paymentStatus: 'Paid',
    date: '2026-09-24',
    invoiceNo: 'INV-10482',
    invoice: [
      { label: 'Hotels', amount: 20000 },
      { label: 'Transport', amount: 15000 },
      { label: 'Activities', amount: 10000 },
      { label: 'Food', amount: 8000 },
      { label: 'Local', amount: 7000 },
      { label: 'Taxes', amount: 3000 },
    ],
    timeline: [
      { at: '24 Sep 16:12', title: 'Invoice issued', body: 'INV-10482 opened against the West Coast hold.' },
      { at: '24 Sep 16:14', title: 'UPI captured', body: '₹63,000 received from Aarav Shah.' },
      { at: '24 Sep 16:14', title: 'Marked paid', body: 'Tickets and vendor holds confirmed.' },
    ],
    transactions: [
      { id: 'txn-10482', at: '24 Sep 16:14', label: 'Checkout capture', amount: 63000, method: 'UPI' },
    ],
  },
  {
    id: 'TF-2026-11090',
    traveler: 'Aarav Shah + 4',
    tour: 'Goa Friends Circuit',
    amount: 72000,
    collected: 60000,
    paymentStatus: 'Partial',
    date: '2026-09-20',
    invoiceNo: 'INV-11090',
    invoice: [
      { label: 'Stay · 5 pax', amount: 32000 },
      { label: 'Cabs & hops', amount: 18000 },
      { label: 'Activities', amount: 14000 },
      { label: 'Food desk', amount: 8000 },
    ],
    members: [
      { name: 'Aarav', amount: 15000, status: 'Paid' },
      { name: 'Neha', amount: 15000, status: 'Paid' },
      { name: 'Rohan', amount: 12000, status: 'Pending' },
      { name: 'Isha', amount: 15000, status: 'Paid' },
      { name: 'Dev', amount: 15000, status: 'Paid' },
    ],
    timeline: [
      { at: '20 Sep 11:02', title: 'Group invoice opened', body: 'Five-way split on Goa Friends Circuit.' },
      { at: '20 Sep 18:40', title: 'Four captures in', body: 'Aarav, Neha, Isha, and Dev paid. Rohan still open.' },
    ],
    transactions: [
      { id: 'txn-11090-a', at: '20 Sep 12:10', label: 'Aarav split', amount: 15000, method: 'UPI' },
      { id: 'txn-11090-n', at: '20 Sep 13:22', label: 'Neha split', amount: 15000, method: 'Card' },
      { id: 'txn-11090-i', at: '20 Sep 16:05', label: 'Isha split', amount: 15000, method: 'UPI' },
      { id: 'txn-11090-d', at: '20 Sep 18:40', label: 'Dev split', amount: 15000, method: 'Netbanking' },
    ],
  },
  {
    id: 'TF-WCC-11018',
    traveler: 'Isha Menon',
    tour: 'West Coast Circuit',
    tourId: 'op-isha',
    amount: 54800,
    collected: 30000,
    paymentStatus: 'Partial',
    date: '2026-09-18',
    invoiceNo: 'INV-11018',
    invoice: [
      { label: 'Air hold', amount: 9800 },
      { label: 'Candolim stay', amount: 28000 },
      { label: 'Activities & food', amount: 17000 },
    ],
    timeline: [
      { at: '18 Sep 09:40', title: 'Deposit received', body: '₹30,000 against INV-11018.' },
      { at: '18 Sep 09:41', title: 'Balance open', body: '₹24,800 still due before Novotel confirms.' },
    ],
    transactions: [
      { id: 'txn-11018', at: '18 Sep 09:40', label: 'Deposit', amount: 30000, method: 'Card' },
    ],
  },
  {
    id: 'TF-SPI-09031',
    traveler: 'Kabir Malhotra',
    tour: 'Spiti Shoulder',
    tourId: 'op-kabir',
    amount: 72000,
    collected: 0,
    paymentStatus: 'Pending',
    date: '2026-09-12',
    invoiceNo: 'INV-09031',
    invoice: [
      { label: 'Jeep + stay block', amount: 52000 },
      { label: 'Permits', amount: 8000 },
      { label: 'Guide desk', amount: 12000 },
    ],
    timeline: [
      { at: '12 Sep 15:10', title: 'Invoice issued', body: 'Group of 11 photographers. No capture yet.' },
    ],
    transactions: [],
  },
  {
    id: 'TF-JAI-10124',
    traveler: 'Neha Bansal',
    tour: 'Pink City Week',
    tourId: 'op-neha',
    amount: 41000,
    collected: 41000,
    paymentStatus: 'Paid',
    date: '2026-09-08',
    invoiceNo: 'INV-10124',
    invoice: [
      { label: 'Rambagh night', amount: 18600 },
      { label: 'Delhi–Jaipur hop', amount: 12400 },
      { label: 'Guides & meals', amount: 10000 },
    ],
    timeline: [
      { at: '08 Sep 10:02', title: 'Paid in full', body: 'UPI capture closed INV-10124.' },
    ],
    transactions: [
      { id: 'txn-10124', at: '08 Sep 10:02', label: 'Full capture', amount: 41000, method: 'UPI' },
    ],
  },
  {
    id: 'TF-BOM-10117',
    traveler: 'Dev Kapoor',
    tour: 'Island City FIT',
    tourId: 'op-dev',
    amount: 38500,
    collected: 38500,
    paymentStatus: 'Paid',
    date: '2026-09-14',
    invoiceNo: 'INV-10117',
    invoice: [
      { label: 'Fern Andheri', amount: 15200 },
      { label: 'Hops & food', amount: 23300 },
    ],
    timeline: [
      { at: '14 Sep 19:20', title: 'Paid in full', body: 'Card capture before the Ahmedabad hop.' },
    ],
    transactions: [
      { id: 'txn-10117', at: '14 Sep 19:20', label: 'Full capture', amount: 38500, method: 'Card' },
    ],
  },
  {
    id: 'TF-KER-11206',
    traveler: 'Anika Rao',
    tour: 'Backwaters & Spice',
    tourId: 'op-anika',
    amount: 46990,
    collected: 0,
    paymentStatus: 'Pending',
    date: '2026-09-22',
    invoiceNo: 'INV-11206',
    invoice: [
      { label: 'Houseboat hold', amount: 22000 },
      { label: 'Munnar stay', amount: 16000 },
      { label: 'Transfers', amount: 8990 },
    ],
    timeline: [
      { at: '22 Sep 11:30', title: 'Invoice issued', body: 'Waiting on houseboat confirmation before capture.' },
    ],
    transactions: [],
  },
  {
    id: 'TF-DEL-10091',
    traveler: 'Rajiv Nair',
    tour: 'Capital Circuit',
    tourId: 'op-raj',
    amount: 52000,
    collected: 0,
    paymentStatus: 'Refunded',
    date: '2026-09-09',
    invoiceNo: 'INV-10091',
    invoice: [
      { label: 'Delhi stay', amount: 24000 },
      { label: 'Air hop', amount: 18000 },
      { label: 'City desk', amount: 10000 },
    ],
    timeline: [
      { at: '09 Sep 08:00', title: 'Paid', body: '₹52,000 captured.' },
      { at: '09 Sep 21:14', title: 'Refund processed', body: 'Inbound delay. Full refund to source.' },
    ],
    transactions: [
      { id: 'txn-10091-in', at: '09 Sep 08:00', label: 'Capture', amount: 52000, method: 'UPI' },
      { id: 'txn-10091-out', at: '09 Sep 21:14', label: 'Refund', amount: -52000, method: 'UPI' },
    ],
    refund: { amount: 52000, reason: 'Inbound delay — traveler cancelled the Delhi morning.', status: 'Processed' },
  },
  {
    id: 'TF-GOA-08112',
    traveler: 'Naina Joshi',
    tour: 'South Goa Slow',
    tourId: 'op-naina',
    amount: 36000,
    collected: 18000,
    paymentStatus: 'Partial',
    date: '2026-09-21',
    invoiceNo: 'INV-08112',
    invoice: [
      { label: 'Palolem stay', amount: 22000 },
      { label: 'Wellness desk', amount: 14000 },
    ],
    timeline: [
      { at: '21 Sep 17:05', title: 'Deposit in', body: '₹18,000 held. Resort allotment still open.' },
    ],
    transactions: [
      { id: 'txn-08112', at: '21 Sep 17:05', label: 'Deposit', amount: 18000, method: 'UPI' },
    ],
  },
]

function paidCount(members?: SplitMember[]) {
  if (!members?.length) return null
  return { paid: members.filter((row) => row.status === 'Paid').length, total: members.length }
}

export function splitProgress(booking: LedgerBooking) {
  return paidCount(booking.members)
}

export function ledgerMetrics(rows: LedgerBooking[]) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const pending = rows
    .filter((row) => row.paymentStatus === 'Pending' || row.paymentStatus === 'Partial')
    .reduce((sum, row) => sum + Math.max(row.amount - row.collected, 0), 0)
  const completed = rows
    .filter((row) => row.paymentStatus === 'Paid' || row.paymentStatus === 'Partial')
    .reduce((sum, row) => sum + row.collected, 0)
  const refunds = rows
    .filter((row) => row.refund?.status === 'Processed' || row.paymentStatus === 'Refunded')
    .reduce((sum, row) => sum + (row.refund?.amount ?? row.amount), 0)
  return { total, pending, completed, refunds }
}

export function loadLedger(): LedgerBooking[] {
  const raw = localStorage.getItem(STORE)
  if (!raw) return seedLedger
  try {
    const patch = JSON.parse(raw) as Record<string, Partial<LedgerBooking>>
    return seedLedger.map((row) => {
      const next = patch[row.id]
      return next ? { ...row, ...next, members: next.members ?? row.members } : row
    })
  } catch {
    return seedLedger
  }
}

function persistPatch(id: string, patch: Partial<LedgerBooking>) {
  const raw = localStorage.getItem(STORE)
  const current = raw ? (JSON.parse(raw) as Record<string, Partial<LedgerBooking>>) : {}
  localStorage.setItem(STORE, JSON.stringify({ ...current, [id]: { ...current[id], ...patch } }))
}

export function requestRefund(id: string, amount: number, reason: string) {
  const row = loadLedger().find((item) => item.id === id)
  if (!row) return
  persistPatch(id, {
    refund: { amount, reason, status: 'Requested' },
    timeline: [
      { at: 'Just now', title: 'Refund requested', body: `${reason} · ₹${amount.toLocaleString('en-IN')}` },
      ...row.timeline,
    ],
  })
}

export function approveRefund(id: string) {
  const row = loadLedger().find((item) => item.id === id)
  if (!row?.refund) return
  persistPatch(id, {
    refund: { ...row.refund, status: 'Approved' },
    timeline: [{ at: 'Just now', title: 'Refund approved', body: 'Desk approved. Processing to source.' }, ...row.timeline],
  })
}

export function processRefund(id: string) {
  const row = loadLedger().find((item) => item.id === id)
  if (!row?.refund) return
  persistPatch(id, {
    paymentStatus: 'Refunded',
    collected: 0,
    refund: { ...row.refund, status: 'Processed' },
    transactions: [
      {
        id: `txn-rf-${id.slice(-4)}`,
        at: 'Just now',
        label: 'Refund',
        amount: -row.refund.amount,
        method: 'Source',
      },
      ...row.transactions,
    ],
    timeline: [{ at: 'Just now', title: 'Refund processed', body: 'Amount returned to the original instrument.' }, ...row.timeline],
  })
}

export function payTone(status: PayStatus): 'success' | 'warning' | 'neutral' | 'info' {
  if (status === 'Paid') return 'success'
  if (status === 'Partial') return 'warning'
  if (status === 'Pending') return 'info'
  return 'neutral'
}

export function toCsv(rows: LedgerBooking[]) {
  const header = ['Booking ID', 'Traveler', 'Tour', 'Amount', 'Payment Status', 'Date']
  const body = rows.map((row) => [row.id, row.traveler, row.tour, String(row.amount), row.paymentStatus, row.date])
  return [header, ...body]
    .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\n')
}
