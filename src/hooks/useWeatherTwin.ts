import { useCallback, useEffect, useMemo, useState } from 'react'
import { locateNodes, type LocatedNode } from '@/services/maps/resolve'
import { explainTwin, fetchSocialSignals, type SocialSignal, type TwinExplainResult } from '@/services/social/signals'
import {
  driversFromWeather,
  simulateWeatherTwin,
  type TwinSnapshot,
  type WeatherWhatIf,
} from '@/services/twin/weatherModel'
import { getWeatherBundle } from '@/services/weather/weather'
import { seedLookup } from '@/services/geo/seeds'
import type { Trip } from '@/types'

export function useWeatherTwin(trip: Trip | undefined) {
  const [located, setLocated] = useState<LocatedNode[]>([])
  const [signals, setSignals] = useState<SocialSignal[]>([])
  const [socialConfigured, setSocialConfigured] = useState(false)
  const [socialMessage, setSocialMessage] = useState<string | undefined>()
  const [observedReady, setObservedReady] = useState(false)
  const [scenario, setScenario] = useState<WeatherWhatIf>({})
  const [narrative, setNarrative] = useState<string | null>(null)
  const [aiMeta, setAiMeta] = useState<TwinExplainResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const cities = useMemo(
    () => [...new Set((trip?.nodes ?? []).map((node) => node.city).filter(Boolean))],
    [trip?.nodes],
  )
  const focusCity = trip?.nodes.find((node) => node.status === 'active')?.city ?? cities[cities.length - 1] ?? 'Goa'

  useEffect(() => {
    let cancelled = false
    if (!trip?.nodes.length) {
      setLocated([])
      setLoading(false)
      return
    }
    setLoading(true)
    locateNodes(trip.nodes)
      .then((nodes) => {
        if (!cancelled) setLocated(nodes)
      })
      .catch(() => {
        if (!cancelled) setError('Could not place itinerary nodes on the twin map.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [trip?.id, trip?.nodes])

  const [drivers, setDrivers] = useState(() =>
    driversFromWeather({
      temperatureC: 29,
      condition: 'Loading',
      weatherCode: 2,
      precipitationProbability: 20,
      precipitationMm: 0.2,
      windKmh: 12,
      humidity: 70,
      source: 'demo',
    }),
  )

  useEffect(() => {
    let cancelled = false
    const pin = seedLookup(focusCity) ?? seedLookup('Goa')
    if (!pin) return
    getWeatherBundle(pin.lat, pin.lng)
      .then((bundle) => {
        if (cancelled) return
        setDrivers(driversFromWeather(bundle.now, bundle.hourly))
        setObservedReady(true)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Live weather is delayed. Twin is using the last known operating band.')
      })
    return () => {
      cancelled = true
    }
  }, [focusCity, tick])

  useEffect(() => {
    let cancelled = false
    if (!cities.length) return
    fetchSocialSignals(cities)
      .then((result) => {
        if (cancelled) return
        setSignals(result.items)
        setSocialConfigured(result.configured)
        setSocialMessage(result.message)
      })
      .catch(() => {
        if (!cancelled) setSocialMessage('Social signals are delayed.')
      })
    return () => {
      cancelled = true
    }
  }, [cities, tick])

  const snapshot: TwinSnapshot | null = useMemo(() => {
    if (!trip || !located.length) return null
    return simulateWeatherTwin({
      trip,
      nodes: located,
      observed: drivers,
      scenario,
      signals,
    })
  }, [trip, located, drivers, scenario, signals])

  useEffect(() => {
    if (!snapshot) return
    const stressed = snapshot.entities.filter((item) => item.status !== 'stable').map((item) => item.title)
    void explainTwin({
      title: trip?.title,
      rainfallMmH: snapshot.applied.rainfallMmH,
      temperatureC: snapshot.applied.temperatureC,
      floodIndex: snapshot.applied.floodIndex,
      stormHours: snapshot.applied.stormHours,
      stressed,
      social: [...new Set(signals.flatMap((item) => item.topics))],
      whatIf: snapshot.whatIf,
    }).then((result) => {
      if (result?.narrative) {
        setNarrative(result.narrative)
        setAiMeta(result)
      }
    })
  }, [snapshot?.generatedAt, snapshot?.whatIf, snapshot?.applied.rainfallMmH, snapshot?.applied.floodIndex])

  const patchScenario = useCallback((patch: WeatherWhatIf) => {
    setScenario((current) => ({ ...current, ...patch }))
  }, [])

  const resetScenario = useCallback(() => setScenario({}), [])

  return {
    located,
    signals,
    socialConfigured,
    socialMessage,
    snapshot,
    scenario,
    patchScenario,
    resetScenario,
    narrative,
    aiMeta,
    loading,
    error,
    observedReady,
    focusCity,
    refresh: () => setTick((value) => value + 1),
  }
}
