import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { AIInsightCard, AILabel, AIRecommendationCard } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { cn } from '@/lib/cn'
import { Radio, Sparkles } from 'lucide-react'
import {
  loadGroup,
  loadVotes,
  persistVote,
  prefKeys,
  type GroupMember,
  type MemberVote,
  type SyncGroup,
} from '@/pages/operator/groups/sync'

export function GroupSync() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useAppState()
  const group = loadGroup(id ?? '')
  const [ready, setReady] = useState(group?.id === 'grp-goa-friends')
  const [votes, setVotes] = useState<Record<string, MemberVote>>(() => loadVotes(id ?? ''))
  const [suggest, setSuggest] = useState<GroupMember | null>(null)
  const [note, setNote] = useState('')

  const accepted = useMemo(
    () => Object.values(votes).filter((row) => row.vote === 'accept').length,
    [votes],
  )

  if (!group) {
    return (
      <EmptyState
        icon={<Radio className="h-5 w-5" />}
        title="Group not on the desk"
        body="Pick a live file from Group Sync."
        action={<Button type="button" onClick={() => navigate('/operator/groups')}>Groups</Button>}
      />
    )
  }

  const vote = (member: GroupMember, next: MemberVote) => {
    persistVote(group.id, member.id, next)
    setVotes(loadVotes(group.id))
    pushToast({
      title: next.vote === 'accept' ? `${member.name} accepted` : `${member.name} suggested a change`,
      body: next.note || 'Logged against the consensus plan. No winner is declared.',
    })
  }

  return (
    <div>
      <PageHeader
        title={group.name}
        description={`${group.pax} travelers · preferences filed privately · AI blends, the group decides`}
        crumbs={[
          { label: 'Groups', to: '/operator/groups' },
          { label: group.name },
        ]}
        actions={
          <Button type="button" variant="ai" icon={<Sparkles className="h-4 w-4" />} onClick={() => setReady(true)}>
            Build consensus
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {group.members.map((member) => (
          <Badge key={member.id} tone="neutral">
            {member.name}: {member.brief}
          </Badge>
        ))}
      </div>

      <PreferenceMatrix group={group} />

      {ready ? (
        <div className="mt-5 space-y-5">
          <Consensus group={group} />
          <ConflictCard group={group} />
          <Itinerary
            group={group}
            votes={votes}
            accepted={accepted}
            onAccept={(member) => vote(member, { vote: 'accept' })}
            onSuggest={(member) => {
              setNote(votes[member.id]?.note ?? '')
              setSuggest(member)
            }}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">Run consensus to cluster private briefs into a shared plan. TripFlow will not crown a winner.</p>
      )}

      <Modal open={Boolean(suggest)} onClose={() => setSuggest(null)} title="Suggest change">
        {suggest ? (
          <div>
            <p className="text-sm text-slate-600">
              {suggest.name} stays in the group. The note is logged — it does not veto the plan.
            </p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-3 min-h-28 w-full rounded-lg border border-line px-3 py-2 text-sm"
              placeholder="What should move?"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSuggest(null)}>
                Cancel
              </Button>
              <Button
type="button"                 onClick={() => {
                  vote(suggest, { vote: 'change', note: note.trim() || 'Asked to reshape an evening.' })
                  setSuggest(null)
                }}
              >
                Log suggestion
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function PreferenceMatrix({ group }: { group: SyncGroup }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="card-title">Preference matrix</p>
          <p className="meta">Private briefs, combined for the desk. Darker = stronger.</p>
        </div>
        <AILabel />
      </div>
      <div className="overflow-x-auto app-scrollbar">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-2.5">Travelers</th>
              {prefKeys.map((key) => (
                <th key={key} className="px-2 py-2.5 text-center">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.members.map((member) => (
              <tr key={member.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={member.initials} name={member.name} size="sm" />
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="meta">{member.brief}</p>
                    </div>
                  </div>
                </td>
                {prefKeys.map((key) => (
                  <td key={key} className="px-2 py-3">
                    <Heat value={member.scores[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Heat({ value }: { value: 0 | 1 | 2 }) {
  return (
    <div className="flex justify-center">
      <span
        title={value === 2 ? 'Strong' : value === 1 ? 'Present' : 'Not filed'}
        className={cn(
          'h-8 w-8 rounded-lg border',
          value === 2 && 'border-brand-400 bg-brand-500',
          value === 1 && 'border-brand-200 bg-brand-100',
          value === 0 && 'border-line bg-slate-50',
        )}
      />
    </div>
  )
}

function Consensus({ group }: { group: SyncGroup }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <AIInsightCard
        title="AI found 3 strong preference clusters."
        body="Counts are shares, not a ranking. The desk still chooses how to sequence them."
        confidence={0.86}
      />
      <Card>
        <p className="card-title">Cluster share</p>
        <div className="mt-3 space-y-3">
          {group.clusters.map((cluster) => (
            <div key={cluster.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{cluster.key}</span>
                <span className="tabular-nums text-slate-600">
                  {cluster.count}/{group.pax}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(cluster.count / group.pax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="xl:col-span-2">
        <AIRecommendationCard title="Blended recommendation" body={group.blend} />
      </div>
    </div>
  )
}

function ConflictCard({ group }: { group: SyncGroup }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <p className="card-title">{group.conflict.title}</p>
        <Badge tone="warning">Open tension</Badge>
        <AILabel />
      </div>
      <p className="mt-3 text-sm text-slate-600">Two live pulls. TripFlow will not pick a side.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="font-semibold">{group.conflict.left}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="font-semibold">{group.conflict.right}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-brand-800">
        <span className="font-semibold">AI suggestion · </span>
        {group.conflict.suggestion}
      </p>
    </Card>
  )
}

function Itinerary({
  group,
  votes,
  accepted,
  onAccept,
  onSuggest,
}: {
  group: SyncGroup
  votes: Record<string, MemberVote>
  accepted: number
  onAccept: (member: GroupMember) => void
  onSuggest: (member: GroupMember) => void
}) {
  if (!group.days.length) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Consensus itinerary unlocks when every member has filed a brief.</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <p className="card-title">Group itinerary</p>
          <AILabel />
        </div>
        <p className="meta mt-1">Blended from five private briefs. Sequence is a proposal.</p>
        <div className="mt-4 space-y-3">
          {group.days.map((day) => (
            <div key={day.day} className="rounded-xl border border-line px-3 py-3">
              <p className="meta">
                Day {day.day} · {day.time} · {day.city}
              </p>
              <p className="mt-1 font-semibold">{day.title}</p>
              <p className="mt-1 text-sm text-slate-600">{day.body}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {day.serves.map((tag) => (
                  <Badge key={tag} tone={tag === 'Nightlife' ? 'ai' : 'neutral'}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="card-title">Member votes</p>
        <p className="meta mt-1">
          {accepted}/{group.members.length} accepted
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-50">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${(accepted / group.members.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 space-y-3">
          {group.members.map((member) => {
            const row = votes[member.id]
            return (
              <div key={member.id} className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{member.name}</p>
                  {row?.vote === 'accept' ? <Badge tone="success">Accepted</Badge> : null}
                  {row?.vote === 'change' ? <Badge tone="warning">Change suggested</Badge> : null}
                </div>
                {row?.note ? <p className="mt-1 text-[12px] text-slate-500">{row.note}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => onAccept(member)}>
                    Accept
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onSuggest(member)}>
                    Suggest Change
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
