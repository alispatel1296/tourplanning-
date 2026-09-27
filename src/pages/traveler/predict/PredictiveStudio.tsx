import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { useWeatherTwin } from '@/hooks/useWeatherTwin'
import { EmergencyPredictPanel } from '@/pages/traveler/predict/EmergencyPredictPanel'
import { forecastEmergency } from '@/services/predict/emergencyModel'
import { useAppState } from '@/state/AppState'

export function PredictiveStudio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips } = useAppState()
  const trip = trips.find((item) => item.id === id) ?? trips[0]
  const twin = useWeatherTwin(trip)
  const forecast = useMemo(
    () => (trip && twin.snapshot ? forecastEmergency(trip, twin.snapshot) : null),
    [trip, twin.snapshot],
  )

  if (!trip) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="No circuit to score"
        body="Open a live trip first. Predictive emergency needs an itinerary graph."
        action={<Button type="button" onClick={() => navigate('/traveler/trips')}>My trips</Button>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="USP"
        title="Predictive emergency modelling"
        description={`${trip.title} · ${trip.route}. Six frameworks score the next shock before it hits the live companion — then you stage a yellow path, bookings stay put.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={twin.refresh}>
              Refresh nowcast
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/traveler/twin/${trip.id}`)}>
              Weather twin
            </Button>
            <Button type="button" onClick={() => navigate(`/traveler/live/${trip.id}`)}>
              Live companion
            </Button>
          </div>
        }
      />

      {twin.error ? <p className="text-sm text-amber-800">{twin.error}</p> : null}
      {forecast ? (
        <EmergencyPredictPanel forecast={forecast} />
      ) : (
        <p className="text-sm text-slate-500">Scoring the itinerary DAG against live weather…</p>
      )}
    </div>
  )
}
