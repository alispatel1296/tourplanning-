import { MapPanel } from '@/components/domain/MapPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAppState, usePrimaryTrip } from '@/state/AppState'
import { useNavigate } from 'react-router-dom'

export function TravelerMap() {
  const trip = usePrimaryTrip()
  const { plan } = useAppState()
  const navigate = useNavigate()
  const nodes = trip?.nodes.filter((node) => node.status !== 'alternative') ?? []

  return (
    <div>
      <PageHeader
        title="Trip map"
        description={trip ? `${trip.route} · live OSM tiles and retrieved stops.` : 'Plan a trip to plot the corridor.'}
        actions={
          <Button type="button" size="sm" variant="secondary" onClick={() => navigate(trip ? `/traveler/live/${trip.id}` : '/traveler/plan')}>
            {trip ? 'Open live' : 'Plan a trip'}
          </Button>
        }
      />
      <MapPanel
        title={trip?.title ?? 'Corridor'}
        caption={trip?.route ?? plan.destinations.join(' → ')}
        nodes={nodes.length ? nodes : undefined}
        height={520}
      />
    </div>
  )
}
