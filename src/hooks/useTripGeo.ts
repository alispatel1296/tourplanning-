import { useEffect, useMemo, useState } from 'react'
import { locateNodes, routesForNodes, type LocatedNode } from '@/services/maps/resolve'
import type { RouteLeg } from '@/services/geo/types'
import { toUserMessage } from '@/services/errors'
import type { TripNode } from '@/types'

export function useTripGeo(nodes: TripNode[]) {
  const [located, setLocated] = useState<LocatedNode[]>([])
  const [routes, setRoutes] = useState<RouteLeg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const sig = useMemo(() => nodes.map((node) => `${node.id}:${node.title}:${node.city}:${node.status}`).join('|'), [nodes])

  useEffect(() => {
    let cancelled = false
    if (!nodes.length) {
      setLocated([])
      setRoutes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    locateNodes(nodes)
      .then(async (next) => {
        if (cancelled) return
        setLocated(next)
        try {
          const legs = await routesForNodes(next)
          if (!cancelled) setRoutes(legs)
        } catch (err) {
          if (!cancelled) setError(toUserMessage(err, 'We could not load live route data right now.'))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(toUserMessage(err, 'We could not locate this itinerary on the map.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sig, tick, nodes])

  return { located, routes, loading, error, retry: () => setTick((value) => value + 1) }
}
