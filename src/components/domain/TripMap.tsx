import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MAP_COLORS, markerColor, type MarkerKind } from '@/services/maps/colors'
import { formatDistance, formatDuration } from '@/services/maps/routing'
import { geocodeLocation } from '@/services/geo/geocode'
import type { RouteLeg } from '@/services/geo/types'
import type { LocatedNode } from '@/services/maps/resolve'
import type { UserFix } from '@/services/location/location'

export interface TripMapProps {
  nodes: LocatedNode[]
  routes?: RouteLeg[]
  altRoutes?: RouteLeg[]
  selectedId?: string | null
  userLocation?: UserFix | null
  onSelect?: (id: string) => void
  height?: number
  title?: string
  caption?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  searchEnabled?: boolean
}

function kindFor(node: LocatedNode): MarkerKind {
  if (node.status === 'disrupted') return 'disrupted'
  if (node.status === 'alternative') return 'ai'
  return node.category
}

function pinIcon(color: string, selected: boolean) {
  const size = selected ? 18 : 14
  return L.divIcon({
    className: 'tf-pin',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function TripMap({
  nodes,
  routes = [],
  altRoutes = [],
  selectedId,
  userLocation,
  onSelect,
  height = 280,
  title = 'Live route',
  caption,
  loading,
  error,
  onRetry,
  searchEnabled,
}: TripMapProps) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [query, setQuery] = useState('')
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const selected = nodes.find((node) => node.id === selectedId)

  const summary = useMemo(() => {
    const distance = routes.reduce((sum, leg) => sum + leg.distanceMeters, 0)
    const duration = routes.reduce((sum, leg) => sum + leg.durationSeconds, 0)
    if (!distance) return caption ?? nodes.map((node) => node.city).filter(Boolean).join(' → ')
    return `${caption ? `${caption} · ` : ''}${formatDistance(distance)} · ${formatDuration(duration)}`
  }, [routes, caption, nodes])

  useEffect(() => {
    if (!host.current || mapRef.current) return
    const map = L.map(host.current, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.setView([19.08, 72.88], 5)
    mapRef.current = map
    const resize = window.setTimeout(() => map.invalidateSize(), 120)
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => map.invalidateSize())
    if (host.current) observer?.observe(host.current)
    return () => {
      window.clearTimeout(resize)
      observer?.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    routes.forEach((leg) => {
      L.polyline(leg.geometry, { color: MAP_COLORS.route, weight: 5, opacity: 0.9 }).addTo(layer)
    })
    altRoutes.forEach((leg) => {
      L.polyline(leg.geometry, {
        color: MAP_COLORS.alternative,
        weight: 4,
        opacity: 0.85,
        dashArray: '8 8',
      }).addTo(layer)
    })

    const bounds = L.latLngBounds([])
    nodes.forEach((node) => {
      const color = selectedId === node.id ? MAP_COLORS.selected : markerColor(kindFor(node))
      const marker = L.marker([node.lat, node.lng], { icon: pinIcon(color, selectedId === node.id) })
      marker.bindPopup(`<strong>${node.title}</strong><br/>${node.city} · ${node.time}`)
      marker.on('click', () => onSelect?.(node.id))
      marker.addTo(layer)
      bounds.extend([node.lat, node.lng])
    })

    if (userLocation) {
      const here = L.marker([userLocation.lat, userLocation.lng], { icon: pinIcon(MAP_COLORS.here, true) })
      here.bindPopup('You are here')
      here.addTo(layer)
      bounds.extend([userLocation.lat, userLocation.lng])
    }

    if (searchPin) {
      const found = L.marker([searchPin.lat, searchPin.lng], { icon: pinIcon(MAP_COLORS.ai, true) })
      found.bindPopup(searchPin.label)
      found.addTo(layer)
      bounds.extend([searchPin.lat, searchPin.lng])
    }

    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 12), { duration: 0.6 })
      return
    }
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.18), { maxZoom: 12 })
  }, [nodes, routes, altRoutes, selectedId, userLocation, onSelect, selected, searchPin])

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="card-title">{title}</p>
          <p className="meta truncate">{loading ? 'Locating itinerary…' : summary}</p>
        </div>
        <span className="shrink-0 text-[12px] text-electric-600">OSM · live tiles</span>
      </div>
      {searchEnabled ? (
        <form
          className="flex gap-2 border-b border-line px-4 py-2"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!query.trim()) return
            const point = await geocodeLocation(query.trim())
            if (point) {
              setSearchPin({ lat: point.lat, lng: point.lng, label: point.formattedAddress })
              mapRef.current?.flyTo([point.lat, point.lng], 13, { duration: 0.6 })
            }
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a place on the map"
            className="h-9 flex-1 rounded-lg border border-line px-3 text-sm outline-none"
          />
          <Button size="sm" type="submit" variant="secondary">
            Search
          </Button>
        </form>
      ) : null}
      {error ? (
        <div className="flex items-center justify-between gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          <p>{error}</p>
          {onRetry ? (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
      <div ref={host} className="w-full bg-[#eef3f8]" style={{ height }} />
    </Card>
  )
}
