import { useEffect, useState } from 'react'
import { formatINR, cn } from '@/lib/cn'
import { calculateBudgetHealth } from '@/services/budget/budget'
import { convertCurrency, type FxQuote } from '@/services/currency/currency'

export function BudgetHealth({
  budget,
  planned,
  prediction: _prediction,
}: {
  budget: number
  planned: number
  prediction: string
}) {
  const health = calculateBudgetHealth(budget, planned)
  const remaining = health.remaining
  const used = health.usedPct
  const tone = health.tone
  const [_fx, setFx] = useState<FxQuote | null>(null)

  useEffect(() => {
    void convertCurrency(budget, 'INR', 'USD').then(setFx)
  }, [budget])

  const underBudget = remaining >= 0

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-700/80 bg-[#16212F] px-4 py-2 text-[#F3EFE7] shadow-md">
      {/* Total & Prediction */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 font-display text-base font-extrabold text-[#F3EFE7]">
          <span className="text-[#3FA772]">{formatINR(planned)}</span>
          <span className="text-xs text-slate-400 font-normal">/ {formatINR(budget)}</span>
        </div>
        <p className="text-[11px] font-medium text-slate-300">
          {underBudget
            ? `Tracking ${formatINR(remaining)} under budget`
            : `Over budget by ${formatINR(Math.abs(remaining))}`}
        </p>
      </div>

      {/* Slim Multi-zone Horizontal Meter */}
      <div className="flex flex-col gap-1 w-32">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Health</span>
          <span
            className={cn(
              tone === 'success' && 'text-[#3FA772]',
              tone === 'warning' && 'text-[#E0A63A]',
              tone === 'danger' && 'text-[#C96A4B]',
            )}
          >
            {health.label}
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              tone === 'success' && 'bg-gradient-to-r from-[#3FA772] to-emerald-400',
              tone === 'warning' && 'bg-gradient-to-r from-[#E0A63A] to-amber-400',
              tone === 'danger' && 'bg-gradient-to-r from-[#C96A4B] to-rose-500',
            )}
            style={{ width: `${Math.min(100, used)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
