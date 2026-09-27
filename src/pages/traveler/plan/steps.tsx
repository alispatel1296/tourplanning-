import { useMemo, useState, type ReactNode } from 'react'
import './steps.css'
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
      destinations: next.destinations.length ? next.destinations : plan.destinations,
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
    onChange({
      destinations: selected
        ? plan.destinations.filter((c) => c !== cleanName)
        : [...plan.destinations, cleanName],
    })
  }

  const applyOrigin = () => {
    const trimmed = originDraft.trim()
    if (trimmed) onChange({ origin: trimmed })
    setOriginEdit(false)
  }

  return (
    <div className="step-root">
      <style>{stepStyles}</style>

      <StepHeader
        emoji="📍"
        title="Where do you want to go?"
        subtitle="Search a destination or pick from our curated suggestions below."
      />

      <AIBubble text="Tell me the vibe and I'll find the best cities. E.g. &quot;7 days beach trip under ₹70,000&quot; or just pick cards below." />

      {/* Search bar */}
      <div className="dest-search-row">
        <div className="dest-search-wrap">
          <Search className="dest-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder='Try: "Beach + mountains, 7 days, under ₹80k"'
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
                    <img
                      src={place.image}
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
                    <p className="dest-card-tag">{place.tagline}</p>
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
              AI builds the full circuit in seconds — trains, stays, and activities, all timed and budgeted.
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
              Simulating trains, stays, and 45-minute buffers
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ─────────────────── Inline styles ─────────────────────── */
const stepStyles = `
  /* Root */
  .step-root { padding-bottom: 16px; }

  /* Step header */
  .step-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 20px;
  }
  .step-header-emoji {
    font-size: 2rem;
    line-height: 1;
    flex-shrink: 0;
  }
  .step-header-title {
    font-size: clamp(1.1rem, 3vw, 1.4rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
    line-height: 1.2;
  }
  .step-header-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: #64748b;
  }
  .step-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin: 20px 0 10px;
  }

  /* AI bubble */
  .ai-bubble {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1px solid #c4b5fd;
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 20px;
  }
  .ai-bubble-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .ai-bubble-text {
    font-size: 13px;
    color: #4c1d95;
    line-height: 1.6;
    font-weight: 500;
  }

  /* ── DESTINATION ── */
  .dest-search-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .dest-search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
  }
  .dest-search-icon {
    position: absolute;
    left: 12px;
    width: 16px;
    height: 16px;
    color: #94a3b8;
    pointer-events: none;
  }
  .dest-search-input {
    width: 100%;
    height: 44px;
    padding: 0 40px 0 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    background: white;
    transition: border-color 0.18s;
    outline: none;
  }
  .dest-search-input:focus { border-color: #7c3aed; }
  .dest-search-spinner {
    position: absolute;
    right: 12px;
    width: 16px;
    height: 16px;
    color: #7c3aed;
  }
  .dest-search-btn {
    height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    background: #0f172a;
    color: white;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: background 0.18s;
  }
  .dest-search-btn:hover { background: #1e293b; }
  .dest-search-btn:disabled { opacity: 0.6; cursor: default; }
  .dest-voice-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1.5px solid #c4b5fd;
    color: #5b21b6;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
  }
  .dest-voice-btn:hover { background: #ede9fe; }

  .dest-brief-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 12px;
    color: #065f46;
    margin-bottom: 10px;
    max-width: 100%;
    flex-wrap: wrap;
  }
  .dest-brief-parsed { color: #059669; font-weight: 600; }
  .dest-brief-apply {
    background: #059669;
    color: white;
    border: none;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    margin-left: 4px;
  }

  .dest-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }
  .dest-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }
  .dest-tag--origin {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    cursor: pointer;
    transition: background 0.15s;
  }
  .dest-tag--origin:hover { background: #dbeafe; }
  .dest-tag-edit { font-size: 11px; opacity: 0.6; margin-left: 2px; }
  .dest-tag--origin-edit {
    background: #eff6ff;
    border: 1.5px solid #3b82f6;
    border-radius: 999px;
    padding: 2px 8px;
    display: inline-flex;
  }
  .dest-origin-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    font-weight: 600;
    color: #1e40af;
    width: 120px;
  }
  .dest-tag--city {
    background: #f0fdf4;
    color: #065f46;
    border: 1px solid #bbf7d0;
  }
  .dest-tag-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #059669;
    line-height: 1;
    padding: 0;
    margin-left: 2px;
  }

  .dest-two-col {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 768px) {
    .dest-two-col { grid-template-columns: 1fr 320px; }
  }

  .dest-live-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, 1fr);
    margin-bottom: 12px;
  }
  .dest-live-card {
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 0;
    text-align: left;
    cursor: pointer;
    transition: all 0.18s;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .dest-live-card:hover { border-color: #7c3aed; box-shadow: 0 4px 12px rgba(124,58,237,0.1); }
  .dest-live-card--selected { border-color: #059669; background: #f0fdf4; }
  .dest-live-thumb { width: 100%; height: 70px; object-fit: cover; }
  .dest-live-body { padding: 10px 12px; }
  .dest-live-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .dest-live-region { font-size: 11px; color: #94a3b8; margin-top: 1px; }
  .dest-live-desc { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4; }
  .dest-live-source { font-size: 10px; color: #94a3b8; margin-top: 6px; }
  .dest-live-check {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #059669;
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dest-note { font-size: 11px; color: #94a3b8; margin-top: 4px; }

  .dest-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media(min-width: 640px) { .dest-grid { grid-template-columns: repeat(3, 1fr); } }
  @media(min-width: 1280px) { .dest-grid { grid-template-columns: repeat(4, 1fr); } }

  .dest-card {
    border-radius: 16px;
    border: 2px solid #e2e8f0;
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
  }
  .dest-card:hover { border-color: #7c3aed; box-shadow: 0 4px 16px rgba(124,58,237,0.12); }
  .dest-card--selected { border-color: #059669; box-shadow: 0 0 0 3px #bbf7d0; }

  .dest-card-img-wrap {
    position: relative;
    height: 100px;
  }
  .dest-card-img { width: 100%; height: 100%; object-fit: cover; }
  .dest-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.3));
  }
  .dest-card-check {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #059669;
    color: white;
    border-radius: 50%;
    padding: 3px;
    display: flex;
  }
  .dest-card-body { padding: 10px 12px; }
  .dest-card-name { font-size: 13px; font-weight: 700; color: #0f172a; }
  .dest-card-tag { font-size: 11px; color: #64748b; margin-top: 2px; }
  .dest-map-col { position: sticky; top: 80px; }

  /* ── DATES ── */
  .dates-layout {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 768px) {
    .dates-layout { grid-template-columns: 1fr 260px; }
  }

  .calendar-card {
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    padding: 20px;
  }
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .calendar-month {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .cal-nav-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    cursor: pointer;
    color: #64748b;
    transition: all 0.18s;
  }
  .cal-nav-btn:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }
  .cal-weekday { text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; padding: 4px 0; }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .cal-day {
    height: 38px;
    border-radius: 10px;
    font-size: 13px;
    color: #334155;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cal-day:hover { background: #f5f3ff; color: #5b21b6; }
  .cal-day--other-month { color: #cbd5e1; }
  .cal-day--in-range { background: #f5f3ff; color: #5b21b6; border-radius: 0; }
  .cal-day--start { background: linear-gradient(135deg, #7c3aed, #4f46e5) !important; color: white !important; border-radius: 10px 0 0 10px; }
  .cal-day--end { background: linear-gradient(135deg, #7c3aed, #4f46e5) !important; color: white !important; border-radius: 0 10px 10px 0; }
  .cal-day--edge { font-weight: 800; box-shadow: 0 2px 8px rgba(124,58,237,0.3); }

  .calendar-range-label {
    margin-top: 12px;
    font-size: 12px;
    color: #64748b;
    text-align: center;
    font-weight: 600;
  }

  .dates-sidebar { display: flex; flex-direction: column; gap: 16px; }
  .dates-duration-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1.5px solid #c4b5fd;
    border-radius: 16px;
    padding: 16px;
  }
  .dates-duration-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dates-duration-number {
    font-size: 2rem;
    font-weight: 900;
    color: #3b0764;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .dates-duration-number span { font-size: 1rem; font-weight: 600; color: #6d28d9; }
  .dates-duration-sub { font-size: 12px; color: #7e22ce; margin-top: 2px; font-weight: 500; }
  .dates-timeline-scroll { max-height: 300px; overflow-y: auto; }

  /* ── TRAVELERS ── */
  .travelers-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px 16px;
    margin-bottom: 20px;
  }
  .travelers-summary-count {
    font-size: 1.5rem;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
  }
  .travelers-summary-label { font-size: 13px; color: #64748b; font-weight: 500; flex: 1; }
  .travelers-summary-pill {
    font-size: 12px;
    font-weight: 700;
    background: #f0fdf4;
    color: #065f46;
    border: 1px solid #bbf7d0;
    border-radius: 999px;
    padding: 3px 10px;
  }

  .travelers-count-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, 1fr);
  }
  .count-card {
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .count-card-header { display: flex; align-items: center; gap: 8px; }
  .count-icon { color: #94a3b8; }
  .count-label { font-size: 13px; font-weight: 700; color: #0f172a; }
  .count-sublabel { font-size: 11px; color: #94a3b8; }
  .count-controls { display: flex; align-items: center; justify-content: space-between; }
  .count-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    cursor: pointer;
    color: #64748b;
    transition: all 0.18s;
  }
  .count-btn:hover:not(:disabled) { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
  .count-btn:disabled { opacity: 0.3; cursor: default; }
  .count-value { font-size: 2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; }

  .travelers-companion-section { margin-top: 24px; }
  .travelers-companion-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media(min-width: 640px) { .travelers-companion-grid { grid-template-columns: repeat(5, 1fr); } }

  .companion-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  .companion-card:hover { border-color: #c4b5fd; background: #faf5ff; }
  .companion-card--selected { border-color: #059669; background: #f0fdf4; box-shadow: 0 0 0 3px #bbf7d0; }
  .companion-emoji { font-size: 1.6rem; }
  .companion-label { font-size: 13px; font-weight: 700; color: #0f172a; }
  .companion-hint { font-size: 11px; color: #94a3b8; }
  .companion-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;
    color: #059669;
  }

  /* ── PREFERENCES (moved to steps.css) ── */

  /* ── BUDGET ── */
  .budget-layout {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 768px) { .budget-layout { grid-template-columns: 1fr 300px; } }

  .budget-left { display: flex; flex-direction: column; gap: 20px; }
  .budget-amount-display {
    background: linear-gradient(135deg, #fafaf9, #f5f5f4);
    border: 1.5px solid #e7e5e4;
    border-radius: 20px;
    padding: 20px 24px;
  }
  .budget-amount-label { font-size: 12px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  .budget-amount-value { font-size: 2.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; margin-top: 4px; }

  .budget-slider-wrap { display: flex; flex-direction: column; gap: 8px; }
  .budget-slider {
    width: 100%;
    height: 4px;
    accent-color: #7c3aed;
    cursor: pointer;
  }
  .budget-marks {
    display: flex;
    justify-content: space-between;
  }
  .budget-mark {
    font-size: 10px;
    font-weight: 600;
    color: #94a3b8;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 6px;
    transition: all 0.15s;
  }
  .budget-mark:hover { background: #f5f3ff; color: #5b21b6; }
  .budget-mark--active { color: #5b21b6; font-weight: 800; }

  .budget-input-label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #64748b; font-weight: 600; }
  .budget-input-wrap { position: relative; display: flex; align-items: center; }
  .budget-input-prefix {
    position: absolute;
    left: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #334155;
  }
  .budget-input {
    width: 100%;
    height: 48px;
    padding: 0 16px 0 28px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    outline: none;
    transition: border-color 0.18s;
  }
  .budget-input:focus { border-color: #7c3aed; }

  .budget-buffer-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .budget-buffer-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; font-weight: 500; }
  .budget-buffer-bar-wrap { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .budget-buffer-bar { height: 100%; border-radius: 999px; }
  .budget-buffer-bar--good { background: linear-gradient(90deg, #059669, #10b981); }
  .budget-buffer-bar--warn { background: linear-gradient(90deg, #d97706, #f59e0b); }
  .budget-buffer-pct { font-size: 11px; color: #94a3b8; font-weight: 600; }

  .budget-right {}
  .budget-pie-wrap { margin: 8px 0; }
  .budget-legend { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
  .budget-legend-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .budget-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .budget-legend-name { flex: 1; color: #64748b; }
  .budget-legend-value { font-weight: 700; color: #0f172a; }

  /* ── REVIEW ── */
  .review-layout {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 1024px) { .review-layout { grid-template-columns: 1fr 340px; } }

  .review-summary-card {
    background: white;
    border: 2px solid var(--color-surface);
    border-radius: 20px;
    overflow: hidden;
  }
  .review-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 20px 16px;
    background: var(--color-charcoal);
    color: var(--color-warm-ivory);
  }
  .review-summary-title { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
  .review-summary-subtitle { font-size: 13px; color: var(--color-muted-gold); margin-top: 4px; }
  .review-summary-budget { text-align: right; }
  .review-budget-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(222, 189, 147, 0.7); }
  .review-budget-value { font-size: 1.4rem; font-weight: 900; color: var(--color-muted-gold); margin-top: 2px; }

  .review-rows { display: flex; flex-direction: column; }
  .review-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--color-surface);
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
    width: 100%;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
  }
  .review-row:hover { background: var(--color-surface); }
  .review-row:last-child { border-bottom: none; }
  .review-row-icon { font-size: 1.2rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: var(--color-warm-ivory); border-radius: 10px; }
  .review-row-label { font-size: 12px; font-weight: 600; color: rgba(30, 30, 30, 0.6); min-width: 80px; }
  .review-row-value { flex: 1; font-size: 14px; font-weight: 600; color: var(--color-charcoal); text-align: left; }
  .review-row-edit {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-charcoal);
    background: var(--color-warm-ivory);
    border: 1px solid var(--color-muted-gold);
    border-radius: 6px;
    padding: 4px 10px;
  }

  .review-actions { display: flex; flex-direction: column; gap: 14px; }
  .review-action-card {
    background: white;
    border: 2px solid var(--color-surface);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .review-action-card--primary { border-color: var(--color-charcoal); }
  .review-action-card--ai { border-color: var(--color-muted-gold); background: var(--color-warm-ivory); }
  .review-action-icon { font-size: 2rem; }
  .review-action-title { font-size: 16px; font-weight: 800; color: var(--color-charcoal); }
  .review-action-desc { font-size: 13px; color: rgba(30,30,30,0.6); line-height: 1.5; flex: 1; }

  .review-generating {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    background: var(--color-warm-ivory);
    border: 1px solid var(--color-muted-gold);
    border-radius: 16px;
    padding: 14px 16px;
  }
`
