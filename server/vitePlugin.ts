import type { Plugin } from 'vite'
import { handleTravelRequest } from './httpHandler'
import { handleNugenRequest } from './nugen/http'
import { refreshNugenState } from './nugen/ensure'

export function tripflowTravelPlugin(): Plugin {
  return {
    name: 'tripflow-travel-api',
    configureServer(server) {
      void refreshNugenState().catch((error) => {
        console.warn('[nugen] status refresh:', error instanceof Error ? error.message : error)
      })
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/nugen') || req.url?.startsWith('/api/travel/nugen')) {
          void handleNugenRequest(req, res)
          return
        }
        if (!req.url?.startsWith('/api/travel')) {
          next()
          return
        }
        void handleTravelRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/nugen') || req.url?.startsWith('/api/travel/nugen')) {
          void handleNugenRequest(req, res)
          return
        }
        if (!req.url?.startsWith('/api/travel')) {
          next()
          return
        }
        void handleTravelRequest(req, res)
      })
    },
  }
}
