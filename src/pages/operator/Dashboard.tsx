import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  IndianRupee,
  Sparkles,
  TriangleAlert,
  Users,
  UsersRound,
  Waypoints,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Overlay'
import { AIInsightCard } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { formatINR, cn } from '@/lib/cn'
import { IndiaOpsMap } from '@/pages/operator/command/IndiaOpsMap'
import { opsAlerts, opsTours, type OpsTour } from '@/pages/operator/command/data'
import { aaravAlert, aaravNotes, readLiveMirror } from '@/lib/liveMirror'
import { loadDeskNames } from '@/pages/operator/coordinators/catalog'
import { loadTours } from '@/pages/operator/tours/catalog'

const kpis = [
  { label: 'Active Tours', value: '24', trend: '+2 this week', icon: Waypoints, tone: 'info' as const },
  { label: "Today's Travelers", value: '86', trend: '+12 vs yesterday', icon: Users, tone: 'default' as const },
  { label: 'Bookings', value: '₹8.4L', trend: '+9% vs last week', icon: IndianRupee, tone: 'success' as const },
  { label: 'Open Alerts', value: '6', trend: '3 weather · 2 stay', icon: TriangleAlert, tone: 'danger' as const },
  { label: 'AI Optimizations', value: '17', trend: '+5 today', icon: Sparkles, tone: 'ai' as const },
]

function hydrateOpsTours(): OpsTour[] {
  const desk = loadDeskNames()
  const managed = loadTours()
  const alert = aaravAlert()
  return opsTours.map((row) => ({
    ...row,
    coordinator: desk[row.id] ?? managed.find((tour) => tour.id === row.id)?.coordinator ?? row.coordinator,
    alert: row.id === 'op-aarav' ? alert : row.alert,
    budget: row.id === 'op-aarav' ? 65000 : row.budget,
  }))
}

function liveAlerts() {
  const { disruption } = readLiveMirror()
  if (disruption === 'idle') return opsAlerts
  const live = {
    id: 'aarav-live',
    tone: disruption === 'approved' ? ('success' as const) : ('warning' as const),
    title:
      disruption === 'approved'
        ? 'Aarav Shah reroute is desk-confirmed'
        : disruption === 'accepted'
          ? 'Aarav Shah accepted the indoor swap'
          : 'Baga swell is live on Aarav Shah’s file',
    body: aaravNotes(),
    to: '/operator/conflicts',
  }
  return [live, ...opsAlerts]
}

