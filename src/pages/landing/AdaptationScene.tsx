import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudRain, Sparkles, UtensilsCrossed, Waves } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

type Phase = 'calm' | 'rain' | 'suggest' | 'updated'

const sequence: Phase[] = ['calm', 'rain', 'suggest', 'updated']

export function AdaptationScene() {
  const [phase, setPhase] = useState<Phase>('calm')
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setPhase((current) => {
        const next = sequence[(sequence.indexOf(current) + 1) % sequence.length]
        return next
      })
    }, 2200)
    return () => window.clearInterval(timer)
  }, [playing])

  const activityTone =
    phase === 'calm' ? 'success' : phase === 'updated' ? 'neutral' : phase === 'rain' || phase === 'suggest' ? 'danger' : 'success'
  const altTone = phase === 'suggest' ? 'warning' : phase === 'updated' ? 'success' : 'neutral'

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Live adaptation</p>
          <h3 className="mt-1 font-display text-lg font-semibold">Goa · 18 October</h3>
        </div>
        <Button
type="button"           size="sm"
          variant="secondary"
          onClick={() => {
            setPlaying(true)
            setPhase('calm')
          }}
        >
          Replay disruption
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="relative pl-2">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm font-semibold">Goa</p>
              <p className="meta">Candolim · live trip</p>
            </div>
          </div>
          <div className="ml-[5px] h-8 w-px bg-emerald-500" />
          <motion.div
            layout
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
              activityTone === 'success' && 'border-emerald-100 bg-emerald-50',
              activityTone === 'danger' && 'border-rose-100 bg-rose-50',
              activityTone === 'neutral' && 'border-line bg-slate-50',
            )}
          >
            <Waves className={cn('h-4 w-4', activityTone === 'danger' ? 'text-rose-600' : 'text-emerald-700')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Beach activity · Baga</p>
              <p className="meta">Parasail + jet ski · 09:30</p>
            </div>
            <Badge tone={activityTone === 'danger' ? 'danger' : activityTone === 'neutral' ? 'neutral' : 'success'}>
              {activityTone === 'danger' ? 'Disrupted' : activityTone === 'neutral' ? 'Replaced' : 'Confirmed'}
            </Badge>
          </motion.div>

          <div className={cn('ml-[5px] h-8 w-px', phase === 'updated' ? 'bg-emerald-500' : 'bg-amber-400')} />

          <motion.div
            layout
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
              altTone === 'warning' && 'border-amber-100 bg-amber-50',
              altTone === 'success' && 'border-emerald-100 bg-emerald-50',
              altTone === 'neutral' && 'border-dashed border-line bg-white',
            )}
          >
            <UtensilsCrossed className={cn('h-4 w-4', altTone === 'success' ? 'text-emerald-700' : 'text-amber-700')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Indoor food experience</p>
              <p className="meta">Fontainhas lunch + spice tasting</p>
            </div>
            <Badge tone={altTone === 'success' ? 'success' : altTone === 'warning' ? 'ai' : 'neutral'}>
              {altTone === 'success' ? 'Selected' : altTone === 'warning' ? 'AI suggested' : 'Standby'}
            </Badge>
          </motion.div>
        </div>

        <div className="min-h-[168px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                'h-full rounded-xl border p-4',
                phase === 'rain' && 'border-rose-100 bg-rose-50',
                phase === 'suggest' && 'border-brand-100 bg-brand-50',
                phase === 'updated' && 'border-emerald-100 bg-emerald-50',
                phase === 'calm' && 'border-line bg-slate-50',
              )}
            >
              {phase === 'calm' ? (
                <>
                  <p className="text-[12px] font-semibold text-slate-500">Conditions stable</p>
                  <p className="mt-2 text-sm text-slate-600">Baga water sports is on the active green route.</p>
                </>
              ) : null}
              {phase === 'rain' ? (
                <>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-700">
                    <CloudRain className="h-3.5 w-3.5" />
                    Heavy rain detected
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Activity node turns red. Outdoor slot is no longer feasible.</p>
                </>
              ) : null}
              {phase === 'suggest' ? (
                <>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI suggested alternative
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Indoor food experience stays inside budget and keeps the afternoon free.</p>
                </>
              ) : null}
              {phase === 'updated' ? (
                <>
                  <p className="text-[12px] font-semibold text-emerald-700">Trip updated automatically</p>
                  <p className="mt-2 text-sm text-slate-600">New green route locked. Vendor hold and budget both recalculated.</p>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}
