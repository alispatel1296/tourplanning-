import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

function monthGrid(cursor: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  })
}

export function Calendar({
  value,
  onChange,
}: {
  value?: Date
  onChange?: (date: Date) => void
}) {
  const [cursor, setCursor] = useState(value ?? new Date(2026, 9, 15))
  const days = useMemo(() => monthGrid(cursor), [cursor])

  return (
    <Card className="w-[300px]">
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <p className="text-sm font-semibold">{format(cursor, 'MMMM yyyy')}</p>
        <IconButton label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const selected = value ? isSameDay(day, value) : false
          return (
            <button
type="button"               key={day.toISOString()}
              onClick={() => onChange?.(day)}
              className={cn(
                'h-8 rounded-md text-[12px]',
                isSameMonth(day, cursor) ? 'text-ink' : 'text-slate-300',
                selected && 'bg-brand-700 text-white',
                !selected && 'hover:bg-brand-50',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export function DatePicker({
  value,
  onChange,
  label,
}: {
  value?: Date
  onChange: (date: Date) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <p className="mb-1.5 text-[12px] font-medium text-slate-500">{label}</p>
      <Button type="button" variant="secondary" className="w-full justify-start" onClick={() => setOpen((v) => !v)}>
        {value ? format(value, 'd MMM yyyy') : 'Select date'}
      </Button>
      {open ? (
        <div className="absolute z-20 mt-2">
          <Calendar
            value={value}
            onChange={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start?: Date
  end?: Date
  onChange: (range: { start: Date; end?: Date }) => void
}) {
  const [cursor, setCursor] = useState(start ?? new Date(2026, 9, 1))
  const days = useMemo(() => monthGrid(cursor), [cursor])

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Travel dates</p>
        <div className="flex gap-1">
          <IconButton label="Previous" onClick={() => setCursor(addMonths(cursor, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton label="Next" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <p className="mb-3 text-sm text-slate-600">{format(cursor, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day) => {
          const inRange =
            start && end
              ? isWithinInterval(day, { start, end })
              : start
                ? isSameDay(day, start)
                : false
          const edge = (start && isSameDay(day, start)) || (end && isSameDay(day, end))
          return (
            <button
type="button"               key={day.toISOString()}
              onClick={() => {
                if (!start || (start && end)) onChange({ start: day })
                else if (day < start) onChange({ start: day })
                else onChange({ start, end: day })
              }}
              className={cn(
                'h-8 rounded-md text-[12px]',
                isSameMonth(day, cursor) ? 'text-ink' : 'text-slate-300',
                inRange && 'bg-brand-50',
                edge && 'bg-brand-700 text-white',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
      <p className="meta mt-3">
        {start && end
          ? `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
          : 'Select a start and end date'}
      </p>
    </Card>
  )
}
