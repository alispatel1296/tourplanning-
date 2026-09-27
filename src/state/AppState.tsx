import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  coordinatorRohan,
  demoBookings,
  demoConflicts,
  demoNotifications,
  demoTrips,
  operatorMeera,
  primaryTripNodes,
  travelerAarav,
  vendorAnjali,
} from '@/data/demo'
import type { ToastItem } from '@/components/ui/Feedback'
import { clearSession, initialsFrom, loadSession, saveSession, type AuthSession } from '@/lib/auth'
import {
  clearCheckout,
  DEMO_BOOKING_ID,
  loadCheckout,
  persistCheckout,
  type CheckoutRecord,
} from '@/lib/booking'
import { applyLivePlanToTrip, createTripFromPlan, defaultPlan, loadPlan, persistPlan } from '@/lib/plan'
import { fetchLiveConflicts, planLive } from '@/services/travel/TravelDataService'
import { applyProposalToNodes, type ReplanProposal } from '@/services/twin/dayReplan'
import {
  BEACH_NODE_ID,
  INDOOR_ALT_ID,
  LIVE_REMAINING_START,
  indoorAlt,
  seedLiveNodes,
} from '@/pages/traveler/live/model'
import { hydratePrimaryTrip, overlayConflict, readLiveMirror, writeLiveMirror } from '@/lib/liveMirror'
import { decideNotice, resetDemoInbox } from '@/pages/intelligence/catalog'
import { applyBuilderToTrip, clearBuilder } from '@/pages/traveler/plan/builder/model'
import type { TripPlan } from '@/types/plan'
import type {
  Booking,
  Conflict,
  NotificationItem,
  Role,
  Trip,
  TripNode,
  User,
} from '@/types'

const users: Record<Role, User> = {
  traveler: travelerAarav,
  operator: operatorMeera,
  coordinator: coordinatorRohan,
  vendor: vendorAnjali,
}

