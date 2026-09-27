import { useMemo, useState, type ReactNode } from 'react'
import './steps.css'
import { CoverImage } from '@/components/ui/CoverImage'
import { placeCover } from '@/lib/covers'
import { searchDestinations } from '@/services/travel/TravelDataService'
import type { TravelEntity } from '@/services/travel/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  Baby,
  Camera,
  ChevronLeft,
  ChevronRight,
  FerrisWheel,
  Footprints,
  Minus,
  Mountain,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Wallet,
  Waves,
  Wine,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  Zap,
  Heart,
  Car,
  Train,
  Plane,
  Bus,
  ArrowRight,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Timeline, TimelineNode } from '@/components/ui/Timeline'
import { AIInsightCard } from '@/components/domain/AICards'
import { RoutePreview } from '@/pages/traveler/plan/RoutePreview'
import {
  budgetAllocation,
  dateRangeLabel,
  DEMO_PLAN_BRIEF,
  DEMO_PLAN_CITIES,
  parseBrief,
  routeLabel,
  styleOptions,
  styleSummary,
  suggestedPlaces,
  tripDuration,
} from '@/lib/plan'
import { cn, formatINR } from '@/lib/cn'
import type { Companion, Intensity, StayClass, TransportPref, TripPlan } from '@/types/plan'

/* ─────────────────── Icon maps ─────────────────────────── */
const styleIcons: Record<string, typeof Mountain> = {
  Adventure: Mountain,
  Relaxation: Waves,
  Food: UtensilsCrossed,
  Culture: FerrisWheel,
  Nightlife: Wine,
  Nature: Trees,
  Luxury: Sparkles,
  Budget: Wallet,
  Photography: Camera,
  Shopping: ShoppingBag,
  Beach: Waves,
}

const transportIcons: Record<string, typeof Train> = {
  Train: Train,
  Flight: Plane,
  Bus: Bus,
  Car: Car,
  Mixed: Zap,
}

/* ─────────────────── Shared sub-components ─────────────── */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="step-section-label">{children}</p>
  )
}

function StepHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string
  title: string
  subtitle: string
}) {
  return (
    <div className="step-header">
      <span className="step-header-emoji">{emoji}</span>
      <div>
        <h2 className="step-header-title">{title}</h2>
        <p className="step-header-subtitle">{subtitle}</p>
      </div>
    </div>
  )
}

function AIBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="ai-bubble"
    >
      <div className="ai-bubble-avatar">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <p className="ai-bubble-text">{text}</p>
    </motion.div>
  )
}

