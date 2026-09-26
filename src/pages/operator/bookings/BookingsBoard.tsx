import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, MetricCard } from '@/components/ui/Card'
import { Search } from '@/components/ui/Search'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/Feedback'
import { useAppState } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import { CircleDollarSign, Clock3, Download, RotateCcw, Wallet } from 'lucide-react'
import {
  ledgerMetrics,
  loadLedger,
  payTone,
  splitProgress,
  toCsv,
  type LedgerBooking,
  type PayStatus,
} from '@/pages/operator/bookings/ledger'
import { RefundModal } from '@/pages/operator/bookings/RefundModal'

type Tab = 'all' | PayStatus

export function OperatorBookings() {
  const navigate = useNavigate()
  const { pushToast } = useAppState()
  const [rows, setRows] = useState(loadLedger)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [refund, setRefund] = useState<LedgerBooking | null>(null)
  const metrics = useMemo(() => ledgerMetrics(rows), [rows])

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (tab !== 'all' && row.paymentStatus !== tab) return false
        return `${row.id} ${row.traveler} ${row.tour}`.toLowerCase().includes(query.toLowerCase())
      }),
    [rows, tab, query],
  )

  const exportCsv = () => {
    const blob = new Blob([toCsv(visible)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tripflow-bookings.csv'
    link.click()
    URL.revokeObjectURL(url)
    pushToast({ title: 'CSV exported', body: `${visible.length} booking rows downloaded.` })
  }

  return (
    <div>
      <PageHeader
        title="Bookings & payments"
        description="Collected, outstanding, and refunded value across the desk."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Bookings' }]}
        actions={
          <Button type="button" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Booking Value" value={formatINR(metrics.total)} hint={`${rows.length} invoices`} icon={<CircleDollarSign className="h-4 w-4" />} />
        <MetricCard label="Pending Payments" value={formatINR(metrics.pending)} hint="Still due" icon={<Clock3 className="h-4 w-4" />} tone="warning" />
        <MetricCard label="Completed Payments" value={formatINR(metrics.completed)} hint="Captured" icon={<Wallet className="h-4 w-4" />} tone="success" />
        <MetricCard label="Refunds" value={formatINR(metrics.refunds)} hint="Returned to source" icon={<RotateCcw className="h-4 w-4" />} tone="danger" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'Paid', label: 'Paid' },
            { id: 'Partial', label: 'Partial' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Refunded', label: 'Refunded' },
          ]}
        />
        <Search value={query} onChange={setQuery} placeholder="Search ID, traveler, tour" className="max-w-sm" />
      </div>

      <Card padded={false} className="mt-4 overflow-hidden">
        <div className="overflow-x-auto app-scrollbar">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                {['Booking ID', 'Traveler', 'Tour', 'Amount', 'Payment Status', 'Date', 'Actions'].map((col) => (
                  <th key={col} className="px-3 py-2.5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const split = splitProgress(row)
                return (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-3 py-3 font-semibold tabular-nums">{row.id}</td>
                    <td className="px-3 py-3">
                      <p>{row.traveler}</p>
                      {split ? <p className="meta">{split.paid}/{split.total} members paid</p> : null}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{row.tour}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums">{formatINR(row.amount)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={payTone(row.paymentStatus)}>{row.paymentStatus}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{row.date}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => navigate(`/operator/bookings/${row.id}`)}>
                          Open
                        </Button>
                        <Button
type="button"                           size="sm"
                          variant="secondary"
                          disabled={row.paymentStatus === 'Refunded' || row.paymentStatus === 'Pending'}
                          onClick={() => setRefund(row)}
                        >
                          Request Refund
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {visible.length ? null : (
          <div className="p-6">
            <EmptyState icon={<Wallet className="h-5 w-5" />} title="No bookings in this filter" body="Clear status or search to widen the ledger." />
          </div>
        )}
      </Card>

      {refund ? (
        <RefundModal
          booking={refund}
          open
          onClose={() => setRefund(null)}
          onChange={() => setRows(loadLedger())}
        />
      ) : null}
    </div>
  )
}
