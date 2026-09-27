import type { IncomingMessage, ServerResponse } from 'node:http'

function allowedOrigin(origin: string | undefined) {
  if (!origin) return null
  const configured = (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (configured.includes(origin)) return origin
  if (/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) return origin
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin
  return null
}

export function applyCors(req: IncomingMessage, res: ServerResponse) {
  const origin = allowedOrigin(req.headers.origin)
  if (!origin) return false
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
  return true
}