interface AppStateValue {
  user: User | null
  role: Role | null
  trips: Trip[]
  activeTripId: string | null
  setActiveTripId: (id: string | null) => void
  bookings: Booking[]
  conflicts: Conflict[]
  notifications: NotificationItem[]
  toasts: ToastItem[]
  generating: boolean
  plan: TripPlan
  checkout: CheckoutRecord | null
  signIn: (role: Role, profile?: { name?: string; email?: string }) => void
  signOut: () => void
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
  dismissToast: (id: string) => void
  markNotificationRead: (id: string) => void
  savePlan: (plan: TripPlan) => void
  generateItinerary: (plan?: TripPlan) => string
  refreshLivePlan: (tripId: string) => Promise<void>
  refreshLiveConflicts: (trip?: Trip) => Promise<void>
  liveSources: string[]
  selectAlternative: (tripId: string, alternativeId: string) => void
  updateNodeStatus: (tripId: string, nodeId: string, status: Trip['nodes'][number]['status']) => void
  resolveConflict: (id: string, state?: Conflict['state']) => void
  updateBookingStatus: (id: string, status: Booking['status']) => void
  addTripNode: (tripId: string, afterId: string, category: Trip['nodes'][number]['category']) => void
  insertTravelNode: (tripId: string, afterId: string | null, node: Partial<TripNode> & Pick<TripNode, 'title' | 'category'>) => void
  applyNodePatch: (tripId: string, nodeId: string, patch: Partial<Trip['nodes'][number]>) => void
  deleteTripNode: (tripId: string, nodeId: string) => void
  confirmCheckout: (payload: Omit<CheckoutRecord, 'bookingId' | 'paidAt'>) => CheckoutRecord
  enterLiveTrip: (tripId: string) => void
  markNodeVisited: (tripId: string, nodeId: string) => void
  applyLiveReroute: (tripId: string, targetId: string, mode: 'stage' | 'accept') => void
  applyDayReplan: (tripId: string, proposal: ReplanProposal) => void
  resetDayReplan: (tripId: string) => void
  keepLivePlan: (tripId: string) => void
  completeTrip: (tripId: string) => void
  resetDemoJourney: () => void
  commitBuiltTrip: (picks: Record<string, { primaryId: string | null; alternativeIds: string[] }>) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = loadSession()
    if (saved) return saved
    const legacy = sessionStorage.getItem('tf-role') as Role | null
    if (!legacy || !users[legacy]) return null
    sessionStorage.removeItem('tf-role')
    const base = users[legacy]
    return { role: legacy, name: base.name, email: base.email, avatarInitials: base.avatarInitials }
  })
  const [activeTripId, setActiveTripIdState] = useState<string | null>(() => {
    return localStorage.getItem('tf-active-trip-id')
  })

  const setActiveTripId = useCallback((id: string | null) => {
    if (id) localStorage.setItem('tf-active-trip-id', id)
    else localStorage.removeItem('tf-active-trip-id')
    setActiveTripIdState(id)
  }, [])

  const [trips, setTrips] = useState<Trip[]>(() => {
    const base = demoTrips.map((trip) => (trip.id === 'trip-amd-goa' ? hydratePrimaryTrip(trip) : trip))
    const savedTripsRaw = localStorage.getItem('tf-custom-trips')
    if (savedTripsRaw) {
      try {
        const custom = JSON.parse(savedTripsRaw) as Trip[]
        return [...custom, ...base]
      } catch {
        // ignore
      }
    }
    return base
  })
  const [bookings, setBookings] = useState<Booking[]>(demoBookings)
  const [conflicts, setConflicts] = useState<Conflict[]>(() => demoConflicts.map(overlayConflict))
  const [notifications, setNotifications] = useState<NotificationItem[]>(demoNotifications)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [liveSources, setLiveSources] = useState<string[]>([])
  const [plan, setPlan] = useState<TripPlan>(() => loadPlan() ?? defaultPlan)
  const [checkout, setCheckout] = useState<CheckoutRecord | null>(() => loadCheckout())
  const generationSeq = useRef(0)

  // Persist custom dynamically created trips to localStorage
  useEffect(() => {
    const custom = trips.filter((t) => !demoTrips.some((dt) => dt.id === t.id))
    localStorage.setItem('tf-custom-trips', JSON.stringify(custom))
  }, [trips])

  const role = session?.role ?? null
  const user = session
    ? {
        ...users[session.role],
        name: session.name,
        email: session.email,
        avatarInitials: session.avatarInitials,
        role: session.role,
      }
    : null

  useEffect(() => {
    if (session) saveSession(session)
    else clearSession()
  }, [session])

  useEffect(() => {
    const westCoast = trips.find((trip) => trip.id === 'trip-amd-goa')
    if (!westCoast) return
    const current = readLiveMirror()
    const indoorLive = westCoast.nodes.some(
      (node) => node.id === INDOOR_ALT_ID && (node.status === 'active' || node.status === 'visited'),
    )
    const staged = westCoast.nodes.some((node) => node.status === 'disrupted')
    const disruption =
      current.disruption === 'approved' && indoorLive
        ? 'approved'
        : indoorLive
          ? 'accepted'
          : staged
            ? 'staged'
            : 'idle'
    writeLiveMirror({ nodes: westCoast.nodes, spent: westCoast.spent, disruption, tripStatus: westCoast.status })
  }, [trips])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismissToast(id), 3200)
    },
    [dismissToast],
  )

  const savePlan = useCallback((next: TripPlan) => {
    persistPlan(next)
    setPlan((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next))
  }, [])

  const mergeLiveConflicts = useCallback((incoming: Conflict[], tripId: string) => {
    setConflicts((current) => {
      const keep = current.filter(
        (item) => item.id === 'cf-2' || (item.tripId !== tripId && !item.id.startsWith('live-cf')),
      )
      return [...incoming, ...keep]
    })
  }, [])

  const refreshLiveConflicts = useCallback(
    async (trip?: Trip) => {
      const target = trip ?? trips.find((item) => item.id === (activeTripId ?? 'trip-amd-goa')) ?? trips[0]
      if (!target) return
      const cities = [target.origin.city, ...target.destinations.map((item) => item.city)].filter(Boolean)
      try {
        const live = await fetchLiveConflicts({
          tripId: target.id,
          tripTitle: target.title,
          cities,
          origin: target.origin.city,
        })
        mergeLiveConflicts(live.conflicts, target.id)
        setLiveSources((current) => [...new Set([...current, ...live.sources])])
      } catch {
        /* keep last desk */
      }
    },
    [activeTripId, mergeLiveConflicts, trips],
  )

  const generateItinerary = useCallback(
    (nextPlan?: TripPlan): string => {
      const incoming = nextPlan ?? plan
      const resolved = { ...incoming, destinations: incoming.destinations.slice(0, 2) }
      persistPlan(resolved)
      setPlan(resolved)
      const newTrip = createTripFromPlan(resolved)
      setTrips((current) => [newTrip, ...current.filter((t) => t.id !== newTrip.id)])
      setActiveTripId(newTrip.id)
      setGenerating(true)
      const seq = ++generationSeq.current
      pushToast({
        title: 'Live itinerary composing',
        body: 'SerpApi, AviationStack, RailRadar, and OpenRouter are assembling the circuit.',
      })
      void (async () => {
        try {
          const live = await planLive({
            origin: resolved.origin,
            destinations: resolved.destinations,
            startDate: resolved.startDate,
            endDate: resolved.endDate,
            adults: resolved.adults,
            budget: resolved.budget,
            styles: resolved.styles,
            transport: resolved.transport,
            accommodation: resolved.accommodation,
            brief: resolved.brief,
          })
          if (generationSeq.current !== seq) return
          sessionStorage.setItem('tf-live-plan', JSON.stringify(live))
          setLiveSources(live.sources)
          setTrips((current) =>
            current.map((trip) => (trip.id === newTrip.id ? applyLivePlanToTrip(trip, live) : trip)),
          )
          setGenerating(false)
          const cities = [resolved.origin, ...resolved.destinations]
          const desk = await fetchLiveConflicts({
            tripId: newTrip.id,
            tripTitle: live.title || newTrip.title,
            cities,
            origin: resolved.origin,
          })
          if (generationSeq.current !== seq) return
          mergeLiveConflicts(desk.conflicts, newTrip.id)
          setLiveSources((current) => [...new Set([...current, ...desk.sources])])
          pushToast({
            title: 'Itinerary optimized',
            body: `${live.title} scored ${live.feasibility}% feasible from ${live.sources.join(', ') || 'live search'}.`,
          })
        } catch {
          if (generationSeq.current !== seq) return
          pushToast({
            title: 'Live compose fell back',
            body: 'Showing the structured circuit. Retry generate if search recovers.',
          })
        } finally {
          if (generationSeq.current === seq) setGenerating(false)
        }
      })()
      return newTrip.id
    },
    [mergeLiveConflicts, plan, pushToast, setActiveTripId],
  )

  const refreshLivePlan = useCallback(
    async (tripId: string) => {
      const trip = trips.find((item) => item.id === tripId)
      if (!trip) return
      setGenerating(true)
      pushToast({
        title: 'Live flow composing',
        body: `Retrieving flights, stays, and places for ${trip.destinations.map((item) => item.city).join(', ') || trip.route}.`,
      })
      try {
        const dests = trip.destinations.map((item) => item.city)
        const live = await planLive({
          origin: trip.origin.city,
          destinations: dests.length ? dests : [trip.route.split('→').pop()?.trim() ?? trip.origin.city],
          startDate: trip.startDate,
          endDate: trip.endDate,
          adults: trip.adults,
          budget: trip.budget,
          styles: trip.travelStyle,
          transport: trip.transport[0] ?? 'Mixed',
          accommodation: trip.accommodation,
          brief: `${trip.title}. ${trip.route}. Day 1 outbound flight from ${trip.origin.city}, then hotel, then timed places so the map can pin each stop.`,
        })
        setLiveSources(live.sources)
        setTrips((current) =>
          current.map((item) => (item.id === tripId ? applyLivePlanToTrip(item, live) : item)),
        )
        pushToast({
          title: 'Live flow ready',
          body: `${live.nodes.length} timed stops from ${live.sources.join(', ') || 'live search'}.`,
        })
      } catch {
        pushToast({
          title: 'Live compose paused',
          body: 'Keeping the current circuit. Try Rebuild live flow again.',
        })
      } finally {
        setGenerating(false)
      }
    },
    [pushToast, trips],
  )

  const enterLiveTrip = useCallback((tripId: string) => {
    setTrips((current) =>
      current.map((trip) => {
        if (trip.id !== tripId) return trip
        if (!trip.nodes.length) return trip
        const nodes = seedLiveNodes(trip.nodes)
        const alreadyLive = trip.status === 'live'
        return {
          ...trip,
          status: 'live',
          nodes,
          spent: alreadyLive ? trip.spent : Math.max(0, trip.budget - LIVE_REMAINING_START),
        }
      }),
    )
  }, [])

  const markNodeVisited = useCallback((tripId: string, nodeId: string) => {
    setTrips((current) =>
      current.map((trip) => {
        if (trip.id !== tripId) return trip
        const index = trip.nodes.findIndex((node) => node.id === nodeId)
        if (index < 0) return trip
        const nodes = trip.nodes.map((node) => (node.id === nodeId ? { ...node, status: 'visited' as const } : node))
        const next = nodes.find(
          (node, i) => i > index && node.status !== 'visited' && node.status !== 'disrupted' && node.status !== 'skipped',
        )
        return {
          ...trip,
          nodes: nodes.map((node) => {
            if (next && node.id === next.id) return { ...node, status: 'active' as const }
            if (node.status === 'active' && node.id !== next?.id) return { ...node, status: 'upcoming' as const }
            return node
          }),
        }
      }),
    )
  }, [])

  const applyLiveReroute = useCallback(
      (tripId: string, targetId: string, mode: 'stage' | 'accept') => {
      setTrips((current) =>
        current.map((trip) => {
          if (trip.id !== tripId) return trip
          const beach = trip.nodes.find((node) => node.id === targetId)
          let nodes = [...trip.nodes]
          const hasAlt = nodes.some((node) => node.id === INDOOR_ALT_ID)
          if (beach && !hasAlt) {
            const at = nodes.findIndex((node) => node.id === targetId)
            nodes.splice(at + 1, 0, indoorAlt(beach))
          }
          nodes = nodes.map((node) => {
            if (node.id === targetId) return { ...node, status: 'disrupted' as const }
            if (node.id === INDOOR_ALT_ID) {
              return { ...node, status: mode === 'accept' ? ('active' as const) : ('alternative' as const) }
            }
            if (mode === 'accept' && node.status === 'active') return { ...node, status: 'upcoming' as const }
            return node
          })
          const save = mode === 'accept' && beach ? Math.max(0, beach.cost - 1800) : 0
          return { ...trip, nodes, spent: Math.max(0, trip.spent - save) }
        }),
      )
      setConflicts((current) =>
        current.map((conflict) =>
          conflict.id === 'cf-2'
            ? {
                ...conflict,
                title: mode === 'accept' ? 'Baga swell — traveler accepted indoor swap' : 'Baga sea swell advisory',
                description:
                  mode === 'accept'
                    ? 'Aarav Shah accepted Beach activity → Cooking class. Rain risk exceeded threshold. Impact ₹400. Desk can approve the live path.'
                    : 'IMD swell on Baga. Beach node is red. Indoor food alternative is staged in yellow.',
                state: 'open' as const,
                severity: 'high' as const,
              }
            : conflict,
        ),
      )
      writeLiveMirror({ disruption: mode === 'accept' ? 'accepted' : 'staged' })
      if (mode === 'accept') {
        decideNotice('in-weather', 'accepted')
        setNotifications((current) => [
          {
            id: crypto.randomUUID(),
            title: 'Your itinerary was updated.',
            body: 'Indoor food experience is now on the live path after the Baga rain hold.',
            time: 'Just now',
            tone: 'ai',
            read: false,
          },
          ...current,
        ])
        pushToast({ title: 'Your itinerary was updated.', body: 'The yellow alternative is now the green live path.' })
      }
    },
    [pushToast],
  )

  const applyDayReplan = useCallback(
    (tripId: string, proposal: ReplanProposal) => {
      setTrips((current) =>
        current.map((trip) => {
          if (trip.id !== tripId) return trip
          const nodes = applyProposalToNodes(trip.nodes, proposal)
          const spent = nodes
            .filter((node) => node.status === 'visited' || node.status === 'active')
            .reduce((sum, node) => sum + node.cost, 0)
          return { ...trip, nodes, spent }
        }),
      )
      setConflicts((current) => [
        {
          id: `live-cf-replan-${Date.now()}`,
          tripId,
          tripTitle: proposal.headline,
          title: proposal.headline,
          description: `${proposal.changes.length} hops rewritten from Day ${proposal.fromDay} in ${proposal.city}. Budget ${proposal.budgetDelta >= 0 ? '+' : ''}₹${Math.abs(proposal.budgetDelta).toLocaleString('en-IN')}.`,
          severity: proposal.live ? 'high' : 'medium',
          state: 'open',
          city: proposal.city,
          detectedAt: 'Just now',
          owner: 'Traveler twin',
          source: proposal.source,
        },
        ...current,
      ])
      setNotifications((current) => [
        {
          id: crypto.randomUUID(),
          title: 'Itinerary replanned from the wet day',
          body: `${proposal.city} Day ${proposal.fromDay}: ${proposal.changes[0]?.fromTitle ?? 'outdoor hop'} moved indoors.`,
          time: 'Just now',
          tone: 'ai',
          read: false,
        },
        ...current,
      ])
      pushToast({
        title: 'Replan applied',
        body: `From Day ${proposal.fromDay} in ${proposal.city}. ${proposal.budgetDelta === 0 ? 'Budget unchanged.' : proposal.budgetDelta < 0 ? `Saved ₹${Math.abs(proposal.budgetDelta).toLocaleString('en-IN')}.` : `Added ₹${proposal.budgetDelta.toLocaleString('en-IN')}.`}`,
      })
    },
    [pushToast],
  )

  const resetDayReplan = useCallback((tripId: string) => {
    setTrips((current) =>
      current.map((trip) => {
        if (trip.id !== tripId) return trip
        const nodes = trip.nodes
          .filter((node) => !node.id.startsWith('replan-'))
          .map((node) =>
            node.status === 'disrupted'
              ? { ...node, status: trip.status === 'live' ? ('upcoming' as const) : node.status === 'disrupted' ? ('upcoming' as const) : node.status }
              : {
                  ...node,
                  title: node.title.replace(/ · \+25 min buffer/g, ''),
                  notes: node.notes.replace(/ · Weather buffer \+25 min after Day \d+ replan\./g, ''),
                },
          )
        return { ...trip, nodes }
      }),
    )
  }, [])

  const completeTrip = useCallback((tripId: string) => {
    setTrips((current) =>
      current.map((trip) => (trip.id === tripId ? { ...trip, status: 'completed' } : trip)),
    )
  }, [])

  const keepLivePlan = useCallback((tripId: string) => {
    setTrips((current) =>
      current.map((trip) => {
        if (trip.id !== tripId) return trip
        return {
          ...trip,
          nodes: trip.nodes
            .filter((node) => node.id !== INDOOR_ALT_ID)
            .map((node) => (node.id === BEACH_NODE_ID ? { ...node, status: 'active' as const } : node)),
        }
      }),
    )
    writeLiveMirror({ disruption: 'idle' })
    decideNotice('in-weather', 'rejected')
    setConflicts((current) => current.map((conflict) => (conflict.id === 'cf-2' ? overlayConflict({ ...conflict, state: 'investigating' }) : conflict)))
  }, [])

  const resetDemoJourney = useCallback(() => {
    persistPlan(defaultPlan)
    sessionStorage.removeItem('tf-itin-ready')
    clearCheckout()
    resetDemoInbox()
    writeLiveMirror({
      nodes: primaryTripNodes,
      spent: 55800,
      disruption: 'idle',
      tripStatus: 'ready',
    })
    setPlan(defaultPlan)
    setTrips(demoTrips)
    setConflicts(demoConflicts)
    setCheckout(null)
    setNotifications(demoNotifications)
    clearBuilder()
  }, [])

  const commitBuiltTrip = useCallback(
    (picks: Record<string, { primaryId: string | null; alternativeIds: string[] }>) => {
      setTrips((current) =>
        current.map((trip) => (trip.id === 'trip-amd-goa' ? applyBuilderToTrip(trip, plan, picks) : trip)),
      )
      pushToast({ title: 'Circuit placed', body: 'Your hop-by-hop picks are now the live itinerary.' })
    },
    [plan, pushToast],
  )

  const value = useMemo<AppStateValue>(
    () => ({
      user,
      role,
      trips,
      bookings,
      conflicts,
      notifications,
      toasts,
      generating,
      liveSources,
      plan,
      checkout,
      signIn: (next, profile) => {
        const base = users[next]
        const name = profile?.name?.trim() || base.name
        const email = profile?.email?.trim() || base.email
        setSession({
          role: next,
          name,
          email,
          avatarInitials: initialsFrom(name),
        })
      },
      signOut: () => setSession(null),
      pushToast,
      dismissToast,
      markNotificationRead: (id) =>
        setNotifications((current) =>
          current.map((item) => (item.id === id ? { ...item, read: true } : item)),
        ),
      savePlan,
      generateItinerary,
      refreshLivePlan,
      refreshLiveConflicts,
      selectAlternative: (tripId, alternativeId) => {
        setTrips((current) =>
          current.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  alternatives: trip.alternatives.map((alt) => ({
                    ...alt,
                    selected: alt.id === alternativeId,
                  })),
                }
              : trip,
          ),
        )
        pushToast({ title: 'Alternative selected', body: 'Route updated in the live plan.' })
      },
      updateNodeStatus: (tripId, nodeId, status) => {
        setTrips((current) =>
          current.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  nodes: trip.nodes.map((node) => (node.id === nodeId ? { ...node, status } : node)),
                }
              : trip,
          ),
        )
      },
      resolveConflict: (id, state = 'resolved') => {
        if (id === 'cf-2' && state === 'resolved') {
          writeLiveMirror({ disruption: 'approved' })
          setConflicts((current) =>
            current.map((conflict) =>
              conflict.id === 'cf-2' ? overlayConflict({ ...conflict, state: 'resolved' }) : conflict,
            ),
          )
          pushToast({
            title: 'AI change approved',
            body: 'Indoor food is now the desk-confirmed live path for Aarav Shah.',
          })
          return
        }
        setConflicts((current) =>
          current.map((conflict) => (conflict.id === id ? { ...conflict, state } : conflict)),
        )
        if (state === 'resolved') {
          setBookings((current) =>
            current.map((booking) =>
              booking.id === 'b-1004' ? { ...booking, status: 'confirmed' } : booking,
            ),
          )
        }
        pushToast({
          title: state === 'resolved' ? 'Conflict resolved' : 'Conflict updated',
          body: 'Operations state refreshed across bookings.',
        })
      },
      updateBookingStatus: (id, status) => {
        setBookings((current) =>
          current.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
        )
        pushToast({ title: 'Booking updated', body: `Status is now ${status}.` })
      },
      addTripNode: (tripId, afterId, category) => {
        const drafts: Record<Trip['nodes'][number]['category'], Omit<Trip['nodes'][number], 'id' | 'day' | 'date' | 'city' | 'status'>> = {
          activity: { title: 'New activity', time: '16:00', category: 'activity', cost: 1200, notes: 'Added from the flow canvas.' },
          food: { title: 'Local meal', time: '13:00', category: 'food', cost: 800, notes: 'Added from the flow canvas.' },
          transport: { title: 'Local transfer', time: '09:30', category: 'transport', cost: 450, notes: 'Added from the flow canvas.' },
          free: { title: 'Free time', time: '15:00', category: 'free', cost: 0, notes: 'Open block on the live graph.' },
          stay: { title: 'Extra stay window', time: '14:00', category: 'stay', cost: 4000, notes: 'Added from the flow canvas.' },
        }
        setTrips((current) =>
          current.map((trip) => {
            if (trip.id !== tripId) return trip
            const index = trip.nodes.findIndex((node) => node.id === afterId)
            const anchor = trip.nodes[index] ?? trip.nodes[trip.nodes.length - 1]
            const next = {
              ...drafts[category],
              id: `n-${crypto.randomUUID().slice(0, 8)}`,
              day: anchor?.day ?? 1,
              date: anchor?.date ?? trip.startDate,
              city: anchor?.city ?? trip.origin.city,
              status: 'upcoming' as const,
            }
            const nodes = [...trip.nodes]
            nodes.splice(index + 1, 0, next)
            return { ...trip, nodes, spent: trip.spent + next.cost }
          }),
        )
        pushToast({ title: 'Node added', body: 'The live route now includes your new stop.' })
      },
      insertTravelNode: (tripId, afterId, node) => {
        setTrips((current) =>
          current.map((trip) => {
            if (trip.id !== tripId) return trip
            const index = afterId ? trip.nodes.findIndex((item) => item.id === afterId) : trip.nodes.length - 1
            const anchor = trip.nodes[index] ?? trip.nodes[trip.nodes.length - 1]
            const next: TripNode = {
              id: `n-${crypto.randomUUID().slice(0, 8)}`,
              day: node.day ?? anchor?.day ?? 1,
              date: node.date ?? anchor?.date ?? trip.startDate,
              title: node.title,
              city: node.city ?? anchor?.city ?? trip.origin.city,
              time: node.time ?? '12:00',
              category: node.category,
              status: 'upcoming',
              cost: node.cost ?? 0,
              notes: node.notes ?? 'Added from live search.',
              lat: node.lat,
              lng: node.lng,
              placeId: node.placeId,
            }
            const nodes = [...trip.nodes]
            nodes.splice(Math.max(0, index + 1), 0, next)
            return { ...trip, nodes, spent: trip.spent + next.cost }
          }),
        )
        pushToast({ title: 'Added to trip', body: `${node.title} is now on the green path.` })
      },
      applyNodePatch: (tripId, nodeId, patch) => {
        setTrips((current) =>
          current.map((trip) => {
            if (trip.id !== tripId) return trip
            const nodes = trip.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
            const spent = nodes.reduce((sum, node) => sum + node.cost, 0)
            return { ...trip, nodes, spent }
          }),
        )
      },
      deleteTripNode: (tripId, nodeId) => {
        let removedTitle = ''
        setTrips((current) =>
          current.map((trip) => {
            if (trip.id !== tripId) return trip
            const target = trip.nodes.find((node) => node.id === nodeId)
            if (target) removedTitle = target.title
            const nodes = trip.nodes.filter((node) => node.id !== nodeId)
            const spent = nodes.reduce((sum, node) => sum + node.cost, 0)
            return { ...trip, nodes, spent }
          }),
        )
        if (removedTitle) {
          pushToast({ title: 'Stop removed', body: `${removedTitle} was removed from your trip path.` })
        }
      },
      confirmCheckout: (payload) => {
        const record: CheckoutRecord = {
          ...payload,
          bookingId: DEMO_BOOKING_ID,
          paidAt: new Date().toISOString(),
        }
        persistCheckout(record)
        setCheckout(record)
        setTrips((current) =>
          current.map((trip) =>
            trip.id === payload.tripId ? { ...trip, status: 'ready', spent: payload.total } : trip,
          ),
        )
        pushToast({ title: 'Payment simulated', body: `${DEMO_BOOKING_ID} is held. No charge was made.` })
        return record
      },
      activeTripId,
      setActiveTripId,
      enterLiveTrip,
      markNodeVisited,
      applyLiveReroute,
      applyDayReplan,
      resetDayReplan,
      keepLivePlan,
      completeTrip,
      resetDemoJourney,
      commitBuiltTrip,
    }),
    [user, role, trips, activeTripId, setActiveTripId, bookings, conflicts, notifications, toasts, generating, liveSources, plan, checkout, pushToast, dismissToast, savePlan, generateItinerary, refreshLivePlan, refreshLiveConflicts, enterLiveTrip, markNodeVisited, applyLiveReroute, applyDayReplan, resetDayReplan, keepLivePlan, completeTrip, resetDemoJourney, commitBuiltTrip],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}

export function usePrimaryTrip() {
  const { trips, activeTripId } = useAppState()
  const live = trips.find((trip) => trip.status === 'live')
  if (live) return live
  if (activeTripId) {
    const found = trips.find((trip) => trip.id === activeTripId)
    if (found) return found
  }
  return trips.find((trip) => trip.id === 'trip-amd-goa') ?? trips[0]
}


