import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { demoCoordinators, demoVendors } from '@/data/demo'
import { useAppState } from '@/state/AppState'
import { useNavigate } from 'react-router-dom'
import { Brand } from '@/components/layout/Brand'
import { Avatar } from '@/components/ui/Avatar'
import { ToastStack } from '@/components/ui/Feedback'

export function CoordinatorHome() {
  const { user, signOut, toasts, dismissToast, pushToast } = useAppState()
  const navigate = useNavigate()
  const me = demoCoordinators[0]
  return (
    <FieldFrame
      userName={user?.name ?? 'Coordinator'}
      initials={user?.avatarInitials ?? 'RD'}
      onSignOut={() => {
        signOut()
        navigate('/login')
      }}
    >
      <PageHeader
        eyebrow="Coordinator"
        title="Goa field desk"
        description="Rohan’s shift covers West Coast Circuit arrivals from 17 October."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="meta">Status</p>
          <div className="mt-2">
            <StatusBadge status={me.status} />
          </div>
        </Card>
        <Card>
          <p className="meta">Active tours</p>
          <p className="mt-1 text-2xl font-semibold">{me.activeTours}</p>
        </Card>
        <Card>
          <p className="meta">Shift</p>
          <p className="mt-1 text-sm">{me.shift}</p>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="card-title">Today’s action</h2>
        <p className="mt-2 text-sm text-slate-600">
          Confirm whether Novotel can clear the waitlist or move Aarav Shah to Caravela before 17:00 IST.
        </p>
        <Button type="button" className="mt-3" onClick={() => pushToast({ title: 'Note sent to operator', body: 'Meera has the Caravela hold.' })}>
          Send ops note
        </Button>
      </Card>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </FieldFrame>
  )
}

export function VendorHome() {
  const { user, signOut, toasts, dismissToast, pushToast } = useAppState()
  const navigate = useNavigate()
  const vendor = demoVendors.find((item) => item.id === 'v-baga')
  return (
    <FieldFrame
      userName={user?.name ?? 'Vendor'}
      initials={user?.avatarInitials ?? 'AN'}
      onSignOut={() => {
        signOut()
        navigate('/login')
      }}
    >
      <PageHeader
        eyebrow="Vendor"
        title="Baga Water Sports"
        description="Holds and swell advisories for 18 October."
      />
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="card-title">{vendor?.name}</h2>
            <p className="meta mt-1">{vendor?.city}</p>
          </div>
          <StatusBadge status={vendor?.status ?? 'active'} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Combo for Aarav Shah is pending. Afternoon slot is still open if the morning swell holds.
        </p>
        <Button type="button" className="mt-3" onClick={() => pushToast({ title: 'Slot confirmed', body: '18 Oct 15:00 combo held.' })}>
          Confirm afternoon slot
        </Button>
      </Card>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </FieldFrame>
  )
}

function FieldFrame({
  children,
  userName,
  initials,
  onSignOut,
}: {
  children: ReactNode
  userName: string
  initials: string
  onSignOut: () => void
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4">
        <Brand />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:block">{userName}</span>
          <Avatar initials={initials} />
          <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
