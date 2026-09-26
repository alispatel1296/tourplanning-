export type ServiceErrorCode =
  | 'timeout'
  | 'rate_limit'
  | 'unauthorized'
  | 'network'
  | 'provider'
  | 'empty'
  | 'not_configured'

export interface ServiceError extends Error {
  code: ServiceErrorCode
  userMessage: string
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'userMessage' in error) {
    return String((error as ServiceError).userMessage)
  }
  return fallback
}

export function isServiceError(error: unknown): error is ServiceError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'userMessage' in error)
}
