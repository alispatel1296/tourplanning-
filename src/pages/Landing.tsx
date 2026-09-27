import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AudioLines,
  BadgeIndianRupee,
  Building2,
  LifeBuoy,
  Menu,
  Package,
  PencilLine,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
  Split,
  Users,
  Waypoints,
} from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { AILabel } from '@/components/domain/AICards'
import { AdaptationScene } from '@/pages/landing/AdaptationScene'
import { OperatorDeskPreview, TravelerPhonePreview } from '@/pages/landing/ExperiencePreviews'
import { useAppState } from '@/state/AppState'

const howSteps = [
  { id: '01', title: 'Tell us what you want', body: 'Dates, budget, style, and the cities you actually want to feel.' },
  { id: '02', title: 'AI builds your journey', body: 'A full node graph — trains, stays, meals, and activities — not a static PDF.' },
  { id: '03', title: 'Digital Twin checks feasibility', body: 'Inventory, weather, and punctuality are simulated before anything is held.' },
  { id: '04', title: 'Book & travel', body: 'Confirmed nodes move into the live companion for both traveler and operator.' },
  { id: '05', title: 'AI adapts when reality changes', body: 'Disruptions reroute the trip, keep the budget honest, and notify the field desk.' },
]

const intelligence = [
  {
    title: 'AI Recommendation Engine',
    body: 'Scores stays, trains, and meals against your brief.',
    preview: (
      <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
        <p className="text-[11px] font-semibold text-brand-800">Keep the train, move the stay</p>
        <p className="mt-1 text-[11px] text-slate-500">91% confidence</p>
      </div>
    ),
  },
  {
    title: 'Conflict Detection',
    body: 'Flags overbooks, swell warnings, and missed buffers.',
    preview: (
      <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
        Novotel waitlisted · high risk
      </div>
    ),
  },
  {
    title: 'Digital Twin Simulation',
    body: 'Every itinerary is stress-tested before it goes live.',
    preview: <ProgressRing value={86} label="feasible" size={64} />,
  },
  {
    title: 'Dynamic Rerouting',
    body: 'Yellow alternatives become green without rewriting the trip.',
    preview: (
      <div className="flex items-center gap-2 text-[11px]">
        <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">Baga</span>
        <span className="text-slate-300">→</span>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Panaji</span>
      </div>
    ),
  },
  {
    title: 'Budget Prediction',
    body: 'Spend is forecasted as holds confirm or slip.',
    preview: (
      <div>
        <p className="mb-1.5 text-[11px] text-slate-500">₹54,660 of ₹65,000</p>
        <ProgressBar value={84} tone="success" />
      </div>
    ),
  },
  {
    title: 'Voice Assistant',
    body: 'Ask for a quieter beach day or a later train in plain language.',
    preview: (
      <div className="flex items-center gap-2 rounded-lg border border-electric-100 bg-electric-50 px-3 py-2 text-[11px] text-electric-700">
        <AudioLines className="h-3.5 w-3.5" />
        Add a sunset slot in Candolim
      </div>
    ),
  },
]

const smartFeatures = [
  { icon: ShieldAlert, title: 'Auto Conflict Detection', body: 'Inventory, weather, and timing clashes surface before the guest feels them.' },
  { icon: RefreshCw, title: 'Dynamic Rerouting', body: 'The live graph rewrites itself when a node fails, without a new brochure.' },
  { icon: BadgeIndianRupee, title: 'Budget Health', body: 'Every swap shows the rupee impact against the original ceiling.' },
  { icon: Users, title: 'Group Sync', body: 'FIT and group movements stay on one departure file with a named lead.' },
  { icon: ScanSearch, title: 'Explainable AI', body: 'Recommendations say why — cost, risk, and the buffer they protect.' },
  { icon: Waypoints, title: 'Digital Twin', body: 'A simulated trip runs beside the booked one so feasibility never goes stale.' },
  { icon: LifeBuoy, title: 'SOS', body: 'One tap reaches the on-duty coordinator with location and last confirmed node.' },
  { icon: PencilLine, title: 'Post-trip AI Review', body: 'Notes feed the next corridor model so West Coast gets sharper each season.' },
  { icon: Building2, title: 'Vendor Matching', body: 'Hotels, rail, and activities are scored on reliability, not just price.' },
]

