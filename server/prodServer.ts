import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyCors } from './cors'
import { handleTravelRequest } from './httpHandler'
import { handleNugenRequest } from './nugen/http'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 4173)

const mime: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function safeFile(urlPath: string) {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/')
  const resolved = path.resolve(dist, `.${clean}`)
  if (!resolved.startsWith(dist)) return path.join(dist, 'index.html')
  return resolved
}

const server = createServer(async (req, res) => {
  applyCors(req, res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = req.url ?? '/'
  try {
    if (url.startsWith('/api/nugen') || url.startsWith('/api/travel/nugen')) {
      await handleNugenRequest(req, res)
      return
    }
    if (url.startsWith('/api/travel')) {
      await handleTravelRequest(req, res)
      return
    }

    const filePath = safeFile(url)
    const file = await stat(filePath).catch(() => null)
    if (file?.isFile()) {
      res.setHeader('Content-Type', mime[path.extname(filePath)] ?? 'application/octet-stream')
      res.end(await readFile(filePath))
      return
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(await readFile(path.join(dist, 'index.html')))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(error instanceof Error ? error.message : 'Server error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[tripflow] listening on ${port}`)
})
