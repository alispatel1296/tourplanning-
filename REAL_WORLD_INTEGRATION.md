# TripFlow AI — real-world integration

This document is the developer setup for live maps, routing, places, weather, currency, location, and AI. Do not put API keys in this file.

The product UI is unchanged. Services live under `src/services/*`. UI components never call third-party URLs directly.

## 1. APIs used

| Need | Provider | Why |
| --- | --- | --- |
| Interactive map tiles + markers + polylines | [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) | No key for development, markers, popups, zoom/pan, fit-to-route |
| Geocoding / reverse geocoding / place search | [Nominatim](https://nominatim.openstreetmap.org/) | Same OSM stack, free for light use, returns lat/lng/address |
| Driving / walking / cycling routes | [OSRM](https://project-osrm.org/) public router | Geometry + distance + duration; transit falls back to driving |
| Hotels / restaurants / activities | Nominatim search | Legal POI search; no scraping |
| Hotel availability | Provider abstraction | No approved booking API yet — **demo availability is labeled** |
| Weather | [Open-Meteo](https://open-meteo.com/) | No key, current + forecast, precipitation probability |
| Currency | [Open ER-API](https://www.exchangerate-api.com/docs/free) | Free, includes INR, no key, cacheable |
| AI ranking | Local ranker, optional OpenAI | AI proposes only; app validates; user/operator approves |
| Location | Browser Geolocation API | One-shot unless Live Location is enabled |

One OSM-centered stack covers maps, geocoding, routing, and places so we do not add ten vendors.

## SerpApi (travel data layer)

SerpApi is the **real-world discovery engine**. The browser never sees `SERPAPI_API_KEY`.

- Signup: https://serpapi.com/users/sign_up
- Server env: `SERPAPI_API_KEY=` in `.env.local` (no `VITE_` prefix)
- Frontend calls `TravelDataService` → `/api/travel/*` → `serpApiService`
- Engines actually used: `google`, `google_maps`, `google_hotels`, `google_flights`, `google_images`, `google_news`, `google_shopping`, `google_events`, `google_travel_explore`, `google_maps_reviews`
- Trains have **no SerpApi engine**. We use Google Search snippets and label them as search-derived, not live IRCTC.
- Monitor: `/operator/settings/integrations/serpapi`
- Missing key: the app stays up and shows “Live search is not configured.”
- Missing fields stay “Information unavailable” / “Price unavailable” — never invented.

## 2. Signup URLs

- OpenStreetMap / Nominatim: https://operations.osmfoundation.org/policies/nominatim/ (usage policy; no key)
- OSRM public demo: https://router.project-osrm.org/ (self-host for production)
- Open-Meteo: https://open-meteo.com/en/docs
- Open ER-API (INR FX): https://www.exchangerate-api.com/docs/free
- Optional OpenAI: https://platform.openai.com/api-keys
- Optional later maps upgrade: https://www.mapbox.com/, https://developers.google.com/maps, https://www.geoapify.com/

## 3. Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `VITE_MAPS_API_KEY` | No | Future paid maps provider | OSM tiles work without it |
| `VITE_GEOAPIFY_KEY` | No | Optional geocoder swap | |
| `VITE_WEATHER_API_KEY` | No | Future paid weather | Open-Meteo works without it |
| `VITE_PLACES_API_KEY` | No | Future paid places | Nominatim works without it |
| `VITE_AI_API_KEY` | No | `src/services/ai/ai.ts` | Browser-exposed. Production must proxy. |
| `VITE_CURRENCY_API_KEY` | No | Future paid FX | Open ER-API works without it |

There is no backend in this repo. Do not add `DATABASE_URL` or private tokens to `VITE_*` variables. `.env` is gitignored.

## 4. Required API permissions

- **Browser geolocation:** user gesture (“Use my location” / “Enable Live Location”). Continuous `watchPosition` only while Live Location is on.
- **Nominatim:** identify the app in production (Referer / contact). Max 1 request/second. We cache geocodes for 7 days.
- **OSM tiles:** attribution is shown on the map. Use your own tile host in production.
- **OpenAI (optional):** `chat.completions` only. Never invent hotels — the prompt is constrained to retrieved candidates.

## 5. Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open:

- Traveler map: `/traveler` dashboard, itinerary result, `/traveler/trips/:id` → **Map**
- Live weather + location: `/traveler/live/trip-amd-goa`
- Carry weather: `/traveler/carry`
- Integrations health: `/operator/settings/integrations`

No keys are required for maps, routing, weather, FX, or place search.

## 6. Free-tier / public-API limitations

- Nominatim and the public OSRM instance are **not** for high-volume production.
- Nominatim does not always return rating, phone, hours, or photos. Missing fields stay empty — we do not invent them.
- Hotel **availability and booking** are demo until a licensed booking API is approved.
- Public OSRM has no true transit graph; TripFlow falls back to driving and labels the fallback on the route object.
- Open-Meteo is location weather, not a severe-weather warning product.
- Open ER-API is a free exchange-rate snapshot (not a trading feed). We cache for 6 hours and tag demo fallback if it fails.

## 7. Production considerations

1. Self-host Nominatim / OSRM or buy Mapbox / Google / HERE and swap providers behind the existing interfaces.
2. Move `VITE_AI_API_KEY` off the client. Add a small backend proxy.
3. Use a licensed hotel booking API (`searchHotels` / `getHotelDetails` / `checkHotelAvailability`) and flip `source` from `demo` to `live`.
4. Cache weather 15–30 minutes, place details several hours, geocoding longer — already implemented in `src/services/cache.ts`.
5. Live Trip realtime today is local state + optional polling (`src/services/notifications/notifications.ts`). Swap for WebSockets/SSE later without changing the UI.
6. Respect OSM tile and Nominatim usage policies; add your own tile CDN.

## 8. Architecture (do not skip)

```
User prefs → real search → real candidates → AI rank/reason → feasibility → user/operator approve → itinerary update
```

Disruption pipeline:

```
Signal → affected node → feasibility → alternative search → AI recommendation → approval → itinerary update
```

Color semantics on the map stay TripFlow’s:

- Green: current route
- Yellow: alternative
- Red: disrupted
- Blue: transport / you are here
- Purple: AI recommendation / search pin

## 9. Health panel

`/operator/settings/integrations` tests Maps, Weather, Places, AI, and Currency and shows latency. Use **Test Connection** when something looks stale.
