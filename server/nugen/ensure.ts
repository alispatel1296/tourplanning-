import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chatComplete,
  createAlignment,
  deployAlignedModel,
  getAlignmentProject,
  getAlignmentStatus,
  getDocumentStatus,
  isNugenConfigured,
  listAlignedModels,
  listAlignmentProjects,
  nugenBaseModel,
  nugenChatModel,
  TWIN_SYSTEM,
  uploadDocuments,
} from './client'

export interface NugenState {
  documentIds: string[]
  alignmentId?: string
  alignmentName: string
  baseModel: string
  alignedModelId?: string
  alignmentStatus?: string
  deploymentStatus?: string
  benchmarkId?: string
  lastError?: string
  updatedAt: string
}

const here = dirname(fileURLToPath(import.meta.url))
const STATE_PATH = join(here, 'alignment-state.json')
export const ALIGNMENT_NAME = 'TripFlow Weather Twin v2'

function loadState(): NugenState | null {
  if (!existsSync(STATE_PATH)) return null
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as NugenState
  } catch {
    return null
  }
}

function saveState(state: NugenState) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickModelId(record: Record<string, unknown>): string | undefined {
  const keys = ['model_id', 'aligned_model_id', 'deployed_model_id']
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

async function waitDocuments(ids: string[]) {
  for (let i = 0; i < 20; i += 1) {
    const rows = await Promise.all(
      ids.map(async (id) => {
        try {
          return await getDocumentStatus(id)
        } catch {
          return { status: 'PROCESSING' }
        }
      }),
    )
    if (rows.every((row) => /ready|completed|success/i.test(String(row.status ?? '')))) return
    await sleep(3000)
  }
}

export async function refreshNugenState(): Promise<NugenState> {
  const current = loadState() ?? {
    documentIds: [],
    alignmentName: ALIGNMENT_NAME,
    baseModel: nugenBaseModel(),
    updatedAt: new Date().toISOString(),
  }
  if (!isNugenConfigured()) {
    current.lastError = 'NUGEN_API_KEY missing'
    current.updatedAt = new Date().toISOString()
    return current
  }

  try {
    const listed = await listAlignmentProjects()
    const mine =
      listed.alignment_projects?.find(
        (row) => row.alignment_name === ALIGNMENT_NAME && !/failed|stopped/i.test(row.status),
      ) ??
      listed.alignment_projects?.find((row) => row.alignment_id === current.alignmentId && !/failed|stopped/i.test(row.status))
    if (mine) {
      current.alignmentId = mine.alignment_id
      current.alignmentStatus = mine.status
      current.baseModel = mine.base_model_id ?? current.baseModel
    }

    if (current.alignmentId) {
      const status = await getAlignmentStatus(current.alignmentId)
      current.alignmentStatus = status.status
      const detail = await getAlignmentProject(current.alignmentId).catch(() => ({}))
      current.alignedModelId = pickModelId(detail) ?? current.alignedModelId ?? current.alignmentId
    }

    const models = await listAlignedModels().catch(() => ({ domain_aligned_models: [] }))
    const deployed = models.domain_aligned_models?.find((row) => row.deployment_status === 'DEPLOYED')
    const ready = models.domain_aligned_models?.find((row) => /ready|deployed/i.test(row.deployment_status))
    if (deployed) {
      current.alignedModelId = deployed.model_id
      current.deploymentStatus = deployed.deployment_status
    } else if (ready) {
      current.alignedModelId = ready.model_id
      current.deploymentStatus = ready.deployment_status
    }
    current.lastError = undefined
  } catch (error) {
    current.lastError = error instanceof Error ? error.message : 'nugen refresh failed'
  }
  current.updatedAt = new Date().toISOString()
  saveState(current)
  return current
}

export async function ensureNugenAlignment(): Promise<NugenState> {
  if (!isNugenConfigured()) {
    return {
      documentIds: [],
      alignmentName: ALIGNMENT_NAME,
      baseModel: nugenBaseModel(),
      lastError: 'NUGEN_API_KEY missing',
      updatedAt: new Date().toISOString(),
    }
  }

  let state = await refreshNugenState()
  if (state.alignmentId && !/failed|stopped/i.test(state.alignmentStatus ?? '')) {
    if (/ready|evaluated/i.test(state.alignmentStatus ?? '') && state.alignedModelId && state.deploymentStatus !== 'DEPLOYED') {
      try {
        await deployAlignedModel(state.alignedModelId)
        state.deploymentStatus = 'DEPLOYING'
        saveState({ ...state, updatedAt: new Date().toISOString() })
      } catch (error) {
        state.lastError = error instanceof Error ? error.message : 'deploy failed'
        saveState(state)
      }
    }
    return state
  }

  if (!state.documentIds.length) {
    const corpus = [
      join(here, 'corpus', '01-weather-twin-playbook.txt'),
      join(here, 'corpus', '02-tripflow-operating-rules.txt'),
      join(here, 'corpus', '03-cascade-whatif-qa.txt'),
    ]
    const names = ['Weather Twin Playbook', 'TripFlow Operating Rules', 'Cascade What-If Q&A']
    try {
      const uploaded = await uploadDocuments(corpus, names)
      state.documentIds = uploaded.document_ids
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const reused = message.match(/document_01[a-z0-9]+/gi)
      if (reused?.length) state.documentIds = [...new Set(reused)]
      else throw error
    }
    await waitDocuments(state.documentIds)
  }
  const created = await createAlignment({
    name: ALIGNMENT_NAME,
    documentIds: state.documentIds,
    description:
      'Domain alignment for TripFlow weather-driven hospitality Digital Twin: Indian corridors, INR, cascade rules, what-if vs live, no invented inventory.',
  })
  state.alignmentId = created.alignment_id
  state.alignmentStatus = created.status ?? 'PROCESSING'
  state.baseModel = nugenBaseModel()
  state.updatedAt = new Date().toISOString()
  saveState(state)
  return state
}

export function inferenceModel(state: NugenState): { model: string; stage: 'aligned' | 'base' } {
  if (state.alignedModelId && /deployed|ready|evaluated/i.test(`${state.deploymentStatus} ${state.alignmentStatus}`)) {
    return { model: state.alignedModelId, stage: 'aligned' }
  }
  return { model: nugenChatModel(), stage: 'base' }
}

export async function nugenTwinChat(user: string): Promise<{
  content: string
  model: string
  confidence?: number
  source: 'nugen'
  stage: 'aligned' | 'base'
}> {
  const state = loadState() ?? (await refreshNugenState())
  const chosen = inferenceModel(state)
  const result = await chatComplete({ model: chosen.model, system: TWIN_SYSTEM, user })
  return { ...result, stage: chosen.stage }
}

export function getCachedNugenState(): NugenState | null {
  return loadState()
}
