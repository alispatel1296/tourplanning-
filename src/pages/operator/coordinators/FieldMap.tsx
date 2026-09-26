import { Card } from '@/components/ui/Card'
import { destFor, haversineKm, type DeskCoordinator, type GeoPoint } from '@/pages/operator/coordinators/catalog'
import type { ManagedTour } from '@/pages/operator/tours/catalog'

const statusFill: Record<string, string> = {
  Available: '#10b981',
  Assigned: '#2563eb',
  Offline: '#64748b',
}

export function FieldMap({
  people,
  tour,
  selectedId,
  onSelect,
}: {
  people: DeskCoordinator[]
  tour?: ManagedTour | null
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const dest: GeoPoint | null = tour ? destFor(tour) : null

  return (
    <Card padded={false} className="overflow-hidden bg-[#0f172a]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Field map</p>
          <p className="text-[12px] text-slate-400">
            {tour ? `${tour.destination} destination · distance lines from the desk` : 'Coordinator locations across the India ops layer'}
          </p>
        </div>
        <span className="text-[12px] font-medium text-emerald-400">{people.length} on map</span>
      </div>
      <div className="relative h-[340px]">
        <svg viewBox="0 0 520 320" className="h-full w-full">
          <rect width="520" height="320" fill="#0f172a" />
          <path
            d="M300 28 C 340 36 368 70 372 108 C 376 150 360 168 368 198 C 376 230 350 252 338 278 C 322 300 292 306 270 292 C 248 278 236 250 220 230 C 200 206 168 198 158 168 C 148 138 170 112 188 88 C 210 58 250 22 300 28 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {dest
            ? people.map((person) => {
                const active = person.id === selectedId
                return (
                  <g key={`line-${person.id}`}>
                    <line
                      x1={person.point.x}
                      y1={person.point.y}
                      x2={dest.x}
                      y2={dest.y}
                      stroke={active ? '#8b6ef0' : '#475569'}
                      strokeWidth={active ? 2 : 1}
                      strokeDasharray={active ? '0' : '5 4'}
                      opacity={active ? 0.95 : 0.55}
                    />
                    <text
                      x={(person.point.x + dest.x) / 2}
                      y={(person.point.y + dest.y) / 2 - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill={active ? '#c4b5fd' : '#94a3b8'}
                    >
                      {haversineKm(person.point, dest)} km
                    </text>
                  </g>
                )
              })
            : null}
          {people.map((person) => {
            const active = person.id === selectedId
            return (
              <g
                key={person.id}
                className={onSelect ? 'cursor-pointer' : undefined}
                onClick={() => onSelect?.(person.id)}
              >
                <circle
                  cx={person.point.x}
                  cy={person.point.y}
                  r={active ? 8 : 6}
                  fill={statusFill[person.status]}
                  stroke="#fff"
                  strokeWidth={active ? 2 : 1}
                />
                <text x={person.point.x + 10} y={person.point.y + 4} fontSize="10" fill="#e2e8f0">
                  {person.firstName}
                </text>
              </g>
            )
          })}
          {dest ? (
            <g>
              <circle cx={dest.x} cy={dest.y} r="11" fill="#6d4ee6" stroke="#c4b5fd" strokeWidth="2" />
              <circle cx={dest.x} cy={dest.y} r="18" fill="none" stroke="#8b6ef0" opacity="0.45">
                <animate attributeName="r" values="14;22;14" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <text x={dest.x} y={dest.y + 28} textAnchor="middle" fontSize="11" fill="#c4b5fd" fontWeight="600">
                Tour · {dest.label}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-white/10 px-4 py-3 text-[11px] text-slate-300">
        <Legend color="#10b981" label="Available" />
        <Legend color="#2563eb" label="Assigned" />
        <Legend color="#64748b" label="Offline" />
        {dest ? <Legend color="#6d4ee6" label="Tour destination" /> : null}
      </div>
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
