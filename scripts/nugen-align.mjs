import { createReadStream, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'

const KEY = process.env.NUGEN_API_KEY || 'nugen-a501f924851cd443'
const BASE = 'https://api.nugen.in'
const MODEL = process.env.NUGEN_BASE_MODEL || 'qwen-v2p5-0p5b-instruct'
const NAME = 'TripFlow Weather Twin'
const here = dirname(fileURLToPath(import.meta.url))
const corpusDir = join(here, '..', 'server', 'nugen', 'corpus')
const statePath = join(here, '..', 'server', 'nugen', 'alignment-state.json')

async function api(path, init = {}) {
  const headers = { Authorization: `Bearer ${KEY}`, accept: 'application/json', ...(init.headers || {}) }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) throw new Error(`${res.status} ${path} ${JSON.stringify(data).slice(0, 500)}`)
  return data
}

async function streamToBlob(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return new Blob([Buffer.concat(chunks)], { type: 'text/plain' })
}

async function main() {
  console.log('Listing existing alignments...')
  let listed
  try {
    listed = await api('/api/v3/alignment-projects/list?limit=20')
    console.log(JSON.stringify(listed, null, 2))
  } catch (error) {
    console.log('list failed', error.message)
    listed = { alignment_projects: [] }
  }

  const existing = (listed.alignment_projects || []).find(
    (row) => row.alignment_name === NAME && !/failed|stopped/i.test(row.status || ''),
  )
  if (existing) {
    const status = await api(`/api/v3/alignment-projects/${existing.alignment_id}/status`)
    const detail = await api(`/api/v3/alignment-projects/${existing.alignment_id}`).catch(() => ({}))
    const state = {
      documentIds: detail.document_ids || [],
      alignmentId: existing.alignment_id,
      alignmentName: NAME,
      baseModel: existing.base_model_id || MODEL,
      alignedModelId: detail.model_id || existing.alignment_id,
      alignmentStatus: status.status,
      deploymentStatus: detail.deployment_status,
      updatedAt: new Date().toISOString(),
    }
    writeFileSync(statePath, JSON.stringify(state, null, 2))
    console.log('Reusing alignment', state)
    return
  }

  const files = [
    ['01-weather-twin-playbook.txt', 'Weather Twin Playbook'],
    ['02-tripflow-operating-rules.txt', 'TripFlow Operating Rules'],
    ['03-cascade-whatif-qa.txt', 'Cascade What-If Q&A'],
  ]
  const form = new FormData()
  for (const [file, name] of files) {
    const blob = await streamToBlob(createReadStream(join(corpusDir, file)))
    form.append('files', blob, basename(file))
    form.append('names', name)
  }
  form.append('categories', 'tripflow-weather-twin')
  console.log('Uploading domain corpus...')
  const uploaded = await api('/api/v3/documents/create', { method: 'POST', body: form })
  console.log('documents', uploaded)

  const ids = uploaded.document_ids || []
  for (let i = 0; i < 15; i += 1) {
    const rows = await Promise.all(
      ids.map((id) => api(`/api/v3/documents/${id}/status`).catch((error) => ({ status: 'PROCESSING', error: error.message }))),
    )
    console.log('doc status', rows)
    if (rows.every((row) => /ready|completed|success/i.test(String(row.status || '')))) break
    await new Promise((r) => setTimeout(r, 2500))
  }

  console.log('Creating alignment project...')
  const created = await api('/api/v3/alignment-projects/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alignment_name: NAME,
      base_model_id: MODEL,
      document_ids: ids,
      description:
        'Domain alignment for TripFlow weather-driven hospitality Digital Twin: Indian corridors, INR, cascade rules, what-if vs live, no invented inventory.',
    }),
  })
  console.log('created', created)
  const state = {
    documentIds: ids,
    alignmentId: created.alignment_id,
    alignmentName: NAME,
    baseModel: MODEL,
    alignmentStatus: created.status || 'PROCESSING',
    updatedAt: new Date().toISOString(),
  }
  writeFileSync(statePath, JSON.stringify(state, null, 2))
  console.log('saved', statePath)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
