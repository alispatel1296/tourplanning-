import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { GenerationStage } from '@/pages/traveler/itinerary/GenerationStage'
import { ResultView } from '@/pages/traveler/itinerary/ResultView'
import { useAppState } from '@/state/AppState'

const READY_KEY = 'tf-itin-ready'

export function Itinerary() {
  const location = useLocation()
  const { plan, generateItinerary, generating } = useAppState()
  const forced = Boolean((location.state as { generate?: boolean } | null)?.generate)
  const [run, setRun] = useState(0)
  const [phase, setPhase] = useState<'generating' | 'ready'>(() =>
    forced || !sessionStorage.getItem(READY_KEY) ? 'generating' : 'ready',
  )

  const finish = useCallback(() => {
    sessionStorage.setItem(READY_KEY, '1')
    setPhase('ready')
  }, [])

  const regenerate = () => {
    sessionStorage.removeItem(READY_KEY)
    generateItinerary(plan)
    setRun((value) => value + 1)
    setPhase('generating')
  }

  if (phase === 'generating') {
    return <GenerationStage key={run} onComplete={finish} liveReady={!generating} />
  }

  return <ResultView onRegenerate={regenerate} />
}
