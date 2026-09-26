import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { opsClusters } from '@/pages/operator/command/data'

export function IndiaOpsMap({
  active,
  onSelect,
}: {
  active: string | null
  onSelect: (city: string) => void
}) {
  return (
    <Card padded={false} className="overflow-hidden bg-[#0f172a]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Live tour clusters</p>
          <p className="text-[12px] text-slate-400">India ops layer · 24 active tours</p>
        </div>
        <span className="text-[12px] font-medium text-emerald-400">Live</span>
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
          <path d="M168 198 C 140 210 128 230 138 248" fill="none" stroke="#334155" strokeWidth="1.2" />
          {opsClusters.map((cluster) => {
            const selected = active === cluster.id
            return (
              <g
                key={cluster.id}
                className="cursor-pointer"
                onClick={() => onSelect(cluster.id)}
              >
                <motion.circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={selected ? 16 : 13}
                  fill={selected ? '#6d4ee6' : '#2563eb'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r="20"
                  fill="none"
                  stroke={selected ? '#8b6ef0' : '#3b82f6'}
                  strokeWidth="1"
                  opacity="0.5"
                >
                  <animate attributeName="r" values="16;24;16" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.55;0.1;0.55" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <text x={cluster.x} y={cluster.y + 4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">
                  {cluster.count}
                </text>
                <text x={cluster.x + 22} y={cluster.y + 4} fontSize="11" fill="#e2e8f0">
                  {cluster.id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
        {opsClusters.map((cluster) => (
          <button key={cluster.id}
            type="button"
            onClick={() => onSelect(cluster.id)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium',
              active === cluster.id ? 'bg-brand-600 text-white' : 'bg-white/10 text-slate-200',
            )}
          >
            {cluster.id} · {cluster.count}
          </button>
        ))}
      </div>
    </Card>
  )
}
