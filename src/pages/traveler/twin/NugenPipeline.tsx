import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiUrl } from '@/lib/api'
import { fetchNugenStatus } from '@/services/social/signals'
import type { TwinExplainResult } from '@/services/social/signals'

const STEPS = [
  { id: 'base', label: 'Base model', detail: 'qwen-v2p5-0p5b-instruct' },
  { id: 'docs', label: 'Domain corpus', detail: 'Weather twin + operating rules + what-if Q&A' },
  { id: 'align', label: 'Nugen alignment', detail: 'TripFlow Weather Twin project' },
  { id: 'infer', label: 'Twin inference', detail: 'Cascades, demand, delay, uncertainty' },
]

export function NugenPipeline({ aiMeta }: { aiMeta?: TwinExplainResult | null }) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setStatus(await fetchNugenStatus())
  }

  useEffect(() => {
    void load()
  }, [])

  const alignmentStatus = String(status?.alignmentStatus ?? 'unknown')
  const configured = Boolean(status?.configured)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="card-title">Nugen Intelligence pipeline</p>
          <p className="meta mt-1">Base model → domain documents → alignment → TripFlow twin inference</p>
        </div>
        <Badge tone={configured ? 'success' : 'warning'}>{configured ? 'Key present' : 'Not configured'}</Badge>
      </div>
      <ol className="mt-4 space-y-2">
        {STEPS.map((step, index) => (
          <li key={step.id} className="flex items-start gap-3 text-[13px]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-800">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{step.label}</p>
              <p className="text-slate-600">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
        <p>
          Documents: <strong>{Array.isArray(status?.documentIds) ? status.documentIds.length : 0} uploaded</strong>
        </p>
        <p>
          Alignment: <strong>{alignmentStatus}</strong>
        </p>
        <p>
          Inference: <strong>{aiMeta?.stage ?? (configured ? 'nugen glm-5p2' : 'pending')}</strong>
          {aiMeta?.model ? ` · ${aiMeta.model}` : ''}
        </p>
        {status?.benchmarkId ? (
          <p className="truncate">
            Benchmark: <strong>{String(status.benchmarkId)}</strong>
          </p>
        ) : null}
        {aiMeta?.confidence != null ? (
          <p>
            Nugen confidence: <strong>{Math.round(aiMeta.confidence)}</strong>
          </p>
        ) : null}
        {status?.alignmentId ? (
          <p className="sm:col-span-2 truncate text-slate-500">Project {String(status.alignmentId)}</p>
        ) : null}
        {status?.lastError ? <p className="sm:col-span-2 text-amber-800">{String(status.lastError)}</p> : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-3"
        loading={busy}
        onClick={async () => {
          setBusy(true)
          await fetch(apiUrl('/api/nugen/ensure'), { method: 'POST' })
          await load()
          setBusy(false)
        }}
      >
        Sync alignment
      </Button>
    </Card>
  )
}
