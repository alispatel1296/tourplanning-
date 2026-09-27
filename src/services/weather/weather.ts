import { cacheGet, cacheSet, TTL } from '@/services/cache'
import { getJson } from '@/services/http'
import type { WeatherBundle, WeatherDay, WeatherHour, WeatherNow } from '@/services/geo/types'

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number
    weather_code: number
    precipitation?: number
    precipitation_probability?: number
    wind_speed_10m: number
    relative_humidity_2m: number
  }
  hourly?: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
    precipitation_probability: number[]
    weather_code: number[]
    wind_speed_10m: number[]
  }
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
}

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  80: 'Rain showers',
  81: 'Heavy showers',
  95: 'Thunderstorm',
}

export function weatherLabel(code: number): string {
  return WMO[code] ?? 'Mixed conditions'
}

export function weatherIconHint(code: number): 'sun' | 'cloud' | 'rain' | 'storm' {
  if (code >= 95) return 'storm'
  if (code >= 51) return 'rain'
  if (code >= 2) return 'cloud'
  return 'sun'
}

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherNow> {
  const key = `wx:${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = cacheGet<WeatherNow>(key)
  if (cached) return cached
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m,relative_humidity_2m&timezone=auto'
  const { data } = await getJson<OpenMeteoResponse>(url)
  const current = data.current
  if (!current) throw new Error('empty')
  const now: WeatherNow = {
    temperatureC: Math.round(current.temperature_2m),
    condition: weatherLabel(current.weather_code),
    weatherCode: current.weather_code,
    precipitationProbability: current.precipitation_probability ?? 0,
    precipitationMm: current.precipitation ?? 0,
    windKmh: Math.round(current.wind_speed_10m),
    humidity: current.relative_humidity_2m,
    source: 'live',
  }
  cacheSet(key, now, TTL.weather)
  return now
}

export async function getForecast(lat: number, lng: number): Promise<WeatherDay[]> {
  const key = `fc:${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = cacheGet<WeatherDay[]>(key)
  if (cached) return cached
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto'
  const { data } = await getJson<OpenMeteoResponse>(url)
  const daily = data.daily
  if (!daily) return []
  const days = daily.time.map((date, index) => ({
    date,
    maxC: Math.round(daily.temperature_2m_max[index]),
    minC: Math.round(daily.temperature_2m_min[index]),
    precipitationProbability: daily.precipitation_probability_max[index] ?? 0,
    condition: weatherLabel(daily.weather_code[index]),
    weatherCode: daily.weather_code[index],
  }))
  cacheSet(key, days, TTL.weather)
  return days
}

export async function getWeatherBundle(lat: number, lng: number): Promise<WeatherBundle> {
  const key = `wxb:${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = cacheGet<WeatherBundle>(key)
  if (cached) return cached
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m,relative_humidity_2m' +
    '&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m' +
    '&forecast_days=2&timezone=auto'
  const { data } = await getJson<OpenMeteoResponse>(url)
  const current = data.current
  if (!current) throw new Error('empty')
  const now: WeatherNow = {
    temperatureC: Math.round(current.temperature_2m),
    condition: weatherLabel(current.weather_code),
    weatherCode: current.weather_code,
    precipitationProbability: current.precipitation_probability ?? 0,
    precipitationMm: current.precipitation ?? 0,
    windKmh: Math.round(current.wind_speed_10m),
    humidity: current.relative_humidity_2m,
    source: 'live',
  }
  const hourly: WeatherHour[] = (data.hourly?.time ?? []).slice(0, 24).map((time, index) => {
    const code = data.hourly?.weather_code[index] ?? 0
    return {
      time,
      temperatureC: Math.round(data.hourly?.temperature_2m[index] ?? now.temperatureC),
      precipitationMm: data.hourly?.precipitation[index] ?? 0,
      precipitationProbability: data.hourly?.precipitation_probability[index] ?? 0,
      weatherCode: code,
      windKmh: Math.round(data.hourly?.wind_speed_10m[index] ?? now.windKmh),
      condition: weatherLabel(code),
    }
  })
  const bundle: WeatherBundle = { now, hourly, lat, lng }
  cacheSet(key, bundle, TTL.weather)
  return bundle
}
