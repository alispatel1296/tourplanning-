import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { AILabel } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { travelerAarav } from '@/data/demo'
import { cn } from '@/lib/cn'
import {
  Shield,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  HeartPulse,
  Save,
  Zap,
  Plus,
  LogOut,
  ArrowRightLeft,
} from 'lucide-react'

type TabId = 'personal' | 'ai-dna' | 'emergency' | 'billing'

export function TravelerProfile() {
  const { user, signOut, signIn, pushToast } = useAppState()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('personal')

  // Editable Form State
  const [name, setName] = useState(user?.name ?? travelerAarav.name)
  const [email, setEmail] = useState(user?.email ?? travelerAarav.email)
  const [phone, setPhone] = useState(user?.phone ?? travelerAarav.phone)
  const [city, setCity] = useState(travelerAarav.city)
  const [stayPref, setStayPref] = useState(travelerAarav.preferredStay)
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'intense'>('balanced')

  // Interests state
  const [interests, setInterests] = useState<string[]>(travelerAarav.interests)
  const [travelStyles, setTravelStyles] = useState<string[]>(travelerAarav.travelStyle)
  const [newInterestInput, setNewInterestInput] = useState('')

  // Emergency contact state
  const [emergName, setEmergName] = useState('Devang Shah')
  const [emergPhone, setEmergPhone] = useState('+91 98251 44320')
  const [emergRelation, setEmergRelation] = useState('Brother')
  const [autoShareEmergency, setAutoShareEmergency] = useState(true)

  // GST & Billing
  const [gstin, setGstin] = useState('24ABCDE1234F1Z5')
  const [companyName, setCompanyName] = useState('Shah Trade Logistics Pvt Ltd')

  const availableInterests = [
    'Food & Culinary',
    'Beaches',
    'Culture & Heritage',
    'Adventure & Trekking',
    'Photography',
    'Nightlife & Clubs',
    'Water Sports',
    'Architecture',
    'Sunset Spots',
    'Local Bazaars',
  ]

  const availableStyles = ['Adventure', 'Food', 'Relaxation', 'Luxury', 'Backpacking', 'Solo Hop']

  const toggleInterest = (item: string) => {
    setInterests((prev) => {
      const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
      pushToast({
        title: prev.includes(item) ? `Removed ${item}` : `Added ${item}`,
        body: 'AI Planner preferences updated for future trip generation.',
      })
      return next
    })
  }

  const toggleStyle = (style: string) => {
    setTravelStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    )
  }

  const handleAddCustomInterest = () => {
    if (!newInterestInput.trim()) return
    const val = newInterestInput.trim()
    if (!interests.includes(val)) {
      setInterests((prev) => [...prev, val])
      pushToast({ title: 'Interest Added', body: `${val} added to your AI DNA profile.` })
    }
    setNewInterestInput('')
  }

  const handleSaveProfile = () => {
    pushToast({
      title: 'Profile Updated ✓',
      body: 'Your traveler DNA, security preferences, and emergency info have been saved.',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traveler Profile & AI DNA"
        description="Manage your personal information, emergency safety preferences, and travel DNA used by the dynamic engine."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
type="button"               size="sm"
              variant="secondary"
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 font-bold"
              onClick={() => {
                signIn('operator')
                navigate('/operator')
              }}
              icon={<ArrowRightLeft className="h-3.5 w-3.5 text-brand-400" />}
            >
              Switch to Operator Portal
            </Button>
            <Button
type="button"               size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-bold"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
              icon={<LogOut className="h-3.5 w-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        }
      />

      {/* Hero Profile Banner */}
      <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar initials={user?.avatarInitials ?? 'AS'} size="lg" className="h-16 w-16 text-xl font-extrabold ring-4 ring-brand-500/40" />
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-slate-900" title="Live Companion Active" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold text-white">{name}</h1>
                <Badge tone="ai" className="bg-brand-500/20 text-brand-300 border-brand-400/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  TripFlow Platinum Member
                </Badge>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  {city}, India
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-brand-400" />
                  {email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-brand-400" />
                  {phone}
                </span>
              </div>
            </div>
          </div>

          <Button
type="button"             size="sm"
            className="bg-[#3FA772] hover:bg-[#32895d] text-white font-extrabold shadow-md"
            onClick={handleSaveProfile}
            icon={<Save className="h-4 w-4" />}
          >
            Save All Changes
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-4 text-xs">
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Circuits Completed</p>
            <p className="mt-1 text-lg font-extrabold text-white">4 Dynamic Trips</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-300">AI Adaptation Score</p>
            <p className="mt-1 text-lg font-extrabold text-brand-300">98% Match Rate</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">AI Reroutes Handled</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-400">3 Weather Shifts</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assigned Coordinator</p>
            <p className="mt-1 text-lg font-extrabold text-white">Rohan Desai (Goa)</p>
          </div>
        </div>
      </Card>

      {/* Profile Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(val) => setActiveTab(val as TabId)}
        tabs={[
          { id: 'personal', label: 'Personal Details & Security' },
          { id: 'ai-dna', label: 'AI Travel DNA & Preferences' },
          { id: 'emergency', label: 'Emergency Contacts & Safety' },
          { id: 'billing', label: 'Payment & GST Billing' },
        ]}
      />

      {/* Tab 1: Personal Details & Security */}
      {activeTab === 'personal' && (
        <Card className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="section-title">Personal Details</h2>
              <p className="meta mt-0.5">Used for trip bookings, hotel check-in vouchers, and ticket generation.</p>
            </div>
            <Shield className="h-5 w-5 text-brand-600" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Home City & Country</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-line pt-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Identity & Verification</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-line bg-slate-50/50 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Govt ID / Passport Reference</p>
                  <p className="meta mt-0.5">Masked for privacy: Z849****20</p>
                </div>
                <Badge tone="success">Verified ✓</Badge>
              </div>

              <div className="rounded-xl border border-line bg-slate-50/50 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Languages Spoken</p>
                  <p className="meta mt-0.5">Gujarati, Hindi, English</p>
                </div>
                <Badge tone="info">3 Languages</Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" className="bg-brand-600 hover:bg-brand-700 text-white font-bold" onClick={handleSaveProfile}>
              Save Personal Information
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 2: AI Travel DNA & Preferences */}
      {activeTab === 'ai-dna' && (
        <Card className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="section-title">AI Travel DNA</h2>
                <AILabel />
              </div>
              <p className="meta mt-0.5">The recommendation engine uses these rules to weight itinerary nodes and alternative suggestions.</p>
            </div>
            <Zap className="h-5 w-5 text-amber-500" />
          </div>

          {/* Travel Pace Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Preferred Travel Pace</label>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              {[
                { id: 'relaxed', title: 'Relaxed Pace', desc: '1–2 stops per day · Long meals & leisure' },
                { id: 'balanced', title: 'Balanced Circuit', desc: '2–3 stops per day · Optimal mix of sightseeing' },
                { id: 'intense', title: 'High Intensity', desc: '4+ stops per day · Maximum coverage & action' },
              ].map((item) => (
                <button
type="button"                   key={item.id}
                  onClick={() => setPace(item.id as typeof pace)}
                  className={cn(
                    'rounded-xl border p-3.5 text-left transition-all',
                    pace === item.id
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-line bg-white hover:border-slate-300',
                  )}
                >
                  <p className="font-extrabold text-slate-900">{item.title}</p>
                  <p className="meta mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stay Preference */}
          <div className="space-y-2 border-t border-line pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Accommodation Tier Preference</label>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {[
                'Premium 3-star / 4-star Boutique Hotels',
                'Luxury 5-star Resorts & Villas',
                'Authentic Heritage Homestays',
                'Eco-Lodge / Glamping Cabins',
              ].map((tier) => (
                <button
type="button"                   key={tier}
                  onClick={() => setStayPref(tier)}
                  className={cn(
                    'rounded-xl border p-3 text-left font-bold transition-all',
                    stayPref === tier
                      ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-xs'
                      : 'border-line bg-slate-50 text-slate-700 hover:bg-slate-100',
                  )}
                >
                  {stayPref === tier ? '✓ ' : ''}{tier}
                </button>
              ))}
            </div>
          </div>

          {/* Interests Pill Grid */}
          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Primary Travel Interests</label>
              <span className="text-[11px] font-semibold text-brand-700">{interests.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableInterests.map((item) => {
                const active = interests.includes(item)
                return (
                  <button
type="button"                     key={item}
                    onClick={() => toggleInterest(item)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all border',
                      active
                        ? 'border-brand-500 bg-brand-600 text-white shadow-xs'
                        : 'border-line bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    {active ? '✓ ' : '+ '}{item}
                  </button>
                );
              })}
            </div>

            {/* Custom Interest Input */}
            <div className="flex gap-2 pt-2 max-w-md">
              <input
                type="text"
                placeholder="Add custom interest (e.g. Scuba Diving)..."
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                className="flex-1 rounded-xl border border-line bg-slate-50 py-1.5 px-3 text-xs font-medium focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddCustomInterest} icon={<Plus className="h-3.5 w-3.5" />}>
                Add
              </Button>
            </div>
          </div>

          {/* Travel Style Badges */}
          <div className="space-y-2 border-t border-line pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Travel Style Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableStyles.map((style) => {
                const active = travelStyles.includes(style)
                return (
                  <button key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold transition-all border',
                      active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 opacity-70',
                    )}
                  >
                    {active ? '✓ ' : ''}{style}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" className="bg-brand-600 hover:bg-brand-700 text-white font-bold" onClick={handleSaveProfile}>
              Save Travel DNA Rules
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 3: Emergency Contacts & Safety */}
      {activeTab === 'emergency' && (
        <Card className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="section-title">Emergency Contacts & Live Safety</h2>
              <p className="meta mt-0.5">This information is shared with your assigned field coordinator when you trigger an SOS signal.</p>
            </div>
            <HeartPulse className="h-5 w-5 text-rose-500" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergName}
                onChange={(e) => setEmergName(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={emergPhone}
                onChange={(e) => setEmergPhone(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                value={emergRelation}
                onChange={(e) => setEmergRelation(e.target.value)}
                className="w-full rounded-xl border border-line bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoShareEmergency}
                  onChange={(e) => setAutoShareEmergency(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="font-extrabold text-xs text-rose-900">
                  Auto-Share Emergency Medical Card with Coordinator Rohan
                </span>
              </label>
              <Badge tone="danger">Safety Active</Badge>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              When enabled, triggering an SOS on the Live Trip page will immediately transmit your location, blood group (B+), and primary emergency contact to the Horizon Trails control desk.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" className="bg-brand-600 hover:bg-brand-700 text-white font-bold" onClick={handleSaveProfile}>
              Save Emergency Contacts
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 4: Payment & GST Billing */}
      {activeTab === 'billing' && (
        <Card className="space-y-6 p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="section-title">Payment & GST Billing</h2>
              <p className="meta mt-0.5">Save payment details and tax information for automated trip invoicing.</p>
            </div>
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-slate-50 p-4 space-y-2">
              <p className="text-xs font-extrabold text-slate-900">Saved Payment Methods</p>
              <div className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-line text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  HDFC Visa Signature (•••• 4029)
                </span>
                <Badge tone="success">Primary</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-line text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  UPI: aarav.shah@okicici
                </span>
                <Badge tone="neutral">Saved</Badge>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-extrabold text-slate-900">Business GST Tax Invoice Details</p>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white py-1.5 px-3 text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white py-1.5 px-3 text-xs font-medium text-slate-900 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" className="bg-brand-600 hover:bg-brand-700 text-white font-bold" onClick={handleSaveProfile}>
              Save Payment Preferences
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

