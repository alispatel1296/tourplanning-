export const BOOKING_KEY = 'tf-checkout'
export const DEMO_BOOKING_ID = 'TF-2026-10482'

export type PayMethod = 'upi' | 'card' | 'netbanking'

export interface CheckoutRecord {
  bookingId: string
  tripId: string
  total: number
  method: PayMethod
  paidAt: string
}

export function loadCheckout(): CheckoutRecord | null {
  const raw = localStorage.getItem(BOOKING_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CheckoutRecord
  } catch {
    return null
  }
}

export function persistCheckout(record: CheckoutRecord) {
  localStorage.setItem(BOOKING_KEY, JSON.stringify(record))
}

export function clearCheckout() {
  localStorage.removeItem(BOOKING_KEY)
}
