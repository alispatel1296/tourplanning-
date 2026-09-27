import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Sparkles, X } from 'lucide-react'
import { AILabel } from '@/components/domain/AICards'
import { Button, IconButton } from '@/components/ui/Button'
import { formatINR } from '@/lib/cn'
import { parseBrief } from '@/lib/plan'
import { listenOnce, speak } from '@/lib/speech'
import type { TripPlan } from '@/types/plan'
import { addDays, formatISO, parseISO } from 'date-fns'

export const VOICE_SAMPLE =
  'I want to go to Mumbai from Ahmedabad for 5 days and budget is 10k'

export function VoicePanel({
  open,
  onClose,
  onApply,
  onGenerate,
}: {
  open: boolean
  onClose: () => void
  onApply: (patch: Partial<TripPlan>) => void
  onGenerate?: (patch: Partial<TripPlan>) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'listen' | 'reply' | 'building'>('idle')
  const [heard, setHeard] = useState('')
  const [reply, setReply] = useState('')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!open) {
      setPhase('idle')
      setHeard('')
      setReply('')
      setDraft('')
    }
  }, [open])

  const commit = (text: string, generate: boolean) => {
    const next = briefFromVoice(text)
    const line = spokenReply(next)
    setReply(line)
    setPhase(generate && next.destinations?.length ? 'building' : 'reply')
    speak(line)
    onApply(next)
    if (generate && next.destinations?.length) onGenerate?.(next)
    return next
  }

  const run = async (spoken?: string) => {
    setPhase('listen')
    const text = spoken?.trim() || (await listenOnce(''))
    if (!text) {
      setHeard('')
      setReply(`I could not hear that. Type it, or tap the sample: “${VOICE_SAMPLE}”`)
      setPhase('reply')
      return
    }
    setHeard(text)
    commit(text, true)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed right-4 bottom-24 z-40 w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-brand-100 bg-white p-4 shadow-2xl lg:bottom-6"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <AILabel />
              <p className="mt-2 text-sm font-semibold">Voice planner</p>
              <p className="meta">Speak a city, days, and budget — I will build the itinerary.</p>
            </div>
            <IconButton label="Close voice" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="space-y-3">
            {phase === 'listen' ? (
              <div className="ai-generating flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-3 text-sm text-brand-800">
                <Mic className="h-4 w-4" />
                Listening…
              </div>
            ) : null}
            {phase === 'building' ? (
              <div className="ai-generating flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-3 text-sm text-brand-800">
                <Sparkles className="h-4 w-4" />
                Building your day-by-day itinerary…
              </div>
            ) : null}
            {heard ? <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">You: {heard}</div> : null}
            {reply ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-sm text-brand-950">
                <Sparkles className="mb-1 h-3.5 w-3.5 text-brand-700" />
                {reply}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-3 py-2 text-left text-xs text-brand-900"
            onClick={() => {
              setDraft(VOICE_SAMPLE)
              void run(VOICE_SAMPLE)
            }}
          >
            Try this: “{VOICE_SAMPLE}”
          </button>

          <label className="mt-3 block">
            <span className="meta">Or type it</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={VOICE_SAMPLE}
              className="mt-1 h-11 w-full rounded-lg border border-line px-3 text-sm"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              icon={<Mic className="h-4 w-4" />}
              loading={phase === 'listen'}
              onClick={() => void run()}
            >
              Speak
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={phase === 'listen' || phase === 'building'}
              onClick={() => void run(draft || VOICE_SAMPLE)}
            >
              Send text
            </Button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

export function briefFromVoice(text: string): Partial<TripPlan> {
  const parsed = parseBrief(text)
  const lower = text.toLowerCase()
  const origin = parsed.origin || 'Ahmedabad'
  const destinations = (parsed.destinations.length
    ? parsed.destinations
    : lower.includes('bombay') || lower.includes('mumbai')
      ? ['Mumbai']
      : []
  ).filter((city) => city.toLowerCase() !== origin.toLowerCase())
  const start = parseISO('2026-10-15')
  const days = parsed.days ?? 5
  const budget = parsed.budget
  const styles = parsed.styles.length
    ? parsed.styles
    : budget != null && budget <= 18000
      ? ['Budget', 'Food', 'Culture']
      : ['Food', 'Culture']
  const stay =
    budget != null && budget <= 18000 ? 'Budget' : budget != null && budget >= 80000 ? 'Luxury' : undefined
  return {
    brief: text,
    origin,
    destinations,
    styles,
    startDate: formatISO(start, { representation: 'date' }),
    endDate: formatISO(addDays(start, days - 1), { representation: 'date' }),
    ...(budget != null ? { budget } : {}),
    ...(stay ? { accommodation: stay } : {}),
  }
}

function spokenReply(next: Partial<TripPlan>) {
  const dest = (next.destinations ?? []).join(' and ')
  const origin = next.origin || 'Ahmedabad'
  if (!dest) {
    return `I need a destination. Try: ${VOICE_SAMPLE}`
  }
  const days = next.startDate && next.endDate
    ? Math.round((parseISO(next.endDate).getTime() - parseISO(next.startDate).getTime()) / 86400000) + 1
    : undefined
  const budget = next.budget ? `, budget ${formatINR(next.budget)}` : ''
  return `Got it. ${origin} to ${dest}${days ? `, ${days} days` : ''}${budget}. Building your day-by-day itinerary now.`
}


