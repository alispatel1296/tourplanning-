import { useEffect, useState } from 'react'
import { alternativesFor, type NodeAlternative } from '@/pages/traveler/flow/alternatives'
import { searchActivities, searchHotels, searchRestaurants } from '@/services/travel/TravelDataService'
import { entityToPatch, priceLabel } from '@/services/travel/toNode'
import type { TravelEntity } from '@/services/travel/types'
import type { TripNode } from '@/types'

function toAlt(entity: TravelEntity): NodeAlternative {
  const delta = entity.price != null ? `Live price ${priceLabel(entity)}` : 'Price unavailable'
  return {
    id: entity.id,
    name: entity.name,
    rating: entity.rating ?? 0,
    price: entity.price ?? 0,
    distance: entity.location ?? 'Location unavailable',
    timeImpact: 'Check Digital Twin after select',
    benefit: entity.fitLabel ?? delta,
    duration: entity.openingHours ?? 'Hours unavailable',
    convenience: entity.location ?? 'Retrieved place',
    feasibility: entity.rating != null ? `${Math.round((entity.rating / 5) * 100)}%` : 'Unknown',
    reason: (entity.reasons ?? [entity.sourceLabel]).join(' · '),
    createsGap: false,
    patch: entityToPatch(entity),
  }
}

export function useLiveAlternatives(node: TripNode | null) {
  const catalog = node ? alternativesFor(node) : []
  const [alts, setAlts] = useState<NodeAlternative[]>(catalog)
  const [source, setSource] = useState<'live' | 'catalog'>('catalog')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!node) return
    setAlts(alternativesFor(node))
    setSource('catalog')
    let cancelled = false
    const run = async () => {
      try {
        const result =
          node.category === 'stay'
            ? await searchHotels(node.city)
            : node.category === 'food'
              ? await searchRestaurants(`${node.title} ${node.city}`)
              : node.category === 'activity'
                ? await searchActivities(node.city)
                : null
        if (cancelled || !result) return
        if (result.message && !result.items.length) {
          setMessage(result.message)
          return
        }
        const live = result.items.filter((item) => item.name !== node.title).slice(0, 4).map(toAlt)
        if (live.length) {
          setAlts(live)
          setSource('live')
          setMessage(null)
        }
      } catch {
        if (!cancelled) setMessage('Live search is temporarily unavailable.')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [node?.id, node?.title, node?.city, node?.category])

  return { alts, source, message }
}
