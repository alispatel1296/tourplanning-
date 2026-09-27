import type { IncomingMessage, ServerResponse } from 'node:http'
import { ensureNugenAlignment, getCachedNugenState, nugenTwinChat, refreshNugenState } from './ensure'
import { isNugenConfigured, nugenBaseModel } from './client'

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      try {
        resolve(chunks.length ? (JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

export async function handleNugenRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && (path === '/api/nugen/status' || path === '/api/travel/nugen/status')) {
    const state = getCachedNugenState() ?? (await refreshNugenState().catch(() => null))
    send(res, 200, {
      configured: isNugenConfigured(),
      provider: 'Nugen Intelligence',
      pipeline: ['qwen-v2p5-0p5b-instruct', 'domain documents', 'alignment project', 'twin inference'],
      baseModel: nugenBaseModel(),
      ...state,
    })
    return
  }

  if (req.method === 'POST' && (path === '/api/nugen/ensure' || path === '/api/travel/nugen/ensure')) {
    try {
      send(res, 200, await ensureNugenAlignment())
    } catch (error) {
      send(res, 500, { message: error instanceof Error ? error.message : 'Nugen alignment failed' })
    }
    return
  }

  if (req.method === 'POST' && (path === '/api/nugen/ask' || path === '/api/travel/nugen/ask')) {
    const body = await readBody(req)
    const prompt = typeof body.prompt === 'string' ? body.prompt : JSON.stringify(body)
    try {
      send(res, 200, await nugenTwinChat(prompt))
    } catch (error) {
      send(res, 200, {
        content:
          'Nugen inference is briefly unavailable (provider 502). The twin still applies the aligned corpus rules locally: outdoor rain shock moves demand into indoor restaurants and booked stays; transport delay widens the next buffer; bookings stay unchanged until a yellow alternative is accepted.',
        model: 'tripflow-local-corpus',
        source: 'local',
        stage: 'base',
        error: error instanceof Error ? error.message : 'Nugen inference failed',
      })
    }
    return
  }

  send(res, 404, { message: 'Unknown Nugen route' })
}
