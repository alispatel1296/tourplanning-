import { useMemo, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, MetricCard } from '@/components/ui/Card'
import { AIInsightCard, AILabel } from '@/components/domain/AICards'
import { useAppState } from '@/state/AppState'
import { formatINR } from '@/lib/cn'
import {
  analyticsCsv,
  analyticsReport,
  buildAnalytics,
  defaultFilters,
  downloadText,
  filterOptions,
  type AnalyticsFilters,
  type DateRange,
  type DestFilter,
  type StatusFilter,
  type TravelerFilter,
  type VendorFilter,
} from '@/pages/operator/analytics/model'

const tooltipStyle = { fontSize: 12, borderRadius: 10, border: '1px solid #e6e8ee' }

function tip(label: string, format: (n: number) => string) {
  return (value: unknown) => [format(Number(value ?? 0)), label] as [string, string]
}

export function OperatorAnalytics() {
  const { pushToast } = useAppState()
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters)
  const snap = useMemo(() => buildAnalytics(filters), [filters])

  const set = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Decision view for the west-coast season. Compact and filterable."
        crumbs={[{ label: 'Command', to: '/operator' }, { label: 'Analytics' }]}
        actions={
          <>
            <Button type="button"
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                downloadText('tripflow-analytics.csv', analyticsCsv(snap, filters), 'text/csv;charset=utf-8')
                pushToast({ title: 'CSV exported', body: 'Filtered KPI and series downloaded.' })
              }}
            >
              Export CSV
            </Button>
            <Button type="button"
              variant="secondary"
              icon={<FileText className="h-4 w-4" />}
              onClick={() => {
                downloadText('tripflow-analytics-brief.txt', analyticsReport(snap, filters), 'text/plain;charset=utf-8')
                pushToast({ title: 'Report exported', body: 'Analytics brief downloaded.' })
              }}
            >
              Export Report
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="ai">Desk analytics</Badge>
        <p className="text-[13px] text-slate-500">Simulated from the Horizon Trails desk. Filters reshape the view; nothing is live-metered.</p>
      </div>

      <div className="mb-5 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <Filter label="Date range" value={filters.range} onChange={(value) => set('range', value as DateRange)} options={filterOptions.range.map((row) => ({ id: row.id, label: row.label }))} />
        <Filter label="Destination" value={filters.destination} onChange={(value) => set('destination', value as DestFilter)} options={named(filterOptions.destination)} />
        <Filter label="Traveler type" value={filters.traveler} onChange={(value) => set('traveler', value as TravelerFilter)} options={named(filterOptions.traveler)} />
        <Filter label="Vendor" value={filters.vendor} onChange={(value) => set('vendor', value as VendorFilter)} options={named(filterOptions.vendor)} />
        <Filter label="Tour status" value={filters.status} onChange={(value) => set('status', value as StatusFilter)} options={named(filterOptions.status)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Revenue" value={formatINR(snap.kpis.revenue)} hint={snap.kpis.revenueHint} />
        <MetricCard label="Booking conversion" value={`${snap.kpis.conversion}%`} hint={snap.kpis.conversionHint} tone="info" />
        <MetricCard label="Average trip value" value={formatINR(snap.kpis.avgTrip)} hint="Collected per file" />
        <MetricCard label="Average traveler budget" value={formatINR(snap.kpis.avgBudget)} hint="Stated envelope" />
        <MetricCard label="Vendor utilization" value={`${snap.kpis.utilization}%`} hint="Assigned inventory in use" tone="success" />
        <MetricCard label="Tour completion" value={`${snap.kpis.completion}%`} hint="Closed without abort" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Revenue over time" hint="₹ lakhs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snap.revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e6e8ee" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={tip('Revenue', (n) => `₹${n}L`)} />
              <Area type="monotone" dataKey="revenue" stroke="#4529a8" fill="#d8d0ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Popular destinations" hint="Trip count">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snap.destinations} layout="vertical" margin={{ top: 8, right: 8, left: 12, bottom: 0 }}>
              <CartesianGrid stroke="#e6e8ee" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="trips" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average budget by destination" hint="INR">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snap.destinations} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e6e8ee" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={tip('Budget', formatINR)} />
              <Bar dataKey="budget" fill="#5534c9" radius={[6, 6, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendor performance" hint="On-time %">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snap.vendors} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e6e8ee" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={tip('On-time', (n) => `${n}%`)} />
              <Bar dataKey="score" fill="#059669" radius={[6, 6, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <ChartCard title="Trip disruption frequency" hint="Open incidents by week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snap.disruptions} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e6e8ee" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={24} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="weather" stackId="d" fill="#d97706" name="Weather" />
              <Bar dataKey="stay" stackId="d" fill="#4529a8" name="Stay" />
              <Bar dataKey="transit" stackId="d" fill="#2563eb" name="Transit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AILabel />
            <span className="text-[12px] font-medium text-slate-500">Desk analytics · seasonal model</span>
          </div>
          {snap.insights.map((item) => (
            <AIInsightCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-2">
        <p className="card-title">{title}</p>
        <p className="meta">{hint}</p>
      </div>
      <div className="h-48">{children}</div>
    </Card>
  )
}

function named(values: string[]) {
  return values.map((id) => ({ id, label: id === 'all' ? 'All' : id }))
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
