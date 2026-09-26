import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Sparkles, X } from 'lucide-react'
import { AILabel } from '@/components/domain/AICards'
import { Button, IconButton } from '@/components/ui/Button'
import { parseBrief } from '@/lib/plan'
import { listenOnce, speak } from '@/lib/speech'
import type { TripPlan } from '@/types/plan'
import { addDays, formatISO, parseISO } from 'date-fns'

export function VoicePanel({
  open,
  onClose,
  onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (patch: Partial<TripPlan>) => void
}) {
  const [phase, setPhase] = useState<'idle' | 'listen' | 'reply'>('idle')
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

  const run = async (spoken?: string) => {
    setPhase('listen')
    const text = spoken?.trim() || (await listenOnce('I am in Ahmedabad right now I want to go to Bombay'))
    setHeard(text)
    const next = briefFromVoice(text)
    const line = spokenReply(text, next)
    setReply(line)
    setPhase('reply')
    speak(line)
    return next
  }

  const applyHeard = () => {
    onApply(briefFromVoice(heard || draft))
    onClose()
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
              <p className="meta">Try: “I am in Ahmedabad. I want to go to Bombay.”</p>
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
            {heard ? <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">You: {heard}</div> : null}
            {reply ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-sm text-brand-950">
                <Sparkles className="mb-1 h-3.5 w-3.5 text-brand-700" />
                {reply}
              </div>
            ) : null}
          </div>

          <label className="mt-3 block">
            <span className="meta">Or type it</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="I am at Ahmedabad right now I want to go to Bombay"
              className="mt-1 h-11 w-full rounded-lg border border-line px-3 text-sm"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button"
              icon={<Mic className="h-4 w-4" />}
              loading={phase === 'listen'}
              onClick={() => void run()}
            >
              Speak
            </Button>
            <Button
type="button"               variant="secondary"
              onClick={() => void run(draft || 'I am in Ahmedabad right now I want to go to Bombay')}
            >
              Send text
            </Button>
            {phase === 'reply' ? (
              <Button type="button" variant="outline" onClick={applyHeard}>
                Use this brief
              </Button>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

export function briefFromVoice(text: string): Partial<TripPlan> {
  const parsed = parseBrief(text)
  const lower = text.toLowerCase()
  let origin = 'Ahmedabad'
  const originMatch = text.match(/(?:I'm in|I am in|from)\s+([A-Z][a-z]+)/i)
  if (originMatch) {
    origin = originMatch[1].charAt(0).toUpperCase() + originMatch[1].slice(1)
  }
  const destinations = parsed.destinations.length ? parsed.destinations : lower.includes('bombay') || lower.includes('mumbai') ? ['Mumbai'] : []
  const start = parseISO('2026-10-15')
  const days = parsed.days ?? 7
  const filteredDestinations = destinations.filter(d => d.toLowerCase() !== origin.toLowerCase())
  return {
    brief: text,
    origin: origin,
    destinations: filteredDestinations.length ? filteredDestinations : ['Mumbai', 'Goa'],
    styles: parsed.styles.length ? parsed.styles : ['Food', 'Beach', 'Adventure'],
    startDate: formatISO(start, { representation: 'date' }),
    endDate: formatISO(addDays(start, days - 1), { representation: 'date' }),
  }
}

function spokenReply(_text: string, next: Partial<TripPlan>) {
  const dest = (next.destinations ?? []).join(' and ')
  const origin = next.origin || 'Ahmedabad'
  return `I heard that. Route: ${origin} → ${dest}. I'll keep the days, budget, and hotel questions next.`
}


