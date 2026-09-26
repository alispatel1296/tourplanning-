import type { Plugin } from 'vite'
import { handleTravelRequest } from './httpHandler'

export function tripflowTravelPlugin(): Plugin {
  return {
    name: 'tripflow-travel-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/travel')) {
          next()
          return
        }
        void handleTravelRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/travel')) {
          next()
          return
        }
        void handleTravelRequest(req, res)
      })
    },
  }
}
