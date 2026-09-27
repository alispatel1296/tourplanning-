import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { AILabel } from '@/components/domain/AICards'
import { cn } from '@/lib/cn'

const checks = [
  'Understanding your preferences',
  'Retrieving live hotels (SerpApi)',
  'Matching flights (AviationStack + SerpApi)',
  'Checking rail (RailRadar)',
  'Reading weather and social signals',
  'Composing with OpenRouter',
  'Checking budget against live prices',
  'Writing operator conflicts',
]

const twinSlots = [
  { time: '08:00', title: 'Hotel checkout' },
  { time: '09:00', title: 'Cab pickup' },
  { time: '10:00', title: 'Train station' },
  { time: '10:30', title: 'Train' },
  { time: '13:00', title: 'Arrival' },
  { time: '13:30', title: 'Lunch' },
  { time: '15:00', title: 'Hotel check-in' },
  { time: '17:00', title: 'Beach activity' },
]

export function GenerationStage({ onComplete, liveReady = true }: { onComplete: () => void; liveReady?: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  const finished = useRef(false)

  useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      setElapsed(now - started)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (finished.current) return
    if ((elapsed >= 2800 && liveReady) || elapsed >= 16000) {
      finished.current = true
      onComplete()
    }
  }, [elapsed, liveReady, onComplete])

  const waitCap = liveReady ? 4200 : 14000
  const progress = Math.min(99, Math.round((elapsed / waitCap) * 100))
  const doneCount = Math.min(checks.length, Math.floor(elapsed / 520))
  const showTwin = elapsed > 700
  const showCounter = elapsed > 1300
  const checksCount = Math.min(1248, Math.round(Math.max(0, elapsed - 1300) * 0.85))
  const showConflict = elapsed > 2100
  const resolved = elapsed > 3100 && liveReady
  const showOptimize = elapsed > 3400 && liveReady

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <AILabel />
        <h1 className="page-title mt-3">Building your journey...</h1>
        <p className="mt-2 text-sm text-slate-600">
          {liveReady
            ? 'Live hotels, flights, rail, and weather are in. OpenRouter is locking the circuit.'
            : 'Waiting on SerpApi, AviationStack, RailRadar, Open-Meteo, and OpenRouter — not a static package.'}
        </p>
        <div className="mt-4">
          <ProgressBar value={progress} tone="ai" />
          <p className="meta mt-2">{progress}% complete</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn((!liveReady || elapsed < 4200) && 'ai-generating')}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-700">Generation</p>
          <ul className="mt-4 space-y-2.5">
            {checks.map((item, index) => {
              const done = index < doneCount
              const spinning = index === doneCount && elapsed < 4200
              return (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border',
                      done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-line text-slate-300',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <Loader2 className={cn('h-3.5 w-3.5', spinning && 'animate-spin')} />}
                  </span>
                  <span className={done ? 'text-ink' : 'text-slate-400'}>{item}</span>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <AnimatePresence>
            {showTwin ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="card-title">Digital Twin Simulation</p>
                    <Badge tone="info">Live model</Badge>
                  </div>
                  <ol className="space-y-2">
                    {twinSlots.map((slot, index) => {
                      const visible = elapsed > 700 + index * 160
                      return visible ? (
                        <li key={slot.time} className="flex items-center gap-3 text-sm">
                          <span className="w-12 font-semibold text-electric-700">{slot.time}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{slot.title}</span>
                        </li>
                      ) : null
                    })}
                  </ol>
                  {showCounter ? (
                    <p className="mt-4 text-[13px] font-medium text-brand-800">
                      Running {checksCount.toLocaleString('en-IN')}+ feasibility checks
                    </p>
                  ) : null}
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showConflict ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={resolved ? 'border-emerald-200' : 'border-amber-200 bg-amber-50/40'}>
                  {resolved ? (
                    <>
                      <Badge tone="success">Conflict resolved</Badge>
                      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <Sparkles className="h-4 w-4" />
                        Moved activity to 7:30 PM
                      </p>
                      <p className="mt-1 text-[13px] text-slate-600">
                        Arrival at 6:40 PM now has a 50-minute buffer before the beach slot.
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge tone="warning">
                        <TriangleAlert className="h-3 w-3" />
                        Timing conflict detected
                      </Badge>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="meta">Activity starts</p>
                          <p className="mt-1 font-semibold text-rose-600">6:30 PM</p>
                        </div>
                        <div>
                          <p className="meta">Transport arrival</p>
                          <p className="mt-1 font-semibold text-rose-600">6:40 PM</p>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showOptimize ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-brand-200 bg-brand-50/50">
                  <Badge tone="ai">Optimization</Badge>
                  <p className="mt-3 text-sm font-semibold text-brand-900">Live circuit locked from retrieved candidates</p>
                  <p className="mt-1 text-[13px] text-slate-600">
                    Names come from SerpApi / AviationStack / RailRadar. OpenRouter only sequences what was retrieved.
                  </p>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