export function OperatorDashboard() {
  const { pushToast } = useAppState()
  const navigate = useNavigate()
  const [tours, setTours] = useState(hydrateOpsTours)
  const [cluster, setCluster] = useState<string | null>(null)
  const [selected, setSelected] = useState<OpsTour | null>(null)
  const [alertId, setAlertId] = useState<string | null>(null)
  const [action, setAction] = useState<'tour' | 'vendor' | null>(null)
  const [draft, setDraft] = useState({ traveler: '', destination: '', dates: '22–28 Oct', coordinator: 'Riya', tourId: opsTours[0].id })
  const alerts = liveAlerts()
  const disruption = readLiveMirror().disruption

  const rows = useMemo(
    () => (cluster ? tours.filter((tour) => tour.cluster === cluster) : tours),
    [tours, cluster],
  )
  const alert = alerts.find((item) => item.id === alertId) ?? null

  return (
    <div>
      <PageHeader
        eyebrow="Command center"
        title="Good morning, Priya"
        description="Here's what's happening across your tours."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/operator/twin')}>
              Weather Twin
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/operator/conflicts')}>
              Review Conflicts
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Kpi key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          <Card padded={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <h2 className="card-title">Active tours</h2>
                <p className="meta">
                  {rows.length} on the board{cluster ? ` · ${cluster}` : ''}
                </p>
              </div>
              {cluster ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => setCluster(null)}>
                  Clear cluster
                </Button>
              ) : null}
            </div>
            <div className="overflow-x-auto app-scrollbar">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--color-warm-ivory)]/50 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-charcoal)]/50">
                  <tr>
                    {['Tour', 'Traveler', 'Destination', 'Dates', 'Status', 'Budget', 'Coordinator', 'Alert'].map((col) => (
                      <th key={col} className="px-3 py-2.5 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-t border-line hover:bg-slate-50"
                      onClick={() => setSelected(row)}
                    >
                      <td className="px-3 py-3 font-medium">{row.tour}</td>
                      <td className="px-3 py-3">{row.traveler}</td>
                      <td className="px-3 py-3">{row.destination}</td>
                      <td className="px-3 py-3 text-slate-600">{row.dates}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-3 font-semibold">{formatINR(row.budget)}</td>
                      <td className="px-3 py-3">{row.coordinator}</td>
                      <td className="px-3 py-3">
                        {row.alert ? (
                          <Badge tone={row.alert.includes('Weather') ? 'danger' : row.alert.includes('pending') ? 'ai' : 'warning'}>
                            {row.alert}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <IndiaOpsMap
            active={cluster}
            onSelect={(city) => setCluster((current) => (current === city ? null : city))}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">AI Alerts</p>
            <div className="mt-3 space-y-2">
              {alerts.map((item) => (
                <button key={item.id}
                  type="button"
                  onClick={() => setAlertId(item.id)}
                  className="flex w-full gap-2 rounded-xl border border-line px-3 py-3 text-left hover:bg-slate-50"
                >
                  <span className={cn('mt-0.5 text-sm', item.tone === 'success' ? 'text-emerald-600' : 'text-amber-600')}>
                    {item.tone === 'success' ? '✓' : '⚠'}
                  </span>
                  <span>
                  <span className="block text-sm font-semibold text-[var(--color-charcoal)]">{item.title}</span>
                  <span className="meta">{item.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <AIInsightCard
            title="AI Operations Insight"
            body={
              disruption === 'accepted'
                ? 'Aarav Shah accepted Beach → Cooking class on West Coast Circuit. Same file is open in Conflict Console.'
                : disruption === 'approved'
                  ? 'Indoor food is desk-confirmed on Aarav Shah’s live path. Weather W6 shows a recovered activity.'
                  : disruption === 'staged'
                    ? 'Baga beach is red on Aarav Shah’s live companion. Indoor alternative is staged in yellow.'
                    : '4 active tours have less than 45 minutes of transit buffer.'
            }
            confidence={0.9}
            actionLabel="Review Conflicts"
            onAction={() => navigate('/operator/conflicts')}
          />

          <Card>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quick actions</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" icon={<Briefcase className="h-4 w-4" />} onClick={() => setAction('tour')}>
                Create Tour
              </Button>
              <Button type="button" variant="secondary" icon={<UsersRound className="h-4 w-4" />} onClick={() => navigate('/operator/coordinators/assign')}>
                Assign Coordinator
              </Button>
              <Button type="button" variant="secondary" icon={<Building2 className="h-4 w-4" />} onClick={() => setAction('vendor')}>
                Add Vendor
              </Button>
              <Button type="button" icon={<TriangleAlert className="h-4 w-4" />} onClick={() => navigate('/operator/conflicts')}>
                Review Conflicts
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.traveler ?? 'Tour'}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              {selected.tour} · {selected.destination} · {selected.dates}
            </p>
            <p>
              Status <StatusBadge status={selected.status} /> · Budget {formatINR(selected.budget)} · Desk {selected.coordinator}
            </p>
            {selected.alert ? <Badge tone={selected.alert.includes('Weather') ? 'danger' : 'ai'}>{selected.alert}</Badge> : <p className="text-slate-500">No open alert on this pax.</p>}
            {selected.id === 'op-aarav' ? <p className="text-slate-600">{aaravNotes()}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" onClick={() => navigate(selected.id === 'op-aarav' ? '/operator/tours/op-aarav' : '/operator/tours')}>
                Open tour product
              </Button>
              <Button
type="button"                 size="sm"
                variant="secondary"
                onClick={() => navigate(`/operator/coordinators/assign?tour=${selected.id}`)}
              >
                Assign Coordinator
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(alert)} onClose={() => setAlertId(null)} title={alert?.title ?? 'Alert'}>
        {alert ? (
          <div>
            <p className="text-sm text-slate-600">{alert.body}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAlertId(null)}>
                Dismiss
              </Button>
              <Button
type="button"                 onClick={() => {
                  setAlertId(null)
                  navigate(alert.to)
                }}
              >
                Open desk
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={action === 'tour'} onClose={() => setAction(null)} title="Create tour">
        <p className="text-sm text-slate-600">Adds a live row to this command board. No inventory is booked.</p>
        <div className="mt-4 space-y-3">
          <Field label="Lead traveler" value={draft.traveler} onChange={(traveler) => setDraft((current) => ({ ...current, traveler }))} />
          <Field label="Destination" value={draft.destination} onChange={(destination) => setDraft((current) => ({ ...current, destination }))} />
          <Field label="Dates" value={draft.dates} onChange={(dates) => setDraft((current) => ({ ...current, dates }))} />
        </div>
        <Button
type="button"           className="mt-4"
          onClick={() => {
            if (!draft.traveler.trim() || !draft.destination.trim()) {
              pushToast({ title: 'Add traveler and destination', body: 'The command board needs both to open a tour row.' })
              return
            }
            setTours((current) => [
              {
                id: `op-${crypto.randomUUID().slice(0, 6)}`,
                tour: 'Custom FIT',
                traveler: draft.traveler.trim(),
                destination: draft.destination.trim(),
                dates: draft.dates,
                status: 'confirmed',
                budget: 45000,
                coordinator: draft.coordinator,
                alert: '',
                cluster: 'Mumbai',
              },
              ...current,
            ])
            setAction(null)
            pushToast({ title: 'Tour opened', body: `${draft.traveler} is on the active board.` })
          }}
        >
          Add to board
        </Button>
      </Modal>

      <Modal open={action === 'vendor'} onClose={() => setAction(null)} title="Add vendor">
        <p className="text-sm text-slate-600">Stage a partner on the vendor desk. Inventory is not contracted.</p>
        <Button
type="button"           className="mt-4"
          onClick={() => {
            setAction(null)
            pushToast({ title: 'Vendor desk', body: 'Onboard a partner on the reusable marketplace.' })
            navigate('/operator/vendors')
          }}
        >
          Open vendor desk
        </Button>
      </Modal>
    </div>
  )
}

function Kpi({
  label,
  value,
  trend,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  trend: string
  icon: typeof Waypoints
  tone: 'default' | 'success' | 'warning' | 'danger' | 'ai' | 'info'
}) {
  const tones = {
    default: 'bg-[var(--color-warm-ivory)] text-[var(--color-charcoal)]',
    success: 'bg-[var(--color-ocean)]/10 text-[var(--color-ocean)]',
    warning: 'bg-[var(--color-muted-gold)]/20 text-[var(--color-charcoal)]',
    danger: 'bg-red-50 text-red-600',
    ai: 'bg-[var(--color-charcoal)] text-[var(--color-muted-gold)]',
    info: 'bg-[var(--color-sky)]/50 text-[var(--color-ocean)]',
  }
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="meta">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-[var(--color-charcoal)]">{value}</p>
      <p className="mt-1 text-[13px] font-medium text-[var(--color-charcoal)]/50">{trend}</p>
    </Card>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-line px-3 text-sm"
      />
    </label>
  )
}
