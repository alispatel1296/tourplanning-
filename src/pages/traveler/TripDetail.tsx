import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Maximize2, Minus, Plus, ShieldAlert, Sparkles, Map, Layers, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppState } from '@/state/AppState'
import { formatDate, formatINR, cn } from '@/lib/cn'
import {
  fallbackNodes,
  plannedSpend,
  type CanvasView,
  type PathMode,
} from '@/pages/traveler/flow/model'
import { alternativesFor, type NodeAlternative } from '@/pages/traveler/flow/alternatives'
import { visualBranches } from '@/pages/traveler/flow/dossier'
import { FlowCanvas } from '@/pages/traveler/flow/FlowCanvas'
import { BudgetHealth } from '@/pages/traveler/flow/BudgetHealth'
import { NodeDrawer } from '@/pages/traveler/flow/NodeDrawer'
import { TripMap } from '@/components/domain/TripMap'
import { useTripGeo } from '@/hooks/useTripGeo'
import { calculateBudgetHealth } from '@/services/budget/budget'
import { Comparison, type CompareSide } from '@/pages/traveler/flow/Comparison'
import { AddStopModal } from '@/pages/traveler/flow/AddStopModal'
import { AskTripFlow } from '@/pages/traveler/flow/AskTripFlow'
import { VisitPrecaution } from '@/pages/traveler/flow/VisitPrecaution'
import type { TripNode } from '@/types'

