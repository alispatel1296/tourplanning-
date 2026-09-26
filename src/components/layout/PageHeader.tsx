import type { ReactNode } from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  crumbs,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  crumbs?: { label: string; to?: string }[]
}) {
  return (
    <div className="mb-6">
      {crumbs ? <Breadcrumb items={crumbs} /> : null}
      {eyebrow ? <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
