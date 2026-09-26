import { useEffect, useState } from 'react'
import { Hotel, Mail, MapPin, Phone, Plane, Sparkles, Trash2, TrainFront, UtensilsCrossed, Waves, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { checkHotelAvailability } from '@/services/hotels/hotels'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Overlay'
import { demoVendors } from '@/data/demo'
import { formatINR } from '@/lib/cn'
import {
  whyQuestion,
  whySelected,
  type NodeAlternative,
} from '@/pages/traveler/flow/alternatives'
import { displayCost, nodeDuration, type PathMode } from '@/pages/traveler/flow/model'
import { dossierFor } from '@/pages/traveler/flow/dossier'
import { useLiveAlternatives } from '@/hooks/useLiveAlternatives'
import type { TripNode } from '@/types'

const icons = {
  transport: TrainFront,
  stay: Hotel,
  food: UtensilsCrossed,
  activity: Waves,
  free: Waves,
}

export function NodeDrawer({
  node,
  path,
  open,
  onClose,
  onKeep,
  onCompare,
  onVisit,
  onExtend,
  onDelete,
}: {
  node: TripNode | null
  path: PathMode
  open: boolean
  onClose: () => void
  onKeep: () => void
  onCompare: (alt: NodeAlternative) => void
  onVisit?: () => void
  onExtend?: () => void
  onDelete?: () => void
}) {
  const [imgReady, setImgReady] = useState(false)
  const liveAlts = useLiveAlternatives(node)

  useEffect(() => {
    setImgReady(false)
    if (!node || node.category !== 'stay') {
      return
    }
    void checkHotelAvailability(node.id, Math.round(node.cost / 4))
  }, [node])

  if (!node) return null

  const vendor = demoVendors.find((item) => item.id === node.vendorId)
  const cost = displayCost(node, path)
  const rating = vendor?.rating ?? 4.5
  const waitlisted = node.id === 'n8' && node.title.includes('Novotel')
  const status = waitlisted ? 'waitlisted' : node.status === 'upcoming' ? 'confirmed' : node.status
  const Icon = node.category === 'transport' && node.title.toLowerCase().includes('indigo') ? Plane : icons[node.category]
  const alts = liveAlts.alts
  const file = dossierFor(node)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={node.title}
      leading={
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101823] text-[#3FA772] border border-slate-700">
          <Icon className="h-5 w-5" />
        </span>
      }
      badge={<StatusBadge status={status} />}
    >
      <motion.div
        key={`${node.id}-${node.title}-${node.cost}-${node.time}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4 text-[#F3EFE7]"
      >
        {/* Hero Photo & Gallery */}
        <div className="space-y-2">
          <img
            src={file.hero}
            alt=""
            className="h-40 w-full rounded-xl object-cover shadow-md"
            onLoad={() => setImgReady(true)}
          />
          {!imgReady ? <p className="text-[11px] text-slate-400">Loading imagery…</p> : null}
          <div className="grid grid-cols-3 gap-2">
            {file.gallery.map((src) => (
              <img key={src} src={src} alt="" className="h-16 w-full rounded-lg object-cover" />
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-[#3FA772]/20 border border-[#3FA772]/40 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#3FA772]">
            {file.typeLabel}
          </span>
          <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-300">
            {file.available}
          </span>
        </div>

        {/* Fact Grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-[#101823] p-3 text-sm">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating</span>
            <span className="font-extrabold text-[#E0C24C]">{rating.toFixed(1)} ★</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
            <span className="font-extrabold text-[#3FA772]">{cost ? formatINR(cost) : 'Included'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Timing</span>
            <span className="font-semibold text-[#F3EFE7]">{node.time}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
            <span className="font-semibold text-[#F3EFE7]">{nodeDuration(node)}</span>
          </div>
        </div>

        {/* Location & Map Preview */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Location</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-[#F3EFE7]">
            <MapPin className="mt-0.5 h-4 w-4 text-[#3FA772]" />
            {file.address}
          </p>
          <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-800">
            <iframe
              title={`Map of ${node.title}`}
              src={file.mapSrc}
              className="h-36 w-full border-0 opacity-90"
              loading="lazy"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Notes & Brief</p>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{node.notes}</p>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-slate-800 bg-[#101823] p-3 text-xs">
          <p className="font-extrabold uppercase text-slate-400 text-[10px]">Contact Details</p>
          <p className="mt-1 font-bold text-[#F3EFE7]">{file.vendorName}</p>
          <div className="mt-1 flex flex-col gap-1 text-slate-300">
            <a href={`tel:${file.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-[#3FA772]">
              <Phone className="h-3.5 w-3.5 text-[#3FA772]" />
              {file.phone}
            </a>
            <a href={`mailto:${file.email}`} className="flex items-center gap-1.5 hover:text-[#3FA772]">
              <Mail className="h-3.5 w-3.5 text-[#3FA772]" />
              {file.email}
            </a>
          </div>
        </div>

        {/* AI Recommendation Insights */}
        <div className="rounded-xl border border-[#3FA772]/30 bg-[#3FA772]/10 p-3.5">
          <div className="flex items-center gap-1.5 text-[#3FA772] mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">AI Read & Reviews</span>
          </div>
          <p className="text-xs font-bold text-[#F3EFE7]">{whyQuestion(node)}</p>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{whySelected(node)}</p>
        </div>

        {/* Alternatives Section */}
        {alts.length > 0 && (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#E0A63A] mb-2">
              Alternative Branches ({alts.length})
            </p>
            <div className="space-y-2">
              {alts.map((alt, idx) => (
                <div key={alt.id} className="rounded-xl border border-[#E0A63A]/40 bg-[#101823] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F3EFE7]">Option {String.fromCharCode(65 + idx)}: {alt.name}</span>
                    <span className="font-extrabold text-[#E0A63A]">{formatINR(alt.price)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-400">{alt.benefit} · {alt.timeImpact}</p>
                  <Button type="button" size="sm" variant="outline" className="mt-2.5 w-full border-[#E0A63A] text-[#E0A63A] hover:bg-[#E0A63A]/20" onClick={() => onCompare(alt)}>
                    Swap to Green Path
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col gap-2">
          {onVisit && node.status !== 'visited' && node.status !== 'disrupted' && (
            <Button
type="button"               className="w-full bg-[#3FA772] hover:bg-[#32895d] text-white font-bold"
              onClick={onVisit}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Mark Visited (Open Checklist)
            </Button>
          )}

          <div className="flex gap-2">
            {onExtend && (
              <Button type="button" variant="secondary" className="flex-1 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700" onClick={onExtend}>
                Add Hop
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="ghost" className="text-rose-400 hover:bg-rose-950/40" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="ghost" className="text-slate-400 hover:bg-slate-800" onClick={onKeep}>
              Keep current
            </Button>
          </div>
        </div>
      </motion.div>
    </Drawer>
  )
}
