import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

interface OverlayBase {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: OverlayBase & { wide?: boolean }) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              'relative w-full rounded-2xl border border-line bg-white p-5 shadow-xl',
              wide ? 'max-w-3xl' : 'max-w-lg',
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <IconButton label="Close" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

export function Dialog(props: OverlayBase) {
  return <Modal {...props} />
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  leading,
  badge,
}: OverlayBase & { side?: 'right' | 'left'; leading?: ReactNode; badge?: ReactNode }) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: side === 'right' ? 28 : -28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: side === 'right' ? 28 : -28, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'absolute top-0 h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl app-scrollbar',
              side === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {leading}
                <h3 className="font-display text-lg font-semibold leading-snug">{title}</h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {badge}
                <IconButton label="Close" onClick={onClose}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            {children}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

export function ConfirmationDialog({
  open,
  onClose,
  title,
  body,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  body: string
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
type="button"           variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
