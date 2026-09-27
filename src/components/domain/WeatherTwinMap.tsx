import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card } from '@/components/ui/Card'
import { MAP_COLORS } from '@/services/maps/colors'
import type { LocatedNode } from '@/services/maps/resolve'
import type { CascadeLink, CityWeatherCell, TwinEntityImpact } from '@/services/twin/weatherModel'

const STRESS: Record<TwinEntityImpact['status'], string> = {
  stable: MAP_COLORS.route,
  watch: MAP_COLORS.alternative,
  stressed: '#ea580c',
  disrupted: MAP_COLORS.disrupted,
}

const LINK: Record<CascadeLink['kind'], string> = {
  weather: '#38bdf8',
  demand: '#f59e0b',
  capacity: '#a855f7',
  delay: '#ef4444',
  workforce: '#64748b',
}

function pin(color: string, selected: boolean) {
  const size = selected ? 16 : 12
  return L.divIcon({
    className: 'tf-twin-pin',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function WeatherTwinMap({
  nodes,
  entities,
  cities,
  links,
  selectedId,
  onSelect,
  height = 360,
  title = 'Weather Digital Twin map',
  caption,
}: {
  nodes: LocatedNode[]
  entities: TwinEntityImpact[]
  cities: CityWeatherCell[]
  links: CascadeLink[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  height?: number
  title?: string
  caption?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

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
    return () => {
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
    const bounds = L.latLngBounds([])

    cities.forEach((cell) => {
      const radius = 18000 + cell.impact * 42000
      L.circle([cell.lat, cell.lng], {
        radius,
        color: cell.impact >= 0.55 ? '#ef4444' : cell.impact >= 0.3 ? '#f59e0b' : '#38bdf8',
        weight: 1,
        fillColor: cell.impact >= 0.55 ? '#ef4444' : cell.impact >= 0.3 ? '#f59e0b' : '#38bdf8',
        fillOpacity: 0.16 + cell.impact * 0.22,
      })
        .bindPopup(`<strong>${cell.city}</strong><br/>${cell.label}<br/>Flood/rain pressure ${(cell.impact * 100).toFixed(0)}%`)
        .addTo(layer)
      bounds.extend([cell.lat, cell.lng])
    })

    links.forEach((link) => {
      const from =
        link.fromId.startsWith('wx:')
          ? cities.find((cell) => `wx:${cell.city}` === link.fromId)
          : entities.find((item) => item.nodeId === link.fromId)
      const to = entities.find((item) => item.nodeId === link.toId)
      if (!from || !to) return
      L.polyline(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        {
          color: LINK[link.kind],
          weight: 2 + link.strength * 4,
          opacity: 0.75,
          dashArray: link.kind === 'weather' ? '4 6' : '1',
        },
      )
        .bindPopup(link.label)
        .addTo(layer)
    })

    nodes.forEach((node) => {
      const impact = entities.find((item) => item.nodeId === node.id)
      const color = selectedId === node.id ? MAP_COLORS.selected : STRESS[impact?.status ?? 'stable']
      const marker = L.marker([node.lat, node.lng], { icon: pin(color, selectedId === node.id) })
      marker.bindPopup(
        `<strong>${node.title}</strong><br/>${node.city}<br/>${impact ? `${impact.status} · delay ${impact.delayMinutes} min` : node.time}`,
      )
      marker.on('click', () => onSelect?.(node.id))
      marker.addTo(layer)
      bounds.extend([node.lat, node.lng])
    })

    if (bounds.isValid()) map.fitBounds(bounds.pad(0.28), { maxZoom: cities.length > 1 ? 6 : 11 })
  }, [nodes, entities, cities, links, selectedId, onSelect])

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="card-title">{title}</p>
          <p className="meta truncate">{caption ?? 'Live weather cells + cascade links on the existing itinerary'}</p>
        </div>
        <span className="shrink-0 text-[12px] text-electric-600">OSM · twin overlay</span>
      </div>
      <div ref={host} className="w-full bg-[#e8eef5]" style={{ height }} />
    </Card>
  )
}
