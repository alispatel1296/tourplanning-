import { demoVendors } from '@/data/demo'
import { alternativesFor } from '@/pages/traveler/flow/alternatives'
import type { Alternative, Trip, TripNode } from '@/types'

export const typeMeta: Record<TripNode['category'], { label: string; color: string; ring: string }> = {
  transport: { label: 'Transport', color: 'bg-electric-50 text-electric-700 border-electric-200', ring: '#2563eb' },
  stay: { label: 'Hotel', color: 'bg-brand-50 text-brand-800 border-brand-200', ring: '#5534c9' },
  food: { label: 'Eatery', color: 'bg-amber-50 text-amber-800 border-amber-200', ring: '#d97706' },
  activity: { label: 'Place', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', ring: '#059669' },
  free: { label: 'Free time', color: 'bg-slate-50 text-slate-700 border-slate-200', ring: '#64748b' },
}

const heroes: Record<TripNode['category'], string[]> = {
  stay: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70',
  ],
  food: [
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70',
  ],
  activity: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=70',
  ],
  transport: [
    'https://images.unsplash.com/photo-1474487548417-371f734a7e38?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=70',
  ],
  free: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=70',
  ],
}

const cityPin: Record<string, { lat: number; lng: number; area: string }> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714, area: 'Kalupur / Navrangpura' },
  Mumbai: { lat: 19.076, lng: 72.8777, area: 'Andheri / South Mumbai' },
  Candolim: { lat: 15.518, lng: 73.763, area: 'North Goa beach road' },
  Baga: { lat: 15.555, lng: 73.751, area: 'Baga creek' },
  Ponda: { lat: 15.401, lng: 74.007, area: 'Spice belt' },
  Panaji: { lat: 15.4909, lng: 73.8278, area: 'Latin Quarter' },
  Palolem: { lat: 15.01, lng: 74.023, area: 'South Goa' },
  Goa: { lat: 15.2993, lng: 74.124, area: 'North / South Goa' },
}

const phones: Record<string, string> = {
  'v-fern': '+91 22 2830 4400',
  'v-novotel': '+91 832 249 3666',
  'v-meru': '+91 22 4422 4422',
  'v-baga': '+91 98221 66740',
  'v-trishna': '+91 22 2270 3213',
  'v-sahakari': '+91 832 231 2394',
  'v-irctc': '139',
  'v-indigo': '+91 124 617 3838',
}

export interface NodeDossier {
  typeLabel: string
  hero: string
  gallery: string[]
  address: string
  area: string
  hours: string
  available: string
  availableTone: 'success' | 'warning' | 'danger'
  phone: string
  email: string
  vendorName: string
  lat: number
  lng: number
  mapSrc: string
}

export function nodeImage(node: TripNode) {
  const set = heroes[node.category]
  const index = Math.abs(node.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % set.length
  return set[index]
}

export function dossierFor(node: TripNode): NodeDossier {
  const vendor = demoVendors.find((item) => item.id === node.vendorId)
  const pin = cityPin[node.city] ?? cityPin.Goa
  const waitlisted = node.id === 'n8' && node.title.toLowerCase().includes('novotel')
  const available = waitlisted ? 'Waitlisted' : node.status === 'disrupted' ? 'Held / weather' : 'Available'
  const availableTone = waitlisted || node.status === 'disrupted' ? 'danger' : node.status === 'alternative' ? 'warning' : 'success'
  const hours =
    node.category === 'stay'
      ? 'Check-in 14:00 · checkout 11:00'
      : node.category === 'food'
        ? 'Kitchen 12:00 – 22:30'
        : node.category === 'transport'
          ? node.time
          : 'Slot as timed on the live path'
  const lat = node.lat ?? pin.lat
  const lng = node.lng ?? pin.lng
  const delta = 0.02
  return {
    typeLabel: typeMeta[node.category].label,
    hero: nodeImage(node),
    gallery: heroes[node.category],
    address: vendor ? `${vendor.name}, ${node.city}` : `${node.title}, ${node.city}`,
    area: pin.area,
    hours,
    available,
    availableTone,
    phone: (node.vendorId && phones[node.vendorId]) || '+91 83224 90811',
    email: vendor?.contact ?? 'desk@horizontrails.in',
    vendorName: vendor?.name ?? 'Horizon Trails desk',
    lat,
    lng,
    mapSrc: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`,
  }
}

export interface VisualBranch {
  id: string
  parentId: string
  title: string
  subtitle: string
  extraCost: number
  image: string
}

export function visualBranches(trip: Trip, nodes: TripNode[]): VisualBranch[] {
  const main = nodes.filter((node) => node.status !== 'alternative')
  const branches: VisualBranch[] = []

  nodes
    .filter((node) => node.status === 'alternative')
    .forEach((node) => {
      const parent =
        main.filter((item) => item.day === node.day).slice(-1)[0] ??
        main.find((item) => item.day === node.day) ??
        main[0]
      if (!parent) return
      branches.push({
        id: node.id,
        parentId: parent.id,
        title: node.title,
        subtitle: `${node.city} · alternative`,
        extraCost: node.cost - parent.cost,
        image: nodeImage(node),
      })
    })

  trip.alternatives.forEach((alt, index) => {
    const parent = parentForAlt(main, alt) ?? main[Math.min(index + 1, main.length - 1)]
    if (!parent || branches.some((row) => row.id === alt.id)) return
    if (branches.filter((row) => row.parentId === parent.id).length >= 2) return
    branches.push({
      id: alt.id,
      parentId: parent.id,
      title: alt.title,
      subtitle: alt.reason,
      extraCost: alt.extraCost,
      image: nodeImage(parent),
    })
  })

  const corridor = `${trip.route} ${trip.destinations.map((item) => item.city).join(' ')}`.toLowerCase()
  const localCatalog = /goa|mumbai|candolim|baga/.test(corridor)
  if (localCatalog) {
    main.forEach((node) => {
      if (branches.some((row) => row.parentId === node.id)) return
      if (node.category !== 'transport' && node.category !== 'stay') return
      const catalog = alternativesFor(node)[0]
      if (!catalog) return
      branches.push({
        id: catalog.id,
        parentId: node.id,
        title: catalog.name,
        subtitle: catalog.benefit,
        extraCost: catalog.price - node.cost,
        image: nodeImage(node),
      })
    })
  }

  return branches
}

function parentForAlt(main: TripNode[], alt: Alternative) {
  const text = `${alt.title} ${alt.reason}`.toLowerCase()
  if (text.includes('train') || text.includes('flight') || text.includes('vande')) {
    return main.find((node) => node.category === 'transport' && node.city === 'Ahmedabad') ?? main.find((node) => node.category === 'transport')
  }
  if (text.includes('hotel') || text.includes('stay') || text.includes('novotel') || text.includes('caravela')) {
    return main.find((node) => node.category === 'stay' && node.city !== 'Mumbai') ?? main.find((node) => node.category === 'stay')
  }
  if (text.includes('baga') || text.includes('beach') || text.includes('dudhsagar')) {
    return main.find((node) => node.category === 'activity')
  }
  return main.find((node) => node.category === 'transport' && node.title.toLowerCase().includes('goa'))
}
