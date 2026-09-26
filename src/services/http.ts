import type { ServiceError } from '@/services/errors'

export interface HttpResult<T> {
  data: T
  latencyMs: number
}

const DEFAULT_TIMEOUT = 12000

export async function getJson<T>(
  url: string,
  options: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<HttpResult<T>> {
  const started = performance.now()
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
    const latencyMs = Math.round(performance.now() - started)
    if (response.status === 429) throw makeError('rate_limit', 'This live service is busy. Try again in a moment.')
    if (response.status === 401 || response.status === 403) {
      throw makeError('unauthorized', 'This live service rejected the request. Check API credentials.')
    }
    if (!response.ok) throw makeError('provider', 'We could not load live data right now.')
    const data = (await response.json()) as T
    return { data, latencyMs }
  } catch (error) {
    if ((error as ServiceError).code) throw error
    if ((error as Error).name === 'AbortError') throw makeError('timeout', 'The live service took too long to respond.')
    throw makeError('network', 'We could not reach the live service. Check your connection.')
  } finally {
    window.clearTimeout(timer)
  }
}

function makeError(code: ServiceError['code'], message: string): ServiceError {
  const error = new Error(message) as ServiceError
  error.code = code
  error.userMessage = message
  return error
}
