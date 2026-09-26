/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPS_API_KEY?: string
  readonly VITE_WEATHER_API_KEY?: string
  readonly VITE_PLACES_API_KEY?: string
  readonly VITE_AI_API_KEY?: string
  readonly VITE_GEOAPIFY_KEY?: string
  readonly VITE_CURRENCY_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
