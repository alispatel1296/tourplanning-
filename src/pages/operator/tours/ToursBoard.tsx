import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Search } from '@/components/ui/Search'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppState } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import { Briefcase } from 'lucide-react'
import {
  destinations,
  loadTours,
  persistTours,
  type ManagedTour,
  type TourLife,
} from '@/pages/operator/tours/catalog'
import { deskFirstNames } from '@/pages/operator/coordinators/catalog'

type Tab = 'all' | TourLife

export function OperatorTours() {
  const { pushToast } = useAppState()
  const navigate = useNavigate()
  const [tours, setTours] = useState(loadTours)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [destination, setDestination] = useState('all')
  const [coordinator, setCoordinator] = useState('all')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [edit, setEdit] = useState<ManagedTour | null>(null)

  const save = (next: ManagedTour[]) => {
    setTours(next)
    persistTours(next)
  }

  const rows = useMemo(() => {
    return tours.filter((tour) => {
      if (tab !== 'all' && tour.status !== tab) return false
      if (status !== 'all' && tour.status !== status) return false
      if (destination !== 'all' && tour.destination !== destination) return false
      if (coordinator !== 'all' && tour.coordinator !== coordinator) return false
      if (from && tour.end < from) return false
      if (to && tour.start > to) return false
      const blob = `${tour.code} ${tour.name} ${tour.party} ${tour.route} ${tour.coordinator}`.toLowerCase()
      return blob.includes(query.toLowerCase())
    })
  }, [tours, tab, query, destination, coordinator, status, from, to])

  return (
    <div>
      <PageHeader
        title="Tour management"
        description="Every live, booked, and planned circuit on the Horizon Trails desk."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Tours' }]}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'planning', label: 'Planning' },
          { id: 'booked', label: 'Booked' },
          { id: 'ongoing', label: 'Ongoing' },
          { id: 'completed', label: 'Completed' },
        ]}
      />

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <Search value={query} onChange={setQuery} placeholder="Search ID, traveler, route" className="xl:col-span-2" />
        <Select label="Destination" value={destination} onChange={setDestination} options={['all', ...destinations]} />
        <Select label="Coordinator" value={coordinator} onChange={setCoordinator} options={['all', ...deskFirstNames()]} />
        <Select label="Status" value={status} onChange={setStatus} options={['all', 'planning', 'booked', 'ongoing', 'completed']} />
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500">From</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500">To</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm" />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.length ? (
          rows.map((tour) => (
            <Card key={tour.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="meta">{tour.code}</p>
                  <h3 className="card-title mt-1">{tour.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{tour.party}</p>
                </div>
                <StatusBadge status={tour.status} />
              </div>
              <p className="mt-3 text-sm">{tour.route}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div>
                  <p className="meta">Dates</p>
                  <p className="font-medium">{tour.dates}</p>
                </div>
                <div>
                  <p className="meta">Budget</p>
                  <p className="font-medium">{formatINR(tour.budget)}</p>
                </div>
                <div>
                  <p className="meta">Coordinator</p>
                  <p className="font-medium">{tour.coordinator}</p>
                </div>
                <div>
                  <p className="meta">Alerts</p>
                  {tour.alert ? <Badge tone="danger">{tour.alert}</Badge> : <p className="text-slate-400">None</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => navigate(`/operator/tours/${tour.id}`)}>
                  Open
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setEdit(tour)}>
                  Edit
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/operator/coordinators/assign?tour=${tour.id}`)}>
                  Assign Coordinator
                </Button>
                <Button
type="button"                   size="sm"
                  variant="outline"
                  onClick={() => {
                    const copy: ManagedTour = {
                      ...tour,
                      id: `${tour.id}-copy-${crypto.randomUUID().slice(0, 4)}`,
                      code: `${tour.code}-D`,
                      status: 'planning',
                      spent: 0,
                      alert: '',
                      notes: `Duplicated from ${tour.code}.`,
                    }
                    save([copy, ...tours])
                    pushToast({ title: 'Tour duplicated', body: `${copy.code} is in Planning.` })
                  }}
                >
                  Duplicate
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState icon={<Briefcase className="h-5 w-5" />} title="No tours in this filter" body="Clear destination, desk, or dates to widen the board." />
        )}
      </div>

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title="Edit tour">
        {edit ? (
          <div className="space-y-3">
            <label className="block text-[12px] font-medium text-slate-500">
              Dates label
              <input
                className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm"
                value={edit.dates}
                onChange={(event) => setEdit({ ...edit, dates: event.target.value })}
              />
            </label>
            <label className="block text-[12px] font-medium text-slate-500">
              Budget
              <input
                type="number"
                className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm"
                value={edit.budget}
                onChange={(event) => setEdit({ ...edit, budget: Number(event.target.value) })}
              />
            </label>
            <Button
type="button"               onClick={() => {
                save(tours.map((tour) => (tour.id === edit.id ? edit : tour)))
                setEdit(null)
                pushToast({ title: 'Tour updated', body: `${edit.code} is saved on the desk.` })
              }}
            >
              Save
            </Button>
          </div>
        ) : null}
      </Modal>

    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-line px-3 text-sm">
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'all' ? `All ${label.toLowerCase()}` : option}
          </option>
        ))}
      </select>
    </label>
  )
}
