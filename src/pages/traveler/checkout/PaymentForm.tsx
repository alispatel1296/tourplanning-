import { Building2, CreditCard, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { PayMethod } from '@/lib/booking'

const methods: { id: PayMethod; label: string; hint: string; icon: typeof CreditCard }[] = [
  { id: 'upi', label: 'UPI', hint: 'GPay · PhonePe · Paytm', icon: Smartphone },
  { id: 'card', label: 'Credit/Debit Card', hint: 'Visa · Mastercard · RuPay', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', hint: 'All major Indian banks', icon: Building2 },
]

const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra']

export interface PaymentValues {
  method: PayMethod
  upi: string
  cardName: string
  cardNumber: string
  expiry: string
  cvv: string
  bank: string
}

export const emptyPayment: PaymentValues = {
  method: 'upi',
  upi: '',
  cardName: 'Aarav Shah',
  cardNumber: '',
  expiry: '',
  cvv: '',
  bank: '',
}

export function validatePayment(values: PaymentValues) {
  if (values.method === 'upi') {
    if (!/^[a-z0-9._-]{2,}@[a-z]{2,}$/i.test(values.upi.trim())) {
      return 'Enter a UPI ID like aarav@okhdfcbank'
    }
  }
  if (values.method === 'card') {
    if (values.cardNumber.replace(/\s/g, '').length < 16) return 'Enter a 16-digit card number'
    if (!/^\d{2}\/\d{2}$/.test(values.expiry)) return 'Enter expiry as MM/YY'
    if (!/^\d{3}$/.test(values.cvv)) return 'Enter a 3-digit CVV'
    if (values.cardName.trim().length < 3) return 'Enter the name on the card'
  }
  if (values.method === 'netbanking' && !values.bank) {
    return 'Select a bank to continue'
  }
  return null
}

export function PaymentForm({
  values,
  onChange,
  error,
  onPay,
}: {
  values: PaymentValues
  onChange: (next: PaymentValues) => void
  error: string | null
  onPay: () => void
}) {
  const set = (patch: Partial<PaymentValues>) => onChange({ ...values, ...patch })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="warning">Demo payment</Badge>
        <p className="text-[13px] text-slate-500">Simulated only — no money is charged.</p>
      </div>

      <div className="grid gap-2">
        {methods.map((method) => {
          const Icon = method.icon
          const active = values.method === method.id
          return (
            <button key={method.id}
              type="button"
              onClick={() => set({ method: method.id })}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-left',
                active ? 'border-brand-300 bg-brand-50' : 'border-line bg-white hover:bg-slate-50',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  active ? 'bg-white text-brand-700' : 'bg-slate-50 text-slate-500',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{method.label}</span>
                <span className="meta">{method.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-3">
        {values.method === 'upi' ? (
          <>
            <Field
              label="UPI ID"
              value={values.upi}
              placeholder="aarav@okhdfcbank"
              onChange={(upi) => set({ upi })}
            />
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-center">
              <div className="mx-auto grid h-28 w-28 grid-cols-5 gap-1 rounded-lg bg-white p-2">
                {Array.from({ length: 25 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn('rounded-[2px]', [0, 4, 20, 24, 6, 8, 12, 16, 18].includes(index) ? 'bg-ink' : 'bg-slate-200')}
                  />
                ))}
              </div>
              <p className="mt-3 text-[12px] font-medium text-brand-800">Demo QR · TripFlow Pay</p>
              <p className="meta">Scan is simulated. Confirm uses the UPI ID above.</p>
            </div>
          </>
        ) : null}

        {values.method === 'card' ? (
          <>
            <Field label="Name on card" value={values.cardName} onChange={(cardName) => set({ cardName })} />
            <Field
              label="Card number"
              value={values.cardNumber}
              placeholder="4111 1111 1111 1111"
              inputMode="numeric"
              onChange={(cardNumber) => set({ cardNumber: formatCard(cardNumber) })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Expiry"
                value={values.expiry}
                placeholder="10/28"
                onChange={(expiry) => set({ expiry: formatExpiry(expiry) })}
              />
              <Field
                label="CVV"
                value={values.cvv}
                placeholder="123"
                type="password"
                onChange={(cvv) => set({ cvv: cvv.replace(/\D/g, '').slice(0, 3) })}
              />
            </div>
          </>
        ) : null}

        {values.method === 'netbanking' ? (
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-slate-500">Select bank</span>
            <select
              value={values.bank}
              onChange={(event) => set({ bank: event.target.value })}
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
            >
              <option value="">Choose a bank</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-[13px] text-rose-600">{error}</p> : null}

      <Button type="button" className="mt-5 w-full" size="lg" onClick={onPay}>
        Confirm & Pay
      </Button>
      <p className="mt-2 text-center text-[12px] text-slate-500">
        By confirming you accept a simulated hold on this demo itinerary. No gateway is contacted.
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'numeric'
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-brand-300"
      />
    </label>
  )
}

function formatCard(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}
