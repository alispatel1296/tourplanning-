import { useEffect, useRef, useState } from 'react'
import { Mic, Sparkles, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { alternativesFor, type NodeAlternative } from '@/pages/traveler/flow/alternatives'
import { listenOnce, speak } from '@/lib/speech'
import { tipFor, wantsReviews } from '@/pages/traveler/voice/reviews'
import type { PathMode } from '@/pages/traveler/flow/model'
import type { TripNode } from '@/types'

const prompts = ['What’s best here?', 'Show reviews', 'What happens next?', 'Can I reduce budget?']
const voiceActions = ['Find cheaper', 'Find closer', 'Better rated', 'Keep current']

export function AskTripFlow({
  node,
  path: _path,
  onKeep,
  onCompare,
}: {
  node: TripNode | null
  path: PathMode
  onKeep: () => void
  onCompare: (alt: NodeAlternative) => void
}) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: 'Voice assistant active. Select any node or ask e.g. "what’s best here?" to inspect guest reviews and local tips.',
    },
  ])
  const [reviewsOpen, setReviewsOpen] = useState(false)

  const lastNodeId = useRef<string | null>(null)
  useEffect(() => {
    if (!open || !node) return
    if (lastNodeId.current === null) {
      lastNodeId.current = node.id
      return
    }
    if (lastNodeId.current === node.id) return
    lastNodeId.current = node.id
    const line = contextSwitch(node)
    setMessages((current) => [...current, { role: 'ai', text: line }])
    speak(line)
    setReviewsOpen(false)
  }, [node, open])

  const ask = (text: string) => {
    const alts = node ? alternativesFor(node) : []
    const tip = tipFor(node)
    const showReviews = wantsReviews(text)
    const answer = showReviews ? tip.suggestion : reply(text, node, _path, alts)
    setReviewsOpen(showReviews)
    setMessages((current) => [...current, { role: 'user', text }, { role: 'ai', text: answer }])
    speak(answer)

    const lower = text.toLowerCase()
    if (lower.includes('keep current')) {
      onKeep()
      return
    }
    if (node && alts.length && !showReviews) {
      if (lower.includes('cheaper')) onCompare(pickAlt(alts, 'cheap'))
      if (lower.includes('closer')) onCompare(pickAlt(alts, 'close'))
      if ((lower.includes('rated') || lower.includes('better hotel')) && !lower.includes('best')) {
        onCompare(pickAlt(alts, 'rated'))
      }
    }
  }

  const listen = async () => {
    setOpen(true)
    setListening(true)
    const fallback = node?.category === 'stay' ? "what's the best thing here" : 'What happens next?'
    const heard = await listenOnce(fallback)
    setListening(false)
    ask(heard)
  }

  const tip = tipFor(node)

  return (
    <>
      {/* Floating Terracotta Voice Assistant Orb (#C96A4B) */}
      <div className="fixed right-6 bottom-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void listen()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C96A4B] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 border-2 border-white/20"
          aria-label="Voice assistant"
          title="Voice concierge"
        >
          <Mic className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full bg-[#16212F] border border-[#C96A4B]/50 px-4 py-3 text-xs font-bold text-[#F3EFE7] shadow-xl hover:border-[#C96A4B]"
        >
          <Sparkles className="h-4 w-4 text-[#C96A4B]" />
          <span>Ask TripFlow</span>
        </button>
      </div>

      {/* Conversational Drawer Panel */}
      {open ? (
        <div className="fixed right-6 bottom-24 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-[#16212F] p-4 text-[#F3EFE7] shadow-2xl">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C96A4B] text-white font-bold text-xs">
                AI
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#F3EFE7]">TripFlow Concierge</p>
                <p className="text-[10px] text-slate-400">
                  {node ? `Referencing: ${node.title}` : 'Full trip context'}
                </p>
              </div>
            </div>
            <IconButton
              label="Close assistant"
              onClick={() => setOpen(false)}
              tone="dark"
              className="h-7 w-7 border-slate-700 bg-slate-800 text-slate-300"
            >
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto app-scrollbar pr-1">
            {listening ? (
              <div className="rounded-xl bg-[#C96A4B]/20 border border-[#C96A4B]/40 p-3 text-xs text-[#F3EFE7] flex items-center gap-2">
                <Mic className="h-4 w-4 text-[#C96A4B] animate-pulse" />
                <span>Listening for prompt…</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === 'ai'
                      ? 'rounded-xl bg-[#101823] border border-slate-800 p-3 text-xs text-[#F3EFE7] leading-relaxed'
                      : 'rounded-xl bg-[#C96A4B] text-white p-2.5 text-xs font-medium ml-6'
                  }
                >
                  {message.text}
                </div>
              ))
            )}
          </div>

          {reviewsOpen && (
            <div className="mt-3 max-h-36 space-y-2 overflow-y-auto rounded-xl border border-[#E0A63A]/40 bg-[#101823] p-2.5 app-scrollbar">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E0A63A]">
                Guest Reviews
              </p>
              {tip.reviews.map((row) => (
                <div key={row.by} className="rounded-lg bg-[#16212F] p-2 text-xs border border-slate-800">
                  <p className="font-bold text-[#F3EFE7]">
                    {row.by} · <span className="text-[#E0C24C]">{row.rating.toFixed(1)}★</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{row.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && input.trim()) {
                  ask(input.trim())
                  setInput('')
                }
              }}
              placeholder="Ask anything about this stop..."
              className="h-9 flex-1 rounded-xl border border-slate-700 bg-[#101823] px-3 text-xs text-[#F3EFE7] outline-none focus:border-[#C96A4B]"
            />
            <Button
type="button"               size="sm"
              onClick={() => void listen()}
              className="bg-[#C96A4B] hover:bg-[#b55b3d] text-white"
              icon={<Mic className="h-3.5 w-3.5" />}
            >
              Speak
            </Button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {voiceActions.map((action) => (
              <button key={action}
                type="button"
                onClick={() => ask(action)}
                className="rounded-lg bg-[#101823] border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-[#C96A4B] hover:text-[#F3EFE7]"
              >
                {action}
              </button>
            ))}
          </div>

          <div className="mt-1 flex flex-wrap gap-1">
            {prompts.map((prompt) => (
              <button key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                className="rounded-lg bg-[#101823] border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-[#C96A4B] hover:text-[#F3EFE7]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

function kindLabel(node: TripNode) {
  if (node.category === 'stay') return 'hotel'
  if (node.category === 'transport') return 'transport'
  if (node.category === 'activity') return 'activity'
  if (node.category === 'food') return 'eatery'
  return 'open block'
}

function contextSwitch(node: TripNode) {
  if (node.category === 'stay') {
    return `Context updated: ${node.title}. Ask "what's best here" to inspect guest reviews and samosa / thali tips.`
  }
  return `Context updated: ${kindLabel(node)} — ${node.title}.`
}

function pickAlt(alts: NodeAlternative[], mode: 'cheap' | 'close' | 'rated') {
  if (mode === 'cheap') return [...alts].sort((a, b) => a.price - b.price)[0]
  if (mode === 'rated') return [...alts].sort((a, b) => b.rating - a.rating)[0]
  return [...alts].sort((a, b) => impactMinutes(a.timeImpact) - impactMinutes(b.timeImpact))[0]
}

function impactMinutes(value: string) {
  const match = value.match(/(-?\d+)/)
  return match ? Number(match[1]) : 0
}

function reply(text: string, node: TripNode | null, _path: PathMode, alts: NodeAlternative[]) {
  const lower = text.toLowerCase()
  const kind = node ? kindLabel(node) : 'journey'

  if (lower.includes("what's good here") || lower.includes('what is good here') || lower.includes('best here') || lower.includes('reviews')) {
    if (node) {
      if (node.category === 'stay') {
        return `Based on recent reviews for ${node.title}, guests love the local food and the view from the rooms.`
      }
      return `For ${node.title}, travelers enjoy the atmosphere and service.`
    }
    return 'Please select a hotel or node first so I can check the reviews.'
  }
  if (lower.includes('weather') && lower.includes('day 3')) {
    return node
      ? `On Day 3 at ${node.title}, it will be cold, around 12°C. Keep your jacket handy.`
      : 'On Day 3, expect cold temperatures around 12°C. Keep your jacket handy.'
  }
  if (lower.includes('keep current')) return `Keeping current ${kind} on the green path.`
  if (lower.includes('cheaper')) {
    const alt = alts.length ? pickAlt(alts, 'cheap') : null
    return alt
      ? `Cheaper option for ${kind} is ${alt.name} at ₹${alt.price.toLocaleString('en-IN')}.`
      : 'Select a node first.'
  }
  if (lower.includes('closer')) {
    const alt = alts.length ? pickAlt(alts, 'close') : null
    return alt ? `Closest option is ${alt.name} — ${alt.distance}.` : 'Select a node first.'
  }
  if (lower.includes('rated') || lower.includes('better hotel')) {
    const alt = alts.length ? pickAlt(alts, 'rated') : null
    return alt ? `Highest rated option is ${alt.name} at ${alt.rating.toFixed(1)}★.` : 'Select a node first.'
  }
  if (lower.includes('budget') || lower.includes('reduce')) {
    return 'Swapping yellow branch nodes saves up to ₹2,400 on this circuit.'
  }
  if (lower.includes('next')) {
    return node ? `After ${node.title}, the green path continues in ${node.city}.` : 'Next is the next scheduled stop.'
  }
  return `Connected to ${kind} node. Ask for recommendations, reviews, or cheaper options.`
}

