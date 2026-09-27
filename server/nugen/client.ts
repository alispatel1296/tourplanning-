import { createReadStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'

const BASE = 'https://api.nugen.in'

export function nugenKey(): string {
  return (process.env.NUGEN_API_KEY ?? '').trim()
}

export function nugenBaseModel(): string {
  return (process.env.NUGEN_BASE_MODEL ?? 'qwen-v2p5-0p5b-instruct').trim()
}

export function nugenChatModel(): string {
  return (process.env.NUGEN_CHAT_MODEL ?? 'glm-5p2').trim()
}

export function isNugenConfigured(): boolean {
  return Boolean(nugenKey())
}

async function nugenFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const key = nugenKey()
  if (!key) throw new Error('NUGEN_NOT_CONFIGURED')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${key}`)
  if (!headers.has('accept')) headers.set('accept', 'application/json')
  return fetch(`${BASE}${path}`, { ...init, headers })
}

export async function nugenJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await nugenFetch(path, init)
  const text = await response.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!response.ok) {
    const detail =
      typeof data === 'object' && data && 'detail' in data ? JSON.stringify((data as { detail: unknown }).detail) : text
    throw new Error(`NUGEN_${response.status}:${detail.slice(0, 400)}`)
  }
  return data as T
}

export async function listAlignmentProjects() {
  return nugenJson<{ alignment_projects?: Array<{ alignment_id: string; alignment_name?: string; base_model_id?: string; status: string }> }>(
    '/api/v3/alignment-projects/list?limit=20',
  )
}

export async function listAlignedModels() {
  return nugenJson<{ domain_aligned_models?: Array<{ model_id: string; model_name: string; base_model_id: string; deployment_status: string }> }>(
    '/api/v3/models/aligned?limit=20',
  )
}

export async function getAlignmentStatus(alignmentId: string) {
  return nugenJson<{
    alignment_id: string
    status: string
    early_deployable?: boolean
    completed_at?: string | null
    progress?: number | null
  }>(`/api/v3/alignment-projects/${encodeURIComponent(alignmentId)}/status`)
}

export async function getAlignmentProject(alignmentId: string) {
  return nugenJson<Record<string, unknown>>(`/api/v3/alignment-projects/${encodeURIComponent(alignmentId)}`)
}

export async function getDocumentStatus(documentId: string) {
  return nugenJson<{ status?: string; document_id?: string }>(`/api/v3/documents/${encodeURIComponent(documentId)}/status`)
}

export async function uploadDocuments(files: string[], names: string[]) {
  const form = new FormData()
  for (const file of files) {
    const stream = createReadStream(file)
    const blob = await streamToBlob(stream)
    form.append('files', blob, basename(file))
  }
  for (const name of names) form.append('names', name)
  form.append('categories', 'tripflow-weather-twin')
  return nugenJson<{ document_ids: string[] }>('/api/v3/documents/create', { method: 'POST', body: form })
}

async function streamToBlob(stream: Readable): Promise<Blob> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return new Blob([Buffer.concat(chunks)], { type: 'text/plain' })
}

export async function createAlignment(input: { name: string; documentIds: string[]; description: string }) {
  return nugenJson<{ alignment_id: string; status?: string }>('/api/v3/alignment-projects/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alignment_name: input.name,
      base_model_id: nugenBaseModel(),
      document_ids: input.documentIds,
      description: input.description,
    }),
  })
}

export async function deployAlignedModel(modelId: string, early = false) {
  const suffix = early ? '?early=true' : ''
  return nugenJson<unknown>(`/api/v3/models/deploy-model/${encodeURIComponent(modelId)}${suffix}`, { method: 'POST' })
}

export async function chatComplete(input: {
  model: string
  system: string
  user: string
  maxTokens?: number
}): Promise<{ content: string; model: string; confidence?: number; source: 'nugen' }> {
  const models = [...new Set([input.model, nugenChatModel(), nugenBaseModel()])]
  let lastError: unknown
  for (const model of models) {
    try {
      const data = await nugenJson<{
        model?: string
        confidence_score?: number
        choices?: Array<{ message?: { content?: string } }>
      }>('/api/v3/inference/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.2,
          max_tokens: input.maxTokens ?? 400,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: `${input.user}\n\nReply in plain visible sentences only.` },
          ],
        }),
      })
      const content = data.choices?.[0]?.message?.content?.trim() ?? ''
      if (!content) throw new Error('NUGEN_EMPTY')
      return {
        content,
        model: data.model ?? model,
        confidence: typeof data.confidence_score === 'number' ? data.confidence_score : undefined,
        source: 'nugen',
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('NUGEN_EMPTY')
}

export const TWIN_SYSTEM = `You are TripFlow's domain-customized weather Digital Twin (Nugen). You were aligned on Horizon Trails / West Coast Circuit hospitality docs.

Hard rules: never invent hotels, trains, flights, or prices. INR only. Missing fields stay unavailable. What-if sliders do not change bookings until the traveler accepts a yellow indoor alternative.

Cascade rules from the alignment corpus:
- Rain >= 8 mm/h stresses beaches; >= 12 mm/h disrupts Baga water sports and Fort Aguada.
- Flood index >= 55 stresses outdoor and road; >= 70 disrupts them.
- Outdoor demand drop shifts into indoor restaurants and hotel occupancy in the same city.
- Transport delay compresses the next node's 30-minute buffer.
- SerpApi flood/rain/cancel stories raise confidence; they are corroboration, not quotes.

Write 3-5 short sentences naming only payload nodes. Quantify rain mm/h, delay minutes, demand percent, feasibility, uncertainty.`
