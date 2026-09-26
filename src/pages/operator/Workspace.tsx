import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConflictCard } from '@/components/domain/OperationalCards'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/state/AppState'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'

export { OperatorAnalytics } from '@/pages/operator/analytics/AnalyticsBoard'
export { OperatorNotifications } from '@/pages/intelligence/OperatorInbox'

export function OperatorConflicts() {
  const { conflicts, resolveConflict } = useAppState()
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all')

  const openCount = conflicts.filter((c) => c.state === 'open').length
  const investigatingCount = conflicts.filter((c) => c.state === 'investigating').length
  const resolvedCount = conflicts.filter((c) => c.state === 'resolved').length

  const filtered = conflicts.filter((item) => (filter === 'all' ? true : item.state === filter))

  return (
    <div>
      <PageHeader
        title="Conflicts Desk"
        description="AI-detected inventory, weather, and punctuality issues requiring operator review and approval."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <p className="meta font-semibold">Open Conflicts</p>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{openCount}</p>
          <p className="meta mt-1">Requires decision</p>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="meta font-semibold">Under Investigation</p>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{investigatingCount}</p>
          <p className="meta mt-1">Coordinator assigned</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="meta font-semibold">Resolved</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{resolvedCount}</p>
          <p className="meta mt-1">Actions executed</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
type="button"           size="sm"
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({conflicts.length})
        </Button>
        <Button
type="button"           size="sm"
          variant={filter === 'open' ? 'primary' : 'outline'}
          onClick={() => setFilter('open')}
        >
          Open ({openCount})
        </Button>
        <Button
type="button"           size="sm"
          variant={filter === 'investigating' ? 'primary' : 'outline'}
          onClick={() => setFilter('investigating')}
        >
          Investigating ({investigatingCount})
        </Button>
        <Button
type="button"           size="sm"
          variant={filter === 'resolved' ? 'primary' : 'outline'}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({resolvedCount})
        </Button>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-semibold">No conflicts in this view</p>
            <p className="meta mt-1">All operational items in this filter state are clear.</p>
          </div>
        ) : (
          filtered.map((conflict) => (
            <div key={conflict.id} className="relative">
              <ConflictCard
                conflict={conflict}
                onInvestigate={() => resolveConflict(conflict.id, 'investigating')}
                onResolve={() => resolveConflict(conflict.id)}
                resolveLabel={
                  conflict.id === 'cf-2' && conflict.state !== 'resolved'
                    ? 'Approve AI change'
                    : 'Resolve conflict'
                }
              />
              {conflict.state === 'resolved' ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Resolved & operational hold confirmed for traveler Aarav Shah.
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}



export function OperatorSettings() {
  const { user, signOut, signIn } = useAppState()
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Settings" description="Workspace defaults for Horizon Trails." />
      <Card className="max-w-xl">
        <p className="card-title">{user?.name}</p>
        <p className="meta mt-1">{user?.email} · Mumbai HQ</p>
        <p className="mt-4 text-sm text-slate-600">
          Currency INR · timezone Asia/Kolkata · default stay class 4-star · disruption SLA 20 minutes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/operator/settings/integrations')}>
            Integrations health
          </Button>
          <Button
type="button"             variant="secondary"
            onClick={() => {
              signIn('traveler')
              navigate('/traveler/live/trip-amd-goa')
            }}
          >
            Switch to Traveler Demo
          </Button>
          <Button
type="button"             variant="ghost"
            onClick={() => {
              signOut()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
