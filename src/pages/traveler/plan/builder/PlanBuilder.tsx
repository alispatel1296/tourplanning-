import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { ProgressBar } from '@/components/ui/Progress'
import { AILabel } from '@/components/domain/AICards'
import { formatINR, cn } from '@/lib/cn'
import { routeLabel, tripDuration } from '@/lib/plan'
import { useAppState } from '@/state/AppState'
import {
  cheapestOf,
  clearBuilder,
  deltaLabel,
  deltaTone,
  deltaVs,
  hopComplete,
  hopsWithLive,
  loadBuilder,
  persistBuilder,
  primarySpend,
  recommendedOf,
  recommendedSpend,
  setLiveHopOverlay,
  type BuilderState,
  type HopPick,
} from '@/pages/traveler/plan/builder/model'
import { SOFT_DELTA, type HopOption, type PlanHop } from '@/pages/traveler/plan/builder/catalog'
import { loadLiveHop } from '@/pages/traveler/plan/builder/liveHops'

export function PlanBuilder() {
  const { plan, commitBuiltTrip, generateItinerary, pushToast } = useAppState()
  const [liveTick, setLiveTick] = useState(0)
  const hops = useMemo(() => hopsWithLive(plan), [plan, liveTick])
  const [state, setState] = useState<BuilderState>(() => loadBuilder(plan))
  const [detail, setDetail] = useState<HopOption | null>(null)
  const [customModal, setCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customTime, setCustomTime] = useState('07:30')
  const [customSummary, setCustomSummary] = useState('')
  const [customOptions, setCustomOptions] = useState<Record<string, HopOption[]>>({})
  const [liveStatus, setLiveStatus] = useState<'idle' | 'loading' | 'live' | 'fallback'>('idle')
  const [liveSource, setLiveSource] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    persistBuilder(state)
  }, [state])

  useEffect(() => {
    const first = hopsWithLive(plan)[0]
    if (!first || (first.kind !== 'cab' && first.id !== 'home-cab')) return
    let cancelled = false
    setLiveStatus('loading')
    void loadLiveHop(first, plan)
      .then((pack) => {
        if (cancelled) return
        if (!pack?.options.length) {
          setLiveStatus('fallback')
          return
        }
        setLiveHopOverlay(first.id, pack.options, { narrator: pack.narrator, question: pack.question })
        setLiveSource(pack.source)
        setLiveStatus('live')
        setLiveTick((value) => value + 1)
        setState((current) => ({
          ...current,
          picks: { ...current.picks, [first.id]: { primaryId: null, alternativeIds: [] } },
        }))
      })
      .catch(() => {
        if (!cancelled) setLiveStatus('fallback')
      })
    return () => {
      cancelled = true
    }
  }, [plan.origin, plan.destinations.join('|'), plan.startDate])

  const hop = hops[state.hopIndex] ?? hops[0]
  const currentHopOptions = useMemo(() => {
    const extra = customOptions[hop.id] ?? []
    return [...hop.options, ...extra]
  }, [hop, customOptions])

  const pick = state.picks[hop.id] ?? { primaryId: null, alternativeIds: [] }
  const primary = currentHopOptions.find((o) => o.id === pick.primaryId)
  const baseline = primary ?? recommendedOf(hop)
  const spent = primarySpend(plan, state.picks)
  const remaining = plan.budget - spent
  const recTotal = recommendedSpend(plan)
  const savedVsRec = recTotal - spent
  const doneCount = hops.filter((item) => hopComplete(state.picks[item.id])).length
  const last = state.hopIndex === hops.length - 1
  const cheapest = cheapestOf(hop)
  const recommended = recommendedOf(hop)
  const hopSave = recommended && cheapest ? recommended.price - cheapest.price : 0

  const patchHop = (next: HopPick) => {
    setState((current) => ({
      ...current,
      picks: { ...current.picks, [hop.id]: next },
    }))
  }

  const handleAddCustomOption = () => {
    if (!customName.trim()) return
    const priceNum = Number(customPrice.replace(/[^\d]/g, '')) || 1200
    const newOpt: HopOption = {
      id: `custom-${crypto.randomUUID().slice(0, 6)}`,
      name: customName.trim(),
      tag: 'budget',
      price: priceNum,
      time: customTime || '09:00',
      duration: 'Custom',
      summary: customSummary.trim() || 'Custom workflow option created by user.',
      description: `User-defined node for ${hop.city}. Specified price: ₹${priceNum.toLocaleString('en-IN')}.`,
      patch: {
        title: customName.trim(),
        cost: priceNum,
        time: customTime || '09:00',
        notes: customSummary.trim() || 'User custom workflow stop.',
      },
    }
    setCustomOptions((prev) => ({
      ...prev,
      [hop.id]: [...(prev[hop.id] ?? []), newOpt],
    }))
    selectPrimary(newOpt)
    setCustomModal(false)
    setCustomName('')
    setCustomPrice('')
    setCustomSummary('')
    pushToast({ title: 'Custom node created', body: `${newOpt.name} added to ${hop.city} workflow.` })
  }

  const selectPrimary = (option: HopOption) => {
    const alternativeIds = pick.alternativeIds.filter((id) => id !== option.id)
    patchHop({ primaryId: option.id, alternativeIds })
    pushToast({
      title: 'Added to the live path',
      body: `${option.name} · ${formatINR(option.price)}. Running total ${formatINR(spent - (primary?.price ?? 0) + option.price)}.`,
    })
  }

  const selectAlternative = (option: HopOption) => {
    if (pick.primaryId === option.id) return
    const already = pick.alternativeIds.includes(option.id)
    const alternativeIds = already
      ? pick.alternativeIds.filter((id) => id !== option.id)
      : [...pick.alternativeIds, option.id]
    patchHop({ ...pick, alternativeIds })
    const delta = deltaVs(option, baseline)
    pushToast({
      title: already ? 'Alternative removed' : 'Parked as alternative',
      body: already
        ? `${option.name} left the yellow list.`
        : `${option.name} · ${deltaLabel(delta)} vs the current pick.`,
    })
  }

  const finish = () => {
    const filled: BuilderState['picks'] = { ...state.picks }
    hops.forEach((item) => {
      if (!filled[item.id]?.primaryId) {
        filled[item.id] = { primaryId: recommendedOf(item).id, alternativeIds: filled[item.id]?.alternativeIds ?? [] }
      }
    })
    commitBuiltTrip(filled)
    generateItinerary(plan)
    clearBuilder()
    sessionStorage.removeItem('tf-itin-ready')
    navigate('/traveler/itinerary', { state: { generate: true } })
  }

  if (!hop) return null

  return (
    <div className="-mx-4 -mt-2 min-h-[70vh] px-4 pb-10 lg:-mx-8 lg:px-8">
      <div className="mb-5">
        <AILabel />
        <h1 className="page-title mt-2">Build the trip with me</h1>
        <p className="mt-2 text-sm text-slate-600">
          {routeLabel(plan)} · {tripDuration(plan).days} days · we place one hop at a time, starting from home.
        </p>
      </div>

      <BudgetBar budget={plan.budget} spent={spent} remaining={remaining} savedVsRec={savedVsRec} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <ol className="hidden space-y-1 xl:block">
          {hops.map((item, index) => {
            const complete = hopComplete(state.picks[item.id])
            const current = index === state.hopIndex
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setState((currentState) => ({ ...currentState, hopIndex: index }))}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-[13px]',
                    current ? 'bg-brand-50 text-brand-900' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span className="meta">Day {item.day}</span>
                  <span className="mt-0.5 flex items-center gap-1 font-medium">
                    {complete ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
                    {item.city} · {kindLabel(item)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div>
          <p className="meta">
            Hop {state.hopIndex + 1} of {hops.length} · {doneCount} placed
          </p>
          <div className="mt-2">
            <ProgressBar value={((state.hopIndex + 1) / hops.length) * 100} tone="ai" />
          </div>

          <Card className="mt-4 border-brand-100 bg-brand-50/40">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-700">TripFlow</p>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink">{hop.narrator}</p>
            <p className="mt-2 text-sm text-slate-600">{hop.question}</p>
            {state.hopIndex === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                {liveStatus === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {liveStatus === 'loading'
                  ? `Searching live cabs and transfers in ${hop.city}…`
                  : liveStatus === 'live'
                    ? liveSource ?? 'Live operators from SerpApi maps'
                    : liveStatus === 'fallback'
                      ? 'Live search quiet — showing structured pickups'
                      : null}
              </p>
            ) : null}
          </Card>

          {hopSave > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="success">Save up to {formatINR(hopSave)} on this hop</Badge>
              <p className="text-[12px] text-slate-500">
                Add-ons within ₹{SOFT_DELTA.toLocaleString('en-IN')} stay green. Larger increases turn red.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {state.hopIndex === 0 && liveStatus === 'live' ? `Live pickups in ${hop.city}` : `Available options for ${hop.city}`}
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={() => setCustomModal(true)}>
              + Add Custom Train / Option
            </Button>
          </div>

          <div className="mt-3 grid gap-3">
            {currentHopOptions.map((option) => {
              const delta = deltaVs(option, baseline)
              const tone = deltaTone(delta)
              const isPrimary = pick.primaryId === option.id
              const isAlt = pick.alternativeIds.includes(option.id)
              return (
                <motion.div key={option.id} layout className={cn('rounded-2xl border p-4', isPrimary && 'border-emerald-300 bg-emerald-50/50')}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[16px] font-semibold">{option.name}</p>
                        <TagBadge tag={option.tag} />
                        {cheapest && option.id === cheapest.id ? <Badge tone="success">Save</Badge> : null}
                      </div>
                      <p className="meta mt-1">
                        {option.time} · {option.duration}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{option.summary}</p>
                    </div>
                    <p className="font-display text-xl font-semibold">{formatINR(option.price)}</p>
                  </div>

                  <div
                    className={cn(
                      'mt-3 rounded-xl border px-3 py-2 text-sm font-semibold',
                      tone === 'green'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800',
                    )}
                    role="status"
                  >
                    {delta === 0
                      ? 'On the current pick — no budget change'
                      : `${deltaLabel(delta)} vs current pick · ${tone === 'green' ? 'within ₹500 of the live choice' : 'increases the hop by more than ₹500'}`}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => selectPrimary(option)} disabled={isPrimary}>
                      {isPrimary ? 'Selected' : 'Select'}
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => selectAlternative(option)}>
                      {isAlt ? 'Remove alternative' : 'Select as alternative'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setDetail(option)}>
                      Description
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <Button type="button"
              variant="ghost"
              icon={<ChevronLeft className="h-4 w-4" />}
              disabled={state.hopIndex === 0}
              onClick={() => setState((current) => ({ ...current, hopIndex: current.hopIndex - 1 }))}
            >
              Previous hop
            </Button>
            {last ? (
              <Button type="button" icon={<Sparkles className="h-4 w-4" />} onClick={finish} disabled={!pick.primaryId}>
                Finish & simulate itinerary
              </Button>
            ) : (
              <Button type="button"
                icon={<ChevronRight className="h-4 w-4" />}
                disabled={!pick.primaryId}
                onClick={() => setState((current) => ({ ...current, hopIndex: current.hopIndex + 1 }))}
              >
                Next hop
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={customModal} onClose={() => setCustomModal(false)} title={`Add Custom Workflow Node for ${hop.city}`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddCustomOption()
          }}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Option / Train Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Tejas Express (12:30 IST) or Heritage Resort"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:border-brand-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹ INR)</label>
              <input
                type="text"
                placeholder="1450"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Time (IST)</label>
              <input
                type="text"
                placeholder="08:30"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Summary / Note</label>
            <textarea
              rows={2}
              placeholder="Comfortable AC chair car with onboard breakfast."
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              className="w-full rounded-lg border border-line p-3 text-sm focus:border-brand-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCustomModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Custom Node
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? 'Option'}>
        {detail ? (
          <div>
            <p className="text-sm text-slate-600">{detail.description}</p>
            <p className="mt-3 text-sm font-semibold">
              {formatINR(detail.price)} · {detail.time} · {detail.duration}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
type="button"                 size="sm"
                onClick={() => {
                  selectPrimary(detail)
                  setDetail(null)
                }}
              >
                Select
              </Button>
              <Button
type="button"                 size="sm"
                variant="secondary"
                onClick={() => {
                  selectAlternative(detail)
                  setDetail(null)
                }}
              >
                Select as alternative
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function BudgetBar({
  budget,
  spent,
  remaining,
  savedVsRec,
}: {
  budget: number
  spent: number
  remaining: number
  savedVsRec: number
}) {
  const over = remaining < 0
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="meta">Running total</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatINR(spent)}</p>
        </div>
        <div className="text-right">
          <p className="meta">Remaining of {formatINR(budget)}</p>
          <p className={cn('mt-1 text-lg font-semibold', over ? 'text-rose-700' : 'text-emerald-700')}>
            {over ? `Over by ${formatINR(Math.abs(remaining))}` : formatINR(remaining)}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={Math.min(100, (spent / budget) * 100)} tone={over ? 'danger' : spent / budget > 0.85 ? 'warning' : 'success'} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={savedVsRec >= 0 ? 'success' : 'danger'}>
          <Wallet className="h-3 w-3" />
          {savedVsRec >= 0
            ? `Save ${formatINR(savedVsRec)} vs the recommended path`
            : `${formatINR(Math.abs(savedVsRec))} above the recommended path`}
        </Badge>
      </div>
    </Card>
  )
}

function TagBadge({ tag }: { tag: HopOption['tag'] }) {
  if (tag === 'recommended') return <Badge tone="ai">Recommended</Badge>
  if (tag === 'save') return <Badge tone="success">Budget</Badge>
  if (tag === 'budget') return <Badge tone="success">Budget</Badge>
  return <Badge tone="warning">Comfort</Badge>
}

function kindLabel(hop: PlanHop) {
  if (hop.kind === 'cab') return 'Cab'
  if (hop.kind === 'train') return 'Train'
  if (hop.kind === 'flight') return 'Flight'
  if (hop.kind === 'stay') return 'Hotel'
  if (hop.kind === 'food') return 'Food'
  if (hop.kind === 'activity') return 'Activity'
  return 'Return'
}