export function Landing() {
  const { signIn } = useAppState()
  const navigate = useNavigate()
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null)
  const [menu, setMenu] = useState(false)

  const enterTraveler = (path: string) => {
    signIn('traveler')
    navigate(path)
  }
  const enterOperator = () => {
    signIn('operator')
    navigate('/operator')
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="absolute inset-x-0 top-0 z-40 border-b border-white/20 bg-transparent">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-8">
          <Brand tone="dark" />
          <nav className="hidden items-center gap-10 text-[15px] font-medium text-white/90 lg:flex tracking-wide">
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#intelligence" className="hover:text-white transition-colors">
              Intelligence
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#walkthrough" className="hover:text-white transition-colors">
              Live walkthrough
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button type="button" onClick={enterOperator} className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.15em] text-white border border-white/30 px-6 py-2.5 transition-colors hover:bg-white/10">
              Operator
            </button>
            <button type="button" className="bg-[var(--color-muted-gold)] text-[var(--color-charcoal)] hover:bg-white/90 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors" onClick={() => enterTraveler('/traveler/plan')}>
              Plan a Journey &rarr;
            </button>
            <IconButton label="Menu" className="lg:hidden text-white hover:bg-white/10" onClick={() => setMenu((open) => !open)}>
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
        {menu ? (
          <div className="border-t border-white/10 bg-[var(--color-charcoal)] px-5 py-4 lg:hidden">
            <div className="flex flex-col gap-4 text-sm text-white">
              <a href="#how" onClick={() => setMenu(false)}>
                How it works
              </a>
              <a href="#features" onClick={() => setMenu(false)}>
                Features
              </a>
              <Link to="/login">Sign in</Link>
              <button type="button" className="text-left text-[var(--color-muted-gold)]" onClick={() => enterOperator()}>
                Operator desk
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* Massive Cinematic Hero */}
      <section className="relative h-screen min-h-[800px] flex items-center overflow-hidden bg-[var(--color-charcoal)] pt-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-charcoal)]/90 via-transparent to-black/30" />
        
        <div className="relative z-10 w-full px-5 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 max-w-2xl text-left">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--color-muted-gold)] uppercase mb-6">
              The travel operating system
            </p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-[5rem] lg:text-[6rem] font-bold tracking-tight text-white leading-[0.95] mb-6 flex flex-col uppercase">
              <span>Plan it.</span>
              <span>Break it.</span>
              <span>Watch it<br/>recover.</span>
            </h1>
            
            <p className="mt-4 text-lg md:text-[19px] text-white/90 font-sans font-medium tracking-wide leading-relaxed max-w-md">
              Five capabilities keep travel feasible. Language is not one of them.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <button 
                type="button"
                className="bg-[var(--color-muted-gold)] text-[var(--color-charcoal)] px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase transition-transform hover:scale-105 flex items-center gap-2"
                onClick={() => enterTraveler('/traveler/plan')}
              >
                Plan a journey &rarr;
              </button>
              
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] text-white/70 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live travel intelligence
              </div>
            </div>
          </div>

          {/* Right Glass Card */}
          <div className="hidden lg:block w-[420px]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-5">
                Kerala &middot; 6 Days &middot; 4 Travelers
              </p>
              <div className="flex flex-col gap-2 font-display text-[26px] font-medium tracking-wide text-white uppercase mb-8 leading-tight">
                <span>Ahmedabad &rarr; Kochi &rarr;</span>
                <span>Munnar</span>
                <span>&rarr; Alleppey</span>
              </div>
              <p className="text-[32px] font-light text-[var(--color-muted-gold)] tracking-wide mb-4">
                ₹78,420 <span className="text-sm font-medium">EST.</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Journey Healthy
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="section-title max-w-xl">
          Traditional tours are static.
          <br />
          Real journeys aren't.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ProblemCard
            icon={<Package className="h-5 w-5 text-slate-500" />}
            title="Fixed packages"
            body="A printed circuit cannot absorb a missed train, a waitlisted hotel, or a swell warning in Baga."
          />
          <ProblemCard
            icon={<PencilLine className="h-5 w-5 text-amber-600" />}
            title="Manual changes"
            body="WhatsApp threads and spreadsheet holds break the moment two vendors move at once."
          />
          <ProblemCard
            icon={<Split className="h-5 w-5 text-rose-600" />}
            title="Disconnected operations"
            body="The traveler, coordinator, and hotel live in different tools, so nobody owns the live itinerary."
          />
        </div>
        <div className="mt-6 flex flex-col items-center">
          <div className="h-8 w-px bg-brand-300" />
          <div className="w-full rounded-xl border border-brand-100 bg-brand-50 px-5 py-4 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-700">TripFlow replaces all three</p>
            <p className="mt-1 text-sm text-slate-600">
              One living itinerary graph for the traveler, and one operations desk for the operator.
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="meta">How it works</p>
          <h2 className="section-title mt-2">From brief to live adaptation</h2>
          <div className="mt-8 overflow-x-auto app-scrollbar">
            <ol className="flex min-w-[820px] gap-0">
              {howSteps.map((step, index) => (
                <li key={step.id} className="relative flex-1 px-3">
                  <div className="mb-4 flex items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[12px] font-semibold text-white">
                      {step.id}
                    </span>
                    {index < howSteps.length - 1 ? <span className="ml-3 h-px flex-1 bg-brand-200" /> : null}
                  </div>
                  <h3 className="card-title">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="intelligence" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <p className="meta">Intelligence</p>
        <h2 className="section-title mt-2">An itinerary that thinks ahead.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {intelligence.map((item) => (
            <Card key={item.title} className="transition-shadow hover:shadow-md">
              <AILabel />
              <h3 className="card-title mt-3">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              <div className="mt-4">{item.preview}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
          <TravelerPhonePreview />
          <div>
            <p className="meta">Traveler experience</p>
            <h2 className="section-title mt-2">Plan once. Adapt automatically.</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li>Personalized planning against style, stay class, and a real INR budget.</li>
              <li>Yellow alternatives sit beside the green route until you select one.</li>
              <li>Feasibility checking happens before tickets and rooms are committed.</li>
              <li>Live disruption handling rewrites the day without a call to a call center.</li>
              <li>Budget tracking shows what is spent, held, and still free to use.</li>
            </ul>
            <Button type="button" className="mt-6" onClick={() => enterTraveler('/traveler')}>
              Open traveler workspace
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="meta">Operator experience</p>
            <h2 className="section-title mt-2">A command center, not a brochure site.</h2>
            <p className="mt-3 text-sm text-slate-600">
              Horizon Trails sees every departure, vendor hold, and AI-detected conflict on one desk. Coordinators get a
              named owner. Guests keep a living itinerary.
            </p>
            <Button type="button" className="mt-6" variant="secondary" onClick={enterOperator}>
              View operator desk
            </Button>
          </div>
          <OperatorDeskPreview />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="meta">Smart features</p>
          <h2 className="section-title mt-2">Operational intelligence, not travel garnish.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {smartFeatures.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="card-title mt-3">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{feature.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="walkthrough" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <p className="meta">Live scenario</p>
        <h2 className="section-title mt-2">Watch a trip adapt itself.</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          A Baga water-sports morning meets a rain cell. TripFlow turns the activity red, proposes an indoor food
          experience, then locks the new green route.
        </p>
        <div className="mt-6">
          <AdaptationScene />
        </div>
      </section>

      <section className="border-t border-line bg-navy py-16 text-white">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="font-display text-[32px] font-semibold tracking-tight sm:text-[36px]">
            Build a trip that can handle reality.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Start as Aarav Shah on the West Coast Circuit, or open the Horizon Trails operations desk.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" size="lg" onClick={() => enterTraveler('/traveler/plan')}>
              Start Planning
            </Button>
            <Button type="button" size="lg" variant="secondary" onClick={enterOperator}>
              View operator desk
            </Button>
          </div>
        </div>
      </section>

      <footer id="company" className="border-t border-white/10 bg-navy pb-10 text-slate-400">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand tone="dark" />
            <p className="mt-3 text-[13px] leading-relaxed">
              Personalized dynamic tour planning and tour operations. Built in India for corridors that actually move.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: 'Product', href: '#intelligence' },
              { label: 'How it works', href: '#how' },
              { label: 'Features', href: '#features' },
            ]}
          />
          <FooterCol
            title="Platform"
            links={[
              { label: 'Traveler', onClick: () => enterTraveler('/traveler') },
              { label: 'Operator', onClick: enterOperator },
              { label: 'Contact', href: 'mailto:hello@tripflow.ai' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: 'Company', href: '#company' },
              { label: 'Privacy', onClick: () => setLegal('privacy') },
              { label: 'Terms', onClick: () => setLegal('terms') },
            ]}
          />
        </div>
        <p className="mx-auto mt-8 max-w-6xl px-5 text-[12px] text-slate-500">© 2026 TripFlow AI</p>
      </footer>

      <Modal
        open={legal !== null}
        onClose={() => setLegal(null)}
        title={legal === 'privacy' ? 'Privacy' : 'Terms'}
      >
        {legal === 'privacy' ? (
          <p className="text-sm text-slate-600">
            TripFlow AI stores role and trip state only in this browser session. No traveler documents or payment
            details leave the device. Production workspaces will keep itineraries in the operator region you choose.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Bookings, inventory holds, and weather signals in this workspace let you evaluate the workflow. They are
            not confirmed reservations with IRCTC, IndiGo, or any hotel.
          </p>
        )}
        <Button type="button" className="mt-4" variant="secondary" onClick={() => setLegal(null)}>
          Close
        </Button>
      </Modal>
    </div>
  )
}

function ProblemCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">{icon}</div>
      <h3 className="card-title mt-3">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </Card>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href?: string; onClick?: () => void }[]
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-3 flex flex-col items-start gap-2 text-sm">
        {links.map((link) =>
          link.href ? (
            <a key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </a>
          ) : (
            <button type="button" key={link.label} onClick={link.onClick} className="hover:text-white">
              {link.label}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

