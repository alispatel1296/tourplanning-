import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  Sparkles,
  Save,
} from 'lucide-react'
import { defaultPlan, persistPlan, routeLabel, tripDuration } from '@/lib/plan'
import { clearBuilder } from '@/pages/traveler/plan/builder/model'
import { useAppState } from '@/state/AppState'
import { VoicePanel } from '@/pages/traveler/plan/VoicePanel'
import {
  BudgetStep,
  DatesStep,
  DestinationStep,
  PreferencesStep,
  ReviewStep,
  TravelersStep,
} from '@/pages/traveler/plan/steps'
import { cn } from '@/lib/cn'
import type { TripPlan } from '@/types/plan'
import { composeTrip } from '@/services/travel/TravelDataService'

const steps = [
  { id: 1, label: 'Destination', icon: '📍', description: 'Where to?' },
  { id: 2, label: 'Dates', icon: '📅', description: 'When?' },
  { id: 3, label: 'Travelers', icon: '👥', description: 'Who\'s coming?' },
  { id: 4, label: 'Preferences', icon: '✨', description: 'Your style' },
  { id: 5, label: 'Budget', icon: '💰', description: 'Set ceiling' },
  { id: 6, label: 'Review', icon: '🚀', description: 'Ready to go' },
]

export function PlanTrip() {
  const { plan, savePlan, generateItinerary, generating } = useAppState()
  const [draft, setDraft] = useState<TripPlan>(plan ?? defaultPlan)
  const [step, setStep] = useState(0)
  const [voice, setVoice] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    persistPlan(draft)
    savePlan(draft)
    setSaved(true)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => setSaved(false), 2000)
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [draft, savePlan])

  const patch = (next: Partial<TripPlan>) => setDraft((current) => ({ ...current, ...next }))

  const launchItinerary = (next: TripPlan) => {
    setDraft(next)
    savePlan(next)
    persistPlan(next)
    generateItinerary(next)
    sessionStorage.removeItem('tf-itin-ready')
    sessionStorage.removeItem('tf-trip-compose')
    const duration = tripDuration(next)
    void composeTrip({
      origin: next.origin,
      destination: next.destinations[next.destinations.length - 1],
      interests: next.styles,
      budget: next.budget,
      duration: duration.days,
      adults: next.adults,
      startDate: next.startDate,
      endDate: next.endDate,
      brief: next.brief,
    })
      .then((result) => sessionStorage.setItem('tf-trip-compose', JSON.stringify(result)))
      .catch(() => sessionStorage.removeItem('tf-trip-compose'))
    navigate('/traveler/itinerary', { state: { generate: true } })
  }

  const generate = () => launchItinerary(draft)

  const generateFromVoice = (patch: Partial<TripPlan>) => {
    setVoice(false)
    launchItinerary({ ...draft, ...patch })
  }

  const startBuild = () => {
    savePlan(draft)
    persistPlan(draft)
    clearBuilder()
    navigate('/traveler/plan/build')
  }

  const isLastStep = step === steps.length - 1

  return (
    <div className="plan-trip-root">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="plan-trip-header">
        <div className="plan-trip-header-text">
          <span className="plan-trip-eyebrow">AI Concierge</span>
          <h1 className="plan-trip-title">Plan Your Trip</h1>
          <p className="plan-trip-subtitle">
            {routeLabel(draft)
              ? `Ahmedabad → ${draft.destinations.join(' → ')}`
              : 'Tell me where you want to go. I\'ll build a complete circuit.'}
          </p>
        </div>

        {/* Auto-save indicator */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="plan-save-badge"
            >
              <Save className="h-3.5 w-3.5" />
              Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Step Stepper ─────────────────────────────────────── */}
      <div className="plan-stepper">
        {steps.map((s, index) => {
          const isCompleted = index < step
          const isCurrent = index === step
          const isLocked = index > step

          return (
            <button key={s.id}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && setStep(index)}
              className={cn(
                'plan-step-btn',
                isCurrent && 'plan-step-btn--active',
                isCompleted && 'plan-step-btn--done',
                isLocked && 'plan-step-btn--locked',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'plan-step-number',
                  isCurrent && 'plan-step-number--active',
                  isCompleted && 'plan-step-number--done',
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{s.id}</span>}
              </span>
              <span className="plan-step-label-group">
                <span className="plan-step-label">{s.label}</span>
                <span className="plan-step-desc">{s.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Overall progress bar ─────────────────────────────── */}
      <div className="plan-progress-track">
        <motion.div
          className="plan-progress-fill"
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Step content ─────────────────────────────────────── */}
      <div className="plan-content-area">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && <DestinationStep plan={draft} onChange={patch} onVoice={() => setVoice(true)} />}
            {step === 1 && <DatesStep plan={draft} onChange={patch} />}
            {step === 2 && <TravelersStep plan={draft} onChange={patch} />}
            {step === 3 && <PreferencesStep plan={draft} onChange={patch} />}
            {step === 4 && <BudgetStep plan={draft} onChange={patch} />}
            {step === 5 && (
              <ReviewStep
                plan={draft}
                onEdit={setStep}
                onGenerate={generate}
                onBuild={startBuild}
                generating={generating}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Sticky bottom nav ────────────────────────────────── */}
      {!isLastStep && (
        <div className="plan-footer">
          <button
            type="button"
            className="plan-footer-back"
            disabled={step === 0}
            onClick={() => setStep((v) => Math.max(0, v - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="plan-footer-center">
            <span className="plan-footer-step-count">
              Step {step + 1} of {steps.length}
            </span>
          </div>

          <button
            type="button"
            className="plan-footer-next"
            onClick={() => setStep((v) => Math.min(steps.length - 1, v + 1))}
          >
            {step === steps.length - 2 ? (
              <>
                Review
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Voice FAB ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setVoice(true)}
        className="plan-voice-fab"
        aria-label="Open voice planner"
        title="Tell TripFlow your plan"
      >
        <Mic className="h-5 w-5" />
        <span className="plan-voice-fab-label">Voice</span>
      </button>

      <VoicePanel open={voice} onClose={() => setVoice(false)} onApply={patch} onGenerate={generateFromVoice} />

      {/* Inline CSS for this page */}
      <style>{`
        .plan-trip-root {
          position: relative;
          min-height: 85vh;
          padding-bottom: 200px;
        }

        /* Header */
        .plan-trip-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .plan-trip-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-muted-gold);
          margin-bottom: 4px;
        }
        .plan-trip-title {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #0f172a;
          line-height: 1.1;
        }
        .plan-trip-subtitle {
          margin-top: 6px;
          font-size: 14px;
          color: #64748b;
          max-width: 400px;
        }
        .plan-save-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-ocean);
          background: #ecfdf5;
          border: 1px solid var(--color-ocean);
          border-radius: 999px;
          padding: 4px 10px;
          white-space: nowrap;
        }

        /* Stepper */
        .plan-stepper {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .plan-stepper::-webkit-scrollbar { display: none; }

        .plan-step-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 110px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .plan-step-btn:disabled {
          cursor: default;
          opacity: 0.45;
        }
        .plan-step-btn--active {
          background: var(--color-warm-ivory);
          border-color: var(--color-muted-gold);
        }
        .plan-step-btn--done {
          background: #f0fdf4;
          border-color: var(--color-ocean);
        }
        .plan-step-btn--done:hover {
          background: #dcfce7;
        }
        .plan-step-btn--active:hover {
          background: var(--color-warm-ivory);
        }
        .plan-step-btn:not(:disabled):not(.plan-step-btn--active):not(.plan-step-btn--done):hover {
          background: var(--color-surface);
          border-color: #e2e8f0;
        }

        .plan-step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .plan-step-number--active {
          background: var(--color-charcoal);
          color: var(--color-muted-gold);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .plan-step-number--done {
          background: var(--color-ocean);
          color: white;
        }

        .plan-step-label-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .plan-step-label {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .plan-step-desc {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }
        .plan-step-btn--active .plan-step-label { color: var(--color-charcoal); }
        .plan-step-btn--done .plan-step-label { color: var(--color-ocean); }

        /* Progress bar */
        .plan-progress-track {
          height: 3px;
          background: #e2e8f0;
          border-radius: 999px;
          margin-top: 12px;
          margin-bottom: 32px;
          overflow: hidden;
        }
        .plan-progress-fill {
          height: 100%;
          background: var(--color-muted-gold);
          border-radius: 999px;
        }

        /* Content area */
        .plan-content-area {
          min-height: 400px;
        }

        /* Sticky footer navigation */
        .plan-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e2e8f0;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.06);
        }

        .plan-footer-back {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          background: none;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 18px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .plan-footer-back:disabled {
          opacity: 0.35;
          cursor: default;
        }
        .plan-footer-back:not(:disabled):hover {
          border-color: #94a3b8;
          color: #334155;
          background: #f8fafc;
        }

        .plan-footer-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .plan-footer-step-count {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .plan-footer-next {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-charcoal);
          background: var(--color-muted-gold);
          border: none;
          border-radius: 12px;
          padding: 10px 22px;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 4px 12px rgba(0,0,0, 0.1);
        }
        .plan-footer-next:hover {
          box-shadow: 0 6px 20px rgba(0,0,0, 0.15);
          transform: translateY(-1px);
        }
        .plan-footer-next:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0,0,0, 0.05);
        }

        /* Voice FAB */
        .plan-voice-fab {
          position: fixed;
          right: 24px;
          bottom: 96px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: var(--color-charcoal);
          color: var(--color-muted-gold);
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0, 0.2);
          transition: all 0.2s;
        }
        .plan-voice-fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 28px rgba(0,0,0, 0.3);
        }
        .plan-voice-fab:active {
          transform: scale(0.97);
        }
        .plan-voice-fab-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        @media (min-width: 1024px) {
          .plan-footer {
            left: 240px;
          }
          [data-sidebar-collapsed="true"] .plan-footer {
            left: 0;
          }
          .plan-voice-fab {
            bottom: 96px; /* Place above the sticky footer */
          }
        }
      `}</style>
    </div>
  )
}
