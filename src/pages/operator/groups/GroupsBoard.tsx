import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Radio } from 'lucide-react'
import { syncGroups } from '@/pages/operator/groups/sync'

const tone = {
  syncing: 'ai' as const,
  forming: 'warning' as const,
  locked: 'success' as const,
}

export function OperatorGroups() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Group Sync"
        description="Members file preferences privately. AI blends a consensus itinerary — it does not pick a winner."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Groups' }]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {syncGroups.map((group) => (
          <Card key={group.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="card-title">{group.name}</p>
                <p className="meta mt-1">{group.dates} · {group.city}</p>
              </div>
              <Badge tone={tone[group.status]}>{group.status === 'syncing' ? 'Sync live' : group.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {group.pax} travelers · {group.submitted}/{group.pax} preferences in
            </p>
            <p className="meta mt-1">Lead {group.lead}</p>
            <Button type="button"
              size="sm"
              className="mt-4"
              variant={group.id === 'grp-goa-friends' ? 'ai' : 'secondary'}
              icon={group.id === 'grp-goa-friends' ? <Radio className="h-4 w-4" /> : undefined}
              onClick={() => navigate(`/operator/groups/${group.id}`)}
            >
              {group.id === 'grp-goa-friends' ? 'Open Group Sync' : 'Open file'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