/* ─────────────────── STEP 1: Destination ───────────────── */
export function DestinationStep({
  plan,
  onChange,
  onVoice,
}: {
  plan: TripPlan
  onChange: (patch: Partial<TripPlan>) => void
  onVoice: () => void
}) {
  const [query, setQuery] = useState(plan.brief)
  const parsed = parseBrief(query)
  const [liveDest, setLiveDest] = useState<TravelEntity[]>([])
  const [liveNote, setLiveNote] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [originEdit, setOriginEdit] = useState(false)
  const [originDraft, setOriginDraft] = useState(plan.origin)

  const applySearch = () => {
    const next = parseBrief(query)
    const cityQuery = query.trim().split(/\s+/).length <= 3 && !/\d|under|budget|beach trip/i.test(query)
    onChange({
      brief: query,
      destinations: next.destinations.length ? next.destinations.slice(0, 2) : plan.destinations,
      styles: next.styles.length ? [...new Set([...plan.styles, ...next.styles])] : plan.styles,
      endDate: next.days
        ? format(addDays(parseISO(plan.startDate), next.days - 1), 'yyyy-MM-dd')
        : plan.endDate,
    })
    setSearching(true)
    void searchDestinations(query || '7 day trip from Ahmedabad under 70000')
      .then((result) => {
        setLiveDest(result.items.slice(0, 6))
        setLiveNote(
          result.message ??
            (result.items.length ? 'Live results via Google / SerpApi' : null),
        )
        if (!next.destinations.length && cityQuery && result.items[0]?.name) {
          const city = result.items[0].name.split(',')[0].trim()
          if (city) onChange({ destinations: [city], brief: query })
        }
      })
      .catch(() => setLiveNote('Live search temporarily unavailable.'))
      .finally(() => setSearching(false))
  }

  const visiblePlaces = suggestedPlaces.filter((place) => {
    const q = query.trim().toLowerCase()
    const placeSearch = q.length > 1 && q.split(/\s+/).length <= 2 && !/\d|under|budget|days|trip/i.test(q)
    if (!placeSearch) return true
    return (
      place.name.toLowerCase().includes(q) ||
      place.state.toLowerCase().includes(q) ||
      place.tagline.toLowerCase().includes(q)
    )
  })

  const toggleCity = (name: string) => {
    // Extract clean city name (before comma) and title-case it
    const cleanName = name.split(',')[0].trim()
    const selected = plan.destinations.includes(cleanName)
    if (selected) {
      onChange({ destinations: plan.destinations.filter((c) => c !== cleanName) })
      return
    }
    onChange({
      destinations: plan.destinations.length >= 2 ? [plan.destinations[0], cleanName] : [...plan.destinations, cleanName],
    })
  }

  const applyOrigin = () => {
    const trimmed = originDraft.trim()
    if (trimmed) onChange({ origin: trimmed })
    setOriginEdit(false)
  }

  return (
    <div className="step-root">
      <StepHeader
        emoji="📍"
        title="Where do you want to go?"
        subtitle="Write two cities. The live planner builds a full day-wise itinerary from Ahmedabad."
      />

      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">Two-city circuit</p>
        <p className="mt-1 text-sm text-slate-700">
          Type <strong>Jaipur and Udaipur</strong> (or tap the button). Then continue and Generate. The circuit is composed
          live and saved under <strong>My Trips → Upcoming</strong> — not Ongoing.
        </p>
        <button
          type="button"
          className="mt-3 rounded-full bg-[var(--color-charcoal)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          onClick={() => {
            setQuery(DEMO_PLAN_BRIEF)
            onChange({
              brief: DEMO_PLAN_BRIEF,
              destinations: [...DEMO_PLAN_CITIES],
              styles: [...new Set([...plan.styles, 'Culture', 'Food', 'Photography'])],
            })
          }}
        >
          Fill Jaipur + Udaipur
        </button>
      </div>

      <AIBubble text='Write exactly: "Jaipur and Udaipur, 6 days from Ahmedabad". Two cities only — the backend returns the full day-by-day output.' />

      {/* Search bar */}
      <div className="dest-search-row">
        <div className="dest-search-wrap">
          <Search className="dest-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder='Jaipur and Udaipur, 6 days from Ahmedabad'
            className="dest-search-input"
          />
          {searching && <Loader2 className="dest-search-spinner animate-spin" />}
        </div>
        <button type="button" onClick={applySearch} className="dest-search-btn" disabled={searching}>
          Search
        </button>
        <button
          type="button"
          onClick={onVoice}
          className="dest-voice-btn"
          title="Tell TripFlow by voice"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </button>
      </div>

      {/* Applied brief tag */}
      {query && (
        <div className="dest-brief-chip">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span>{query}</span>
          {parsed.destinations.length > 0 && (
            <span className="dest-brief-parsed">
              → {parsed.destinations.join(', ')}
            </span>
          )}
          <button
            type="button"
            className="dest-brief-apply"
            onClick={applySearch}
          >
            Apply
          </button>
        </div>
      )}

      {/* Origin + route tags */}
      {(plan.destinations.length > 0 || plan.origin) && (
        <div className="dest-tag-row">
          {/* Editable origin chip */}
          {originEdit ? (
            <span className="dest-tag dest-tag--origin-edit">
              <input
                autoFocus
                value={originDraft}
                onChange={(e) => setOriginDraft(e.target.value)}
                onBlur={applyOrigin}
                onKeyDown={(e) => e.key === 'Enter' && applyOrigin()}
                className="dest-origin-input"
                placeholder="Origin city"
              />
            </span>
          ) : (
            <button
              type="button"
              className="dest-tag dest-tag--origin"
              onClick={() => { setOriginDraft(plan.origin); setOriginEdit(true) }}
              title="Click to change origin city"
            >
              <MapPin className="h-3 w-3" />
              {plan.origin}
              <span className="dest-tag-edit">✏️</span>
            </button>
          )}
          {plan.destinations.map((city) => (
            <span key={city} className="dest-tag dest-tag--city">
              {city}
              <button
                type="button"
                className="dest-tag-remove"
                onClick={() => toggleCity(city)}
                aria-label={`Remove ${city}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="dest-two-col">
        {/* Left: cards */}
        <div>
          {/* Live search results */}
          <AnimatePresence>
            {liveDest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <SectionLabel>AI search results — click to add</SectionLabel>
                <div className="dest-live-grid">
                  {liveDest.map((item) => {
                    const cityName = item.name.split(',')[0].trim()
                    const isSelected = plan.destinations.includes(cityName)
                    return (
                      <button key={item.id}
                        type="button"
                        onClick={() => toggleCity(cityName)}
                        className={cn(
                          'dest-live-card',
                          isSelected && 'dest-live-card--selected',
                        )}
                      >
                        {(item.images?.[0]) && (
                          <img src={item.images[0]} alt={cityName} className="dest-live-thumb" />
                        )}
                        <div className="dest-live-body">
                          <p className="dest-live-name">{cityName}</p>
                          {item.name.includes(',') && (
                            <p className="dest-live-region">{item.name.split(',').slice(1).join(',').trim()}</p>
                          )}
                          <p className="dest-live-desc">
                            {item.description ?? 'Explore this destination'}
                          </p>
                          <p className="dest-live-source">{item.sourceLabel}</p>
                        </div>
                        {isSelected && (
                          <span className="dest-live-check"><CheckCircle2 className="h-4 w-4" /></span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {liveNote && <p className="dest-note">{liveNote}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Curated grid */}
          <SectionLabel>Popular destinations · {visiblePlaces.length} places</SectionLabel>
          <div className="dest-grid">
            {visiblePlaces.map((place) => {
              const selected = plan.destinations.includes(place.name)
              return (
                <motion.button
                  key={place.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleCity(place.name)}
                  className={cn('dest-card', selected && 'dest-card--selected')}
                >
                  <div className="dest-card-img-wrap">
                    <CoverImage
                      src={placeCover(place.name, place.image)}
                      alt={place.name}
                      className="dest-card-img"
                    />
                    <div className="dest-card-overlay" />
                    {selected && (
                      <span className="dest-card-check">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="dest-card-body">
                    <p className="dest-card-name">{place.name}</p>
                    <p className="dest-card-tag">
                      {DEMO_PLAN_CITIES.includes(place.name as (typeof DEMO_PLAN_CITIES)[number])
                        ? 'Featured circuit city'
                        : place.tagline}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right: route preview */}
        <div className="dest-map-col">
          <RoutePreview plan={plan} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── STEP 2: Dates ─────────────────────── */
export function DatesStep({
  plan,
  onChange,
}: {
  plan: TripPlan
  onChange: (patch: Partial<TripPlan>) => void
}) {
  const start = parseISO(plan.startDate)
  const end = parseISO(plan.endDate)
  const { nights, days } = tripDuration(plan)
  const timeline = eachDayOfInterval({ start, end })

  return (
    <div className="step-root">
      <StepHeader
        emoji="📅"
        title="When are you traveling?"
        subtitle="Click a start date, then an end date — duration updates instantly."
      />

      <AIBubble text="Pick your range below. I'll auto-count nights, plot the timeline, and flag public holidays." />

      <div className="dates-layout">
        {/* Calendar */}
        <PlanCalendar
          start={start}
          end={end}
          onChange={(range) =>
            onChange({
              startDate: format(range.start, 'yyyy-MM-dd'),
              endDate: format(range.end ?? range.start, 'yyyy-MM-dd'),
            })
          }
        />

        {/* Sidebar */}
        <div className="dates-sidebar">
          {/* Duration card */}
          <div className="dates-duration-card">
            <div className="dates-duration-icon">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="dates-duration-number">
                {nights} <span>nights</span>
              </p>
              <p className="dates-duration-sub">{days} days · {dateRangeLabel(plan)}</p>
            </div>
          </div>

          {/* Mini timeline */}
          <Card>
            <p className="card-title mb-3">Trip timeline</p>
            <div className="dates-timeline-scroll">
              <Timeline>
                {timeline.map((day, index) => (
                  <TimelineNode
                    key={day.toISOString()}
                    title={format(day, 'EEE, d MMM')}
                    meta={
                      index === 0
                        ? 'Depart Ahmedabad'
                        : index === timeline.length - 1
                          ? 'Return home'
                          : `Day ${index + 1}`
                    }
                    tone={
                      index === 0 || index === timeline.length - 1
                        ? 'info'
                        : 'success'
                    }
                    last={index === timeline.length - 1}
                  />
                ))}
              </Timeline>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PlanCalendar({
  start,
  end,
  onChange,
}: {
  start: Date
  end: Date
  onChange: (range: { start: Date; end?: Date }) => void
}) {
  const [cursor, setCursor] = useState(start)
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor],
  )

  return (
    <div className="calendar-card">
      {/* Month nav */}
      <div className="calendar-header">
        <button
          type="button"
          className="cal-nav-btn"
          onClick={() => setCursor(addMonths(cursor, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="calendar-month">{format(cursor, 'MMMM yyyy')}</p>
        <button
          type="button"
          className="cal-nav-btn"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="calendar-weekdays">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="cal-weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="calendar-grid">
        {days.map((day) => {
          const inRange = isWithinInterval(day, { start, end })
          const isStart = isSameDay(day, start)
          const isEnd = isSameDay(day, end)
          const isOtherMonth = !isSameMonth(day, cursor)
          const isEdge = isStart || isEnd

          return (
            <button key={day.toISOString()}
              type="button"
              onClick={() => {
                if (isSameDay(start, end)) {
                  if (day < start) onChange({ start: day, end: start })
                  else onChange({ start, end: day })
                  return
                }
                onChange({ start: day, end: day })
              }}
              className={cn(
                'cal-day',
                isOtherMonth && 'cal-day--other-month',
                inRange && !isEdge && 'cal-day--in-range',
                isStart && 'cal-day--start',
                isEnd && 'cal-day--end',
                isEdge && 'cal-day--edge',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <p className="calendar-range-label">
        {format(start, 'd MMM')} → {format(end, 'd MMM yyyy')}
      </p>
    </div>
  )
}

/* ─────────────────── STEP 3: Travelers ─────────────────── */
export function TravelersStep({
  plan,
  onChange,
}: {
  plan: TripPlan
  onChange: (patch: Partial<TripPlan>) => void
}) {
  const companions: { id: Companion; hint: string; emoji: string }[] = [
    { id: 'Solo', hint: 'Just you', emoji: '🧍' },
    { id: 'Couple', hint: 'Two adults', emoji: '💑' },
    { id: 'Family', hint: 'Kids welcome', emoji: '👨‍👩‍👧' },
    { id: 'Friends', hint: 'Shared rooms', emoji: '🎉' },
    { id: 'Group', hint: '8+ people', emoji: '🚌' },
  ]

  const setCompanion = (companion: Companion) => {
    if (companion === 'Solo') onChange({ companion, adults: 1, children: 0, infants: 0 })
    else if (companion === 'Couple') onChange({ companion, adults: 2 })
    else onChange({ companion })
  }

  const totalPax = plan.adults + plan.children + plan.infants

  return (
    <div className="step-root">
      <StepHeader
        emoji="👥"
        title="Who's coming along?"
        subtitle="This affects cabin class, hotel rooms, and cab size."
      />

      <AIBubble text="Adults first — I'll auto-suggest berth type and cab size. Children get activity-friendly scheduling." />

      {/* Total summary */}
      <div className="travelers-summary">
        <Users className="h-5 w-5 text-brand-600" />
        <span className="travelers-summary-count">{totalPax}</span>
        <span className="travelers-summary-label">
          {totalPax === 1 ? 'traveler' : 'travelers'} total
        </span>
        <span className="travelers-summary-pill">{plan.companion || 'Not set'}</span>
      </div>

      {/* Count cards */}
      <div className="travelers-count-grid">
        <CountCard
          label="Adults"
          subLabel="16+ years"
          value={plan.adults}
          min={1}
          onChange={(adults) => onChange({ adults: Math.max(1, adults) })}
        />
        <CountCard
          label="Children"
          subLabel="2–15 years"
          value={plan.children}
          icon={<Footprints className="h-4 w-4" />}
          min={0}
          onChange={(children) => onChange({ children: Math.max(0, children) })}
        />
        <CountCard
          label="Infants"
          subLabel="Under 2"
          value={plan.infants}
          icon={<Baby className="h-4 w-4" />}
          min={0}
          onChange={(infants) => onChange({ infants: Math.max(0, infants) })}
        />
      </div>

      {/* Companion type */}
      <div className="travelers-companion-section">
        <SectionLabel>Traveling as</SectionLabel>
        <div className="travelers-companion-grid">
          {companions.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setCompanion(item.id)}
              className={cn(
                'companion-card',
                plan.companion === item.id && 'companion-card--selected',
              )}
            >
              <span className="companion-emoji">{item.emoji}</span>
              <p className="companion-label">{item.id}</p>
              <p className="companion-hint">{item.hint}</p>
              {plan.companion === item.id && (
                <CheckCircle2 className="companion-check" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CountCard({
  label,
  subLabel,
  value,
  onChange,
  icon,
  min = 0,
}: {
  label: string
  subLabel: string
  value: number
  onChange: (value: number) => void
  icon?: ReactNode
  min?: number
}) {
  return (
    <div className="count-card">
      <div className="count-card-header">
        {icon && <span className="count-icon">{icon}</span>}
        <div>
          <p className="count-label">{label}</p>
          <p className="count-sublabel">{subLabel}</p>
        </div>
      </div>
      <div className="count-controls">
        <button
          type="button"
          className="count-btn"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <motion.span
          key={value}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="count-value"
        >
          {value}
        </motion.span>
        <button
          type="button"
          className="count-btn"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────── STEP 4: Preferences ───────────────── */
export function PreferencesStep({
  plan,
  onChange,
}: {
  plan: TripPlan
  onChange: (patch: Partial<TripPlan>) => void
}) {
  const toggleStyle = (style: string) => {
    onChange({
      styles: plan.styles.includes(style)
        ? plan.styles.filter((s) => s !== style)
        : [...plan.styles, style],
    })
  }
  const toggleFood = (item: string) => {
    onChange({
      food: plan.food.includes(item)
        ? plan.food.filter((e) => e !== item)
        : [...plan.food, item],
    })
  }

  return (
    <div className="step-root">
      <StepHeader
        emoji="✨"
        title="What kind of trip feels right?"
        subtitle="Select your travel style, accommodation, transport, and activity intensity."
      />

      <AIBubble text={`I'll blend these into a day-by-day experience. Multi-select is fine — I'll balance them out.`} />

      {/* Travel styles */}
      <SectionLabel>Travel style (select all that apply)</SectionLabel>
      <div className="styles-grid">
        {styleOptions.map((style) => {
          const Icon = styleIcons[style] ?? Sparkles
          const selected = plan.styles.includes(style)
          return (
            <motion.button
              key={style}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleStyle(style)}
              className={cn('style-card', selected && 'style-card--selected')}
            >
              <Icon className={cn('style-icon', selected ? 'style-icon--selected' : '')} />
              <p className="style-label">{style}</p>
              {selected && <CheckCircle2 className="style-check" />}
            </motion.button>
          )
        })}
      </div>

      {plan.styles.length > 0 && (
        <div className="pref-ai-insight">
          <AIInsightCard
            title="AI read on your style"
            body={styleSummary(plan.styles)}
            confidence={0.84}
          />
        </div>
      )}

      {/* Accommodation */}
      <SectionLabel>Accommodation</SectionLabel>
      <div className="pref-choice-row">
        {(['Budget', 'Comfort', 'Premium', 'Luxury'] as StayClass[]).map((opt) => (
          <PreferenceChip
            key={opt}
            label={opt}
            selected={plan.accommodation === opt}
            onClick={() => onChange({ accommodation: opt })}
          />
        ))}
      </div>

      {/* Transport */}
      <SectionLabel>Primary transport</SectionLabel>
      <div className="transport-row">
        {(['Train', 'Flight', 'Bus', 'Car', 'Mixed'] as TransportPref[]).map((opt) => {
          const Icon = transportIcons[opt] ?? Train
          return (
            <button key={opt}
              type="button"
              onClick={() => onChange({ transport: opt })}
              className={cn('transport-card', plan.transport === opt && 'transport-card--selected')}
            >
              <Icon className="h-5 w-5" />
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Food */}
      <SectionLabel>Food preferences</SectionLabel>
      <div className="pref-choice-row">
        {['Local', 'Vegetarian', 'Fine Dining', 'Street Food'].map((item) => (
          <PreferenceChip
            key={item}
            label={item}
            selected={plan.food.includes(item)}
            onClick={() => toggleFood(item)}
          />
        ))}
      </div>

      {/* Intensity */}
      <SectionLabel>Activity intensity</SectionLabel>
      <div className="intensity-row">
        {(['Relaxed', 'Balanced', 'Packed'] as Intensity[]).map((opt) => (
          <button key={opt}
            type="button"
            onClick={() => onChange({ intensity: opt })}
            className={cn('intensity-card', plan.intensity === opt && 'intensity-card--selected')}
          >
            <span className="intensity-emoji">
              {opt === 'Relaxed' ? '🌿' : opt === 'Balanced' ? '⚖️' : '⚡'}
            </span>
            <p className="intensity-label">{opt}</p>
            <p className="intensity-hint">
              {opt === 'Relaxed'
                ? 'Slow travel, long stays'
                : opt === 'Balanced'
                  ? '2–3 activities/day'
                  : 'Maximum coverage'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function PreferenceChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn('pref-chip', selected && 'pref-chip--selected')}
    >
      {selected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
      {label}
    </motion.button>
  )
}

/* ─────────────────── STEP 5: Budget ────────────────────── */
export function BudgetStep({
  plan,
  onChange,
}: {
  plan: TripPlan
  onChange: (patch: Partial<TripPlan>) => void
}) {
  const slices = budgetAllocation(plan.budget)
  const buffer = slices.find((r) => r.name === 'Buffer')?.value ?? 0
  const recommended = slices[0]?.recommended ?? 5000

  const budgetMarks = [25000, 50000, 75000, 100000, 150000, 200000]

  return (
    <div className="step-root">
      <StepHeader
        emoji="💰"
        title="What's your budget ceiling?"
        subtitle="Set a total. I'll split it across transport, stays, food, and keep a buffer."
      />

      <AIBubble text="I'll alert you if a hop exceeds ₹500 above estimate. Buffer shown live." />

      <div className="budget-layout">
        {/* Left: slider + input */}
        <div className="budget-left">
          <div className="budget-amount-display">
            <p className="budget-amount-label">Total budget</p>
            <motion.p
              key={plan.budget}
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              className="budget-amount-value"
            >
              {formatINR(plan.budget)}
            </motion.p>
          </div>

          {/* Slider */}
          <div className="budget-slider-wrap">
            <input
              type="range"
              min={25000}
              max={200000}
              step={1000}
              value={plan.budget}
              onChange={(e) => onChange({ budget: Number(e.target.value) })}
              className="budget-slider"
            />
            <div className="budget-marks">
              {budgetMarks.map((mark) => (
                <button
                  key={mark}
                  type="button"
                  className={cn(
                    'budget-mark',
                    plan.budget >= mark && 'budget-mark--active',
                  )}
                  onClick={() => onChange({ budget: mark })}
                >
                  ₹{(mark / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <label className="budget-input-label">
            Or enter exact amount
            <div className="budget-input-wrap">
              <span className="budget-input-prefix">₹</span>
              <input
                type="number"
                min={15000}
                value={plan.budget}
                onChange={(e) =>
                  onChange({ budget: Math.max(15000, Number(e.target.value) || 0) })
                }
                className="budget-input"
              />
            </div>
          </label>

          {/* Buffer health */}
          <div className="budget-buffer-row">
            <div className="budget-buffer-info">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>
                ₹{recommended.toLocaleString('en-IN')} buffer recommended
              </span>
            </div>
            <div className="budget-buffer-bar-wrap">
              <motion.div
                className={cn(
                  'budget-buffer-bar',
                  buffer >= recommended * 0.8
                    ? 'budget-buffer-bar--good'
                    : 'budget-buffer-bar--warn',
                )}
                animate={{ width: `${Math.min(100, (buffer / plan.budget) * 100)}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="budget-buffer-pct">
              {((buffer / plan.budget) * 100).toFixed(0)}% buffer
            </span>
          </div>
        </div>

        {/* Right: pie chart */}
        <div className="budget-right">
          <Card>
            <p className="card-title">Estimated allocation</p>
            <div className="budget-pie-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.name} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatINR(Number(v) || 0)}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="budget-legend">
              {slices.map((slice) => (
                <div key={slice.name} className="budget-legend-row">
                  <span
                    className="budget-legend-dot"
                    style={{ background: slice.color }}
                  />
                  <span className="budget-legend-name">{slice.name}</span>
                  <motion.span
                    key={`${slice.name}-${slice.value}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="budget-legend-value"
                  >
                    {formatINR(slice.value)}
                  </motion.span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── STEP 6: Review ────────────────────── */
export function ReviewStep({
  plan,
  onEdit,
  onGenerate,
  onBuild,
  generating,
}: {
  plan: TripPlan
  onEdit: (step: number) => void
  onGenerate: () => void
  onBuild: () => void
  generating: boolean
}) {
  const { nights } = tripDuration(plan)

  const rows = [
    { label: 'Route', value: routeLabel(plan) || 'Ahmedabad → ?', step: 0, icon: '📍' },
    { label: 'Dates', value: dateRangeLabel(plan), step: 1, icon: '📅' },
    { label: 'Travelers', value: `${plan.adults} Adults${plan.children ? ` · ${plan.children} children` : ''}`, step: 2, icon: '👥' },
    { label: 'Style', value: plan.styles.join(', ') || 'Open', step: 3, icon: '✨' },
    { label: 'Budget', value: formatINR(plan.budget), step: 4, icon: '💰' },
    { label: 'Stay', value: plan.accommodation, step: 3, icon: '🏨' },
    { label: 'Transport', value: plan.transport, step: 3, icon: '🚆' },
    { label: 'Intensity', value: plan.intensity, step: 3, icon: '⚡' },
  ]

  return (
    <div className="step-root">
      <StepHeader
        emoji="🚀"
        title="Ready to build your trip?"
        subtitle="Here's everything I understood. Edit any row, then choose how to proceed."
      />

      <AIBubble text="Looking good! Choose 'Build step by step' for full control, or 'Generate for me' for an instant AI-crafted circuit." />

      <div className="review-layout">
        {/* Summary card */}
        <div className="review-summary-card">
          <div className="review-summary-header">
            <div>
              <p className="review-summary-title">
                {routeLabel(plan) || 'Your Trip'}
              </p>
              <p className="review-summary-subtitle">
                {nights} nights · {plan.adults} traveler{plan.adults > 1 ? 's' : ''}
              </p>
            </div>
            <div className="review-summary-budget">
              <p className="review-budget-label">Budget</p>
              <p className="review-budget-value">{formatINR(plan.budget)}</p>
            </div>
          </div>

          <div className="review-rows">
            {rows.map((row) => (
              <button key={row.label}
                type="button"
                onClick={() => onEdit(row.step)}
                className="review-row"
              >
                <span className="review-row-icon">{row.icon}</span>
                <span className="review-row-label">{row.label}</span>
                <span className="review-row-value">{row.value}</span>
                <span className="review-row-edit">Edit</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action cards */}
        <div className="review-actions">
          <div className="review-action-card review-action-card--primary">
            <div className="review-action-icon">🗺️</div>
            <p className="review-action-title">Build hop-by-hop</p>
            <p className="review-action-desc">
              Add each leg manually: cab → train → hotel → activity. Full control over every connection.
            </p>
            <Button type="button"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={onBuild}
              className="w-full mt-auto"
            >
              Start building
            </Button>
          </div>

          <div className="review-action-card review-action-card--ai">
            <div className="review-action-icon">
              <Sparkles className="h-6 w-6 text-brand-600" />
            </div>
            <p className="review-action-title">Generate for me</p>
            <p className="review-action-desc">
              Live search writes the full day-by-day itinerary. The trip is saved under My Trips → Upcoming (not Ongoing).
            </p>
            <Button
type="button"               variant="secondary"
              loading={generating}
              onClick={onGenerate}
              className="w-full mt-auto"
            >
              {generating ? 'Generating…' : 'Generate itinerary'}
            </Button>
          </div>
        </div>
      </div>

      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="review-generating"
        >
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <div>
            <p className="font-semibold text-sm text-brand-800">
              Writing {routeLabel(plan)}…
            </p>
            <p className="text-[13px] text-slate-600 mt-0.5">
              SerpApi, flights, rails, and OpenRouter are writing every day and time slot
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}