export function TripDetail() {
  const { id } = useParams()
  const { trips, deleteTripNode, applyNodePatch, insertTravelNode, pushToast, markNodeVisited, updateNodeStatus, refreshLivePlan, generating, liveSources } =
    useAppState()
  const trip = trips.find((item) => item.id === id) ?? trips[0]
  const navigate = useNavigate()

  const [path, setPath] = useState<PathMode>('flight')
  const [view, setView] = useState<CanvasView>('flow')
  const [zoom, setZoom] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addAfter, setAddAfter] = useState<string | null>(null)
  const [save] = useState(0)
  const [mobile, setMobile] = useState(false)
  const [compareAlt, setCompareAlt] = useState<NodeAlternative | null>(null)
  const [leaving, setLeaving] = useState<TripNode | null>(null)
  const [activeDay, setActiveDay] = useState<number>(1)
  const liveTrips = trips.filter((item) => item.nodes.length > 0)

  useEffect(() => {
    const sync = () => setMobile(window.innerWidth < 1024)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const nodes = useMemo(() => (trip ? fallbackNodes(trip) : []), [trip])
  const branches = useMemo(() => (trip ? visualBranches(trip, nodes) : []), [trip, nodes])
  const { located, routes } = useTripGeo(nodes)

  const selectedBase = nodes.find((node) => node.id === selectedId) ?? null
  const selectedGeo = located.find((node) => node.id === selectedId)
  const selected = selectedBase
    ? { ...selectedBase, lat: selectedGeo?.lat ?? selectedBase.lat, lng: selectedGeo?.lng ?? selectedBase.lng }
    : null

  useEffect(() => {
    if (!trip) return
    const main = trip.nodes.filter((node) => node.status !== 'alternative')
    if (!main.length) return
    const current = main.find((node) => node.status === 'active') ?? main[0]
    setActiveDay(current.day)
    const progressed = main.some((node) => node.status === 'active' || node.status === 'visited')
    if (!progressed) updateNodeStatus(trip.id, main[0].id, 'active')
  }, [trip, updateNodeStatus])

  useEffect(() => {
    if (!trip || trip.status === 'completed') return
    const key = `tf-flow-live-${trip.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    void refreshLivePlan(trip.id)
  }, [trip, refreshLivePlan])

  const afterNode = nodes.find((node) => node.id === addAfter) ?? null

  const planned = trip ? plannedSpend({ ...trip, nodes }, path) - save : 0
  const health = calculateBudgetHealth(trip?.budget ?? 0, planned)

  if (!trip) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="Trip not found"
        body="That trip id is not in this workspace."
        action={<Button type="button" onClick={() => navigate('/traveler/trips')}>Back to trips</Button>}
      />
    )
  }

  const applyAlternative = (alt: NodeAlternative) => {
    if (!selected) return
    setCompareAlt(null)
    applyNodePatch(trip.id, selected.id, alt.patch)
    if (alt.id === 'alt-train' || alt.name.toLowerCase().includes('railway')) {
      setPath('train')
    }
    pushToast({
      title: 'Path updated to green',
      body: `${alt.name} is now on the green path. ${alt.benefit} · ${alt.timeImpact}.`,
    })
  }

  const confirmVisit = (node: TripNode) => {
    markNodeVisited(trip.id, node.id)
    setLeaving(null)
    pushToast({
      title: 'Stop marked visited',
      body: `${node.title} checklist completed. Position advanced on the canvas.`,
    })
  }

  // Group days for left rail
  const days = Array.from(new Set(nodes.map((n) => n.day))).sort((a, b) => a - b)

  const scrollToDay = (dayNum: number) => {
    setActiveDay(dayNum)
    const el = document.getElementById(`canvas-day-${dayNum}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const compareSide: CompareSide | null = selected
    ? {
        name: selected.title,
        price: selected.cost,
        duration: '2 hours',
        distance: 'Local',
        rating: 4.5,
        convenience: 'Direct',
        feasibility: 'FEASIBLE',
      }
    : null

  return (
    <div className="-mx-4 -mt-4 relative flex min-h-[calc(100vh-4rem)] flex-col bg-[#101823] text-[#F3EFE7] lg:-mx-8 overflow-hidden">
      {/* ── Floating Top Bar (Navy #16212F over canvas) ──────────────── */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#16212F]/95 px-6 py-3 backdrop-blur-md shadow-xl">
        {/* Left: Back & Trip Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/traveler/trips')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#101823] text-slate-300 transition-colors hover:border-[#3FA772] hover:text-[#3FA772]"
            title="Back to trips"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-[#F3EFE7]">
              {trip.title}
            </h1>
            <p className="truncate text-xs font-semibold text-slate-400">
              {trip.route} · {formatDate(trip.startDate)} – {formatDate(trip.endDate, 'long')}
            </p>
          </div>
          <label className="hidden min-w-[200px] sm:block">
            <span className="sr-only">Switch trip</span>
            <select
              value={trip.id}
              onChange={(event) => navigate(`/traveler/trips/${event.target.value}`)}
              className="w-full rounded-xl border border-slate-700 bg-[#101823] px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
            >
              {liveTrips.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.status === 'live' ? 'Live · ' : item.status === 'completed' ? 'Done · ' : 'Plan · '}
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Middle: Running Total + Slim Budget Health Meter */}
        <div className="hidden md:flex items-center gap-4">
          <BudgetHealth
            budget={trip.budget}
            planned={planned}
            prediction={
              health.remaining >= 0
                ? `Tracking ${formatINR(health.remaining)} under budget`
                : `Over budget by ${formatINR(Math.abs(health.remaining))}`
            }
          />
        </div>

        {/* Right: Controls & View Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-[#101823] p-1">
            <button
              type="button"
              onClick={() => setZoom((v) => Math.max(0.7, v - 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((v) => Math.min(1.3, v + 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Fit view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView(view === 'map' ? 'flow' : 'map')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
              view === 'map'
                ? 'border-[#3FA772] bg-[#3FA772] text-white shadow-md'
                : 'border-slate-700 bg-[#101823] text-slate-300 hover:border-[#3FA772]',
            )}
          >
            {view === 'map' ? <Layers className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
            <span>{view === 'map' ? 'Canvas View' : 'Map View'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/traveler/predict/${trip.id}`)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-100 hover:border-rose-400"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Predict
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => {
              sessionStorage.removeItem(`tf-flow-live-${trip.id}`)
              void refreshLivePlan(trip.id)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#101823] px-3 py-2 text-xs font-bold text-slate-200 hover:border-[#3FA772] disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? 'Composing…' : 'Rebuild live flow'}
          </button>
        </div>
      </div>

      {/* ── Main Surface: Left Rail + Canvas ────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Rail (Days selector) */}
        <aside className="z-20 flex flex-col gap-2 border-r border-slate-800/80 bg-[#16212F] p-3 text-xs shadow-lg w-16 md:w-20">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center block mb-1">
            Days
          </span>
          {days.map((dayNum) => (
            <button key={dayNum}
              type="button"
              onClick={() => scrollToDay(dayNum)}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl p-2.5 transition-all font-bold',
                activeDay === dayNum
                  ? 'bg-[#3FA772] text-white shadow-md scale-105'
                  : 'bg-[#101823] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200',
              )}
            >
              <span className="text-[10px] uppercase tracking-wider font-extrabold">Day</span>
              <span className="text-base font-extrabold">{dayNum}</span>
            </button>
          ))}
        </aside>

        {/* Center Base Layer: Graph Canvas / Map View */}
        <main className="relative flex-1 overflow-hidden bg-[#101823]">
          {generating ? (
            <div className="absolute inset-x-0 top-0 z-20 border-b border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100">
              Pulling live flights, stays, and places{liveSources.length ? ` · ${liveSources.join(' · ')}` : ''} — the map and day columns will update in place.
            </div>
          ) : null}
          {view === 'map' ? (
            <div className="h-full w-full">
              <TripMap
                title={trip.title}
                caption={trip.route}
                nodes={located}
                routes={routes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                height={650}
                searchEnabled
              />
            </div>
          ) : (
            <FlowCanvas
              nodes={nodes}
              path={path}
              selectedId={selectedId}
              view={mobile ? 'timeline' : view}
              zoom={zoom}
              branches={branches}
              onSelect={setSelectedId}
              onAdd={setAddAfter}
              onSelectBranch={(branch) => {
                setSelectedId(branch.id)
                if (selected) {
                  const alts = alternativesFor(selected)
                  const found = alts.find((a) => a.id === branch.id)
                  if (found) setCompareAlt(found)
                }
              }}
            />
          )}
        </main>
      </div>

      {/* ── Right-side Detail Drawer ────────────────────────────── */}
      <NodeDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        node={selected}
        path={path}
        onKeep={() => setSelectedId(null)}
        onCompare={applyAlternative}
        onVisit={selected ? () => setLeaving(selected) : undefined}
        onExtend={selected ? () => setAddAfter(selected.id) : undefined}
        onDelete={
          selected
            ? () => {
                deleteTripNode(trip.id, selected.id)
                setSelectedId(null)
              }
            : undefined
        }
      />

      {/* ── Alternative Comparison Modal ───────────────────────── */}
      <Comparison
        open={Boolean(compareAlt)}
        current={compareSide}
        alternative={compareAlt}
        onClose={() => setCompareAlt(null)}
        onKeep={() => setCompareAlt(null)}
        onChoose={applyAlternative}
      />

      {/* ── Pre-checkout Checklist Modal (Mark Visited) ───────────── */}
      <VisitPrecaution
        node={leaving}
        open={Boolean(leaving)}
        onCancel={() => setLeaving(null)}
        onConfirm={() => leaving && confirmVisit(leaving)}
      />

      <AddStopModal
        open={Boolean(addAfter)}
        after={afterNode}
        onClose={() => setAddAfter(null)}
        onAdd={(node) => {
          insertTravelNode(trip.id, addAfter, node)
          setAddAfter(null)
          setSelectedId(null)
        }}
      />

      {/* ── Persistent Terracotta Voice Assistant Orb (#C96A4B) ────── */}
      <AskTripFlow
        node={selected}
        path={path}
        onKeep={() => setSelectedId(null)}
        onCompare={applyAlternative}
      />
    </div>
  )
}
