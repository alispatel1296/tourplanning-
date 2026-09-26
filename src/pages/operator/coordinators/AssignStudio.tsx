import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useAppState } from '@/state/AppState'
import { loadTours } from '@/pages/operator/tours/catalog'
import {
  applyCoordinatorAssignment,
  assignableRoster,
  assignmentsFor,
  distanceLabel,
  findCoordinator,
  responsibilityOptions,
  tourFileNo,
  type DeskCoordinator,
  type Responsibility,
} from '@/pages/operator/coordinators/catalog'
import { FieldMap } from '@/pages/operator/coordinators/FieldMap'

export function AssignStudio() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pushToast } = useAppState()
  const tours = useMemo(() => loadTours(), [])
  const [tourId, setTourId] = useState(params.get('tour') ?? tours[0]?.id ?? '')
  const [pick, setPick] = useState<string | null>(params.get('coordinator'))
  const [duties, setDuties] = useState<Responsibility[]>(['Traveler coordination', 'Emergency support'])
  const [confirm, setConfirm] = useState<string | null>(null)
  const tour = tours.find((item) => item.id === tourId) ?? null
  const people = useMemo(() => assignableRoster(), [])
  const selected = people.find((person) => person.id === pick) ?? null

  const toggle = (duty: Responsibility) => {
    setDuties((current) => (current.includes(duty) ? current.filter((item) => item !== duty) : [...current, duty]))
  }

  const submit = () => {
    if (!tour || !selected) return
    if (!duties.length) {
      pushToast({ title: 'Choose responsibilities', body: 'Pick at least one desk duty before confirming.' })
      return
    }
    const message = applyCoordinatorAssignment(tour, selected, duties)
    setConfirm(message)
    pushToast({ title: 'Coordinator assigned', body: message })
  }

  if (confirm && selected && tour) {
    return (
      <div>
        <PageHeader
          title="Assignment confirmed"
          description="The live desk and command board now point at this coordinator."
          crumbs={[
            { label: 'Coordinators', to: '/operator/coordinators' },
            { label: 'Assigned' },
          ]}
        />
        <Card className="max-w-xl">
          <p className="font-display text-xl font-semibold">{confirm}</p>
          <p className="mt-2 text-sm text-slate-600">
            {selected.name} owns {tour.party} from {selected.location}. Duties: {duties.join(' · ')}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={() => navigate('/operator')}>Open dashboard</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/operator/tours/${tour.id}`)}>
              Open tour
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/operator/coordinators')}>
              Coordinator roster
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Assign Coordinator"
        description="Available field desks, distance to the tour destination, then responsibilities."
        crumbs={[
          { label: 'Coordinators', to: '/operator/coordinators' },
          { label: 'Assign' },
        ]}
      />

      <Card className="mb-5">
        <p className="meta">Tour</p>
        <select
          className="mt-2 h-11 w-full max-w-xl rounded-lg border border-line px-3 text-sm"
          value={tourId}
          onChange={(event) => {
            setTourId(event.target.value)
            setPick(null)
          }}
        >
          {tours.map((item) => (
            <option key={item.id} value={item.id}>
              {tourFileNo(item)} · {item.party} · {item.destination}
            </option>
          ))}
        </select>
        {tour ? (
          <p className="mt-2 text-sm text-slate-600">
            Current desk {findCoordinator(tour.coordinator)?.name ?? tour.coordinator} · {tour.route}
          </p>
        ) : null}
      </Card>

      {tour ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Available coordinators</p>
            {people.map((person) => (
              <CoordinatorPick
                key={person.id}
                person={person}
                tour={tour}
                selected={pick === person.id}
                onSelect={() => setPick(person.id)}
              />
            ))}
          </div>
          <div className="space-y-4">
            <FieldMap people={people} tour={tour} selectedId={pick} onSelect={setPick} />
            <Card>
              <p className="card-title">Responsibilities</p>
              <p className="meta mt-1">Choose the duties this desk owns after assignment.</p>
              <div className="mt-3 space-y-2">
                {responsibilityOptions.map((duty) => (
                  <label key={duty} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={duties.includes(duty)} onChange={() => toggle(duty)} />
                    {duty}
                  </label>
                ))}
              </div>
              <Button type="button" className="mt-4" disabled={!selected} onClick={submit}>
                Confirm assignment
              </Button>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CoordinatorPick({
  person,
  tour,
  selected,
  onSelect,
}: {
  person: DeskCoordinator
  tour: NonNullable<ReturnType<typeof loadTours>[number]>
  selected: boolean
  onSelect: () => void
}) {
  const live = assignmentsFor(person.id)
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <Card className={selected ? 'border-brand-300' : undefined}>
        <div className="flex items-start gap-3">
          <Avatar initials={person.initials} name={person.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="card-title">{person.name}</p>
              <Badge tone={person.status === 'Available' ? 'success' : 'info'}>{person.status}</Badge>
            </div>
            <p className="meta mt-1">Current location · {person.location}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="meta">Current assignments</p>
            <p className="mt-0.5">{live.length ? live.map((row) => row.fileNo).join(', ') : 'None live'}</p>
          </div>
          <div>
            <p className="meta">Distance from tour</p>
            <p className="mt-0.5">{distanceLabel(person, tour)}</p>
          </div>
          <div>
            <p className="meta">Languages</p>
            <p className="mt-0.5">{person.languages.join(', ')}</p>
          </div>
          <div>
            <p className="meta">Availability</p>
            <p className="mt-0.5">{person.availability}</p>
          </div>
        </div>
      </Card>
    </button>
  )
}
