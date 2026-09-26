import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Search } from '@/components/ui/Search'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/Feedback'
import { UsersRound } from 'lucide-react'
import {
  assignmentsFor,
  loadRoster,
  type DeskCoordinator,
  type DeskStatus,
} from '@/pages/operator/coordinators/catalog'
import { loadTours } from '@/pages/operator/tours/catalog'
import { FieldMap } from '@/pages/operator/coordinators/FieldMap'

type Tab = 'all' | DeskStatus

const statusTone: Record<DeskStatus, 'success' | 'info' | 'neutral'> = {
  Available: 'success',
  Assigned: 'info',
  Offline: 'neutral',
}

export function OperatorCoordinators() {
  const navigate = useNavigate()
  const people = useMemo(() => loadRoster(), [])
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(people[0]?.id ?? '')
  const [focusTour, setFocusTour] = useState(loadTours()[0]?.id ?? '')
  const tours = useMemo(() => loadTours(), [])
  const tour = tours.find((item) => item.id === focusTour) ?? null

  const rows = useMemo(
    () =>
      people.filter((person) => {
        if (tab !== 'all' && person.status !== tab) return false
        return `${person.name} ${person.location} ${person.city}`.toLowerCase().includes(query.toLowerCase())
      }),
    [people, tab, query],
  )

  const active = people.find((person) => person.id === selected) ?? rows[0] ?? null

  return (
    <div>
      <PageHeader
        title="Coordinator desk"
        description="Field owners for traveler comms, hops, vendors, and emergency cover — assignable across live tours."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Coordinators' }]}
        actions={
          <Button type="button" onClick={() => navigate(`/operator/coordinators/assign?tour=${focusTour}`)}>
            Assign Coordinator
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'Available', label: 'Available' },
          { id: 'Assigned', label: 'Assigned' },
          { id: 'Offline', label: 'Offline' },
        ]}
      />
      <Search value={query} onChange={setQuery} placeholder="Search name or city" className="mt-4 max-w-md" />

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-3">
          {rows.length ? (
            rows.map((person) => (
              <CoordinatorRow
                key={person.id}
                person={person}
                selected={selected === person.id}
                onOpen={() => setSelected(person.id)}
                onAssign={() => navigate(`/operator/coordinators/assign?tour=${focusTour}&coordinator=${person.id}`)}
              />
            ))
          ) : (
            <EmptyState icon={<UsersRound className="h-5 w-5" />} title="No coordinators in this filter" body="Switch status or clear search." />
          )}
        </div>
        <div className="space-y-4">
          <label className="block text-[12px] font-medium text-slate-500">
            Tour destination on map
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm"
              value={focusTour}
              onChange={(event) => setFocusTour(event.target.value)}
            >
              {tours.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.destination}
                </option>
              ))}
            </select>
          </label>
          <FieldMap people={rows.length ? rows : people} tour={tour} selectedId={selected} onSelect={setSelected} />
          {active ? <CoordinatorFile person={active} /> : null}
        </div>
      </div>
    </div>
  )
}

function CoordinatorRow({
  person,
  selected,
  onOpen,
  onAssign,
}: {
  person: DeskCoordinator
  selected: boolean
  onOpen: () => void
  onAssign: () => void
}) {
  const live = assignmentsFor(person.id)
  return (
    <Card className={selected ? 'border-brand-300' : undefined}>
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar initials={person.initials} name={person.name} />
            <div>
              <p className="card-title">{person.name}</p>
              <p className="meta mt-0.5">{person.location}</p>
            </div>
          </div>
          <Badge tone={statusTone[person.status]}>{person.status}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div>
            <p className="meta">Assigned tours</p>
            <p className="mt-0.5 font-medium">{live.length ? live.map((row) => row.fileNo).join(', ') : 'None'}</p>
          </div>
          <div>
            <p className="meta">Current location</p>
            <p className="mt-0.5 font-medium">{person.location}</p>
          </div>
          <div>
            <p className="meta">Availability</p>
            <p className="mt-0.5 font-medium">{person.availability}</p>
          </div>
        </div>
      </button>
      <div className="mt-3">
        <Button type="button" size="sm" variant="secondary" disabled={person.status === 'Offline'} onClick={onAssign}>
          Assign Coordinator
        </Button>
      </div>
    </Card>
  )
}

function CoordinatorFile({ person }: { person: DeskCoordinator }) {
  const live = assignmentsFor(person.id)
  return (
    <Card>
      <p className="card-title">{person.name}</p>
      <p className="meta mt-1">{person.phone} · {person.languages.join(' · ')}</p>
      <p className="mt-3 text-sm text-slate-600">{person.availability} from {person.location}.</p>
      <div className="mt-4 space-y-2">
        {live.length ? (
          live.map((row) => (
            <div key={row.tourId} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <p className="font-semibold">{row.fileNo}</p>
              <p className="meta mt-0.5">{row.party} · {row.destination}</p>
              <p className="mt-1 text-[12px] text-slate-500">{row.responsibilities.join(' · ')}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No live tour file. Ready to take a circuit.</p>
        )}
      </div>
    </Card>
  )
}
