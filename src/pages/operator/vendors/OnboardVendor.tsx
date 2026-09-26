import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { useAppState } from '@/state/AppState'
import { persistVendor, type MarketVendor, type VendorAvail, type VendorCategory } from '@/pages/operator/vendors/catalog'

const steps = ['Identity', 'Commercials', 'Documents'] as const

export function OnboardVendor({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (vendor: MarketVendor) => void
}) {
  const { pushToast } = useAppState()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    category: 'hotel' as VendorCategory,
    location: '',
    contact: '',
    pricing: '',
    availability: 'Confirmed' as VendorAvail,
    documents: '',
  })

  const reset = () => {
    setStep(0)
    setForm({
      name: '',
      category: 'hotel',
      location: '',
      contact: '',
      pricing: '',
      availability: 'Confirmed',
      documents: '',
    })
  }

  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }))

  const submit = () => {
    if (!form.name.trim() || !form.location.trim() || !form.contact.trim()) {
      pushToast({ title: 'Complete the file', body: 'Name, location, and contact are required.' })
      return
    }
    const vendor: MarketVendor = {
      id: `mv-${crypto.randomUUID().slice(0, 6)}`,
      name: form.name.trim(),
      category: form.category,
      city: form.location.trim(),
      locations: [form.location.trim()],
      rating: 4.4,
      priceBand: form.pricing.trim() || 'On request',
      availability: form.availability,
      status: 'active',
      contact: form.contact.trim(),
      phone: '',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=70',
      about: 'Newly onboarded to the reusable vendor desk.',
      pricing: [form.pricing.trim() || 'Rate card pending'],
      performance: { onTime: 90, disputes: 0, repeats: 0 },
      reviews: [],
      cancellation: 'To be attached with the contract.',
      documents: form.documents.split(',').map((item) => item.trim()).filter(Boolean),
    }
    persistVendor(vendor)
    pushToast({ title: 'Vendor onboarded', body: `${vendor.name} can now be assigned to any customized tour.` })
    reset()
    onSave(vendor)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add vendor"
    >
      <p className="meta mb-3">
        Step {step + 1} of 3 · {steps[step]}
      </p>
      {step === 0 ? (
        <div className="space-y-3">
          <Field label="Name" value={form.name} onChange={(name) => set({ name })} />
          <label className="block text-[12px] font-medium text-slate-500">
            Category
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm"
              value={form.category}
              onChange={(event) => set({ category: event.target.value as VendorCategory })}
            >
              <option value="hotel">Hotels</option>
              <option value="transport">Transport</option>
              <option value="activity">Activities</option>
              <option value="restaurant">Restaurants</option>
              <option value="guide">Guides</option>
            </select>
          </label>
          <Field label="Location" value={form.location} onChange={(location) => set({ location })} />
        </div>
      ) : null}
      {step === 1 ? (
        <div className="space-y-3">
          <Field label="Contact" value={form.contact} onChange={(contact) => set({ contact })} />
          <Field label="Pricing" value={form.pricing} onChange={(pricing) => set({ pricing })} />
          <label className="block text-[12px] font-medium text-slate-500">
            Availability
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm"
              value={form.availability}
              onChange={(event) => set({ availability: event.target.value as VendorAvail })}
            >
              <option>Confirmed</option>
              <option>Limited</option>
              <option>Waitlist</option>
              <option>Seasonal</option>
            </select>
          </label>
        </div>
      ) : null}
      {step === 2 ? (
        <Field
          label="Documents"
          value={form.documents}
          onChange={(documents) => set({ documents })}
          hint="Comma-separated. Demo only — nothing is uploaded."
        />
      ) : null}
      <div className="mt-5 flex justify-between">
        <Button
type="button"           variant="secondary"
          onClick={() => {
            if (step === 0) {
              reset()
              onClose()
              return
            }
            setStep(step - 1)
          }}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < 2 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button type="button" onClick={submit}>Add to marketplace</Button>
        )}
      </div>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-line px-3 text-sm" />
      {hint ? <span className="meta mt-1 block">{hint}</span> : null}
    </label>
  )
}
