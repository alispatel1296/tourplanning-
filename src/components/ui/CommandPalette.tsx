import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { globalSearch, type SearchGroup } from '@/services/search/search'
import { searchLocalBusinesses } from '@/services/travel/TravelDataService'
import type { Trip, User } from '@/types'

export interface CommandItem {
  id: string
  label: string
  hint: string
  to: string
}

const EMPTY_TRIPS: Trip[] = []
const EMPTY_PEOPLE: User[] = []

export function CommandPalette({
  open,
  onClose,
  items,
  trips = EMPTY_TRIPS,
  people = EMPTY_PEOPLE,
}: {
  open: boolean
  onClose: () => void
  items: CommandItem[]
  trips?: Trip[]
  people?: User[]
}) {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const navigate = useNavigate()
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  )

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    if (!open || query.trim().length < 3) {
      setGroups([])
      return
    }
    const handle = window.setTimeout(() => {
      void globalSearch(query, trips, people).then(async (base) => {
        try {
          const live = await searchLocalBusinesses(query)
          if (!live.items.length) {
            setGroups(base)
            return
          }
          setGroups([
            ...base,
            {
              id: 'serp',
              label: 'WEB · SERPAPI',
              items: live.items.slice(0, 5).map((item) => ({
                id: item.id,
                label: item.name,
                hint: item.location ?? item.sourceLabel,
                to: '/traveler/trips/trip-amd-goa',
              })),
            },
          ])
        } catch {
          setGroups(base)
        }
      })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [open, query, trips, people])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Close command palette"
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to a trip, page, or booking"
                className="h-12 w-full text-sm outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2 app-scrollbar">
              {groups.map((group) => (
                <div key={group.id} className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
                  {group.items.map((item) => (
                    <button
type="button"                       key={item.id}
                      onClick={() => {
                        if (item.to) navigate(item.to)
                        onClose()
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="meta">{item.hint}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && groups.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">No matches for that search.</p>
              ) : (
                filtered.map((item) => (
                  <button
type="button"                     key={item.id}
                    onClick={() => {
                      navigate(item.to)
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="meta">{item.hint}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
