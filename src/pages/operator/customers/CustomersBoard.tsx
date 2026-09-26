import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Search } from '@/components/ui/Search'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { formatINR } from '@/lib/cn'
import { Users } from 'lucide-react'
import { crmProfiles } from '@/pages/operator/customers/crm'

export function OperatorCustomers() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const rows = useMemo(
    () =>
      crmProfiles().filter((person) =>
        `${person.name} ${person.preferences} ${person.city} ${person.lastTrip}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <div>
      <PageHeader
        title="Customer CRM"
        description="Travel files — preferences, spend, and the next circuit — not a generic contact list."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Customers' }]}
      />
      <Search value={query} onChange={setQuery} placeholder="Search traveler, preference, last trip" className="mb-4 max-w-md" />
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto app-scrollbar">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                {['Name', 'Trips', 'Last trip', 'Preferences', 'Total spend', 'Status'].map((col) => (
                  <th key={col} className="px-3 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <tr
                  key={person.id}
                  className="cursor-pointer border-t border-line hover:bg-slate-50"
                  onClick={() => navigate(`/operator/customers/${person.id}`)}
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold">{person.name}</p>
                    <p className="meta">{person.city}</p>
                  </td>
                  <td className="px-3 py-3">{person.trips}</td>
                  <td className="px-3 py-3 text-slate-600">{person.lastTrip}</td>
                  <td className="px-3 py-3">{person.preferences}</td>
                  <td className="px-3 py-3 font-semibold">{formatINR(person.spend)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={person.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {rows.length ? null : (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No travelers match" body="Try a destination, stay style, or name." />
      )}
    </div>
  )
}
