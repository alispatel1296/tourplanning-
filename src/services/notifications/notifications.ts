export type RealtimeKind = 'poll' | 'sse' | 'websocket'

export interface RealtimeAdapter {
  kind: RealtimeKind
  start: (onTick: () => void) => () => void
}

/** Simplest reliable mechanism today: polling. Swap for SSE/WebSocket later. */
export function createPollAdapter(intervalMs = 20000): RealtimeAdapter {
  return {
    kind: 'poll',
    start(onTick) {
      const id = window.setInterval(onTick, intervalMs)
      return () => window.clearInterval(id)
    },
  }
}
