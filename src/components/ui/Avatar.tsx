import { cn } from '@/lib/cn'

interface AvatarProps {
  initials: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export function Avatar({ initials, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      title={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-700 font-semibold text-white',
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}

export function AvatarGroup({ people }: { people: { initials: string; name: string }[] }) {
  return (
    <div className="flex -space-x-2">
      {people.map((person) => (
        <Avatar
          key={person.name}
          initials={person.initials}
          name={person.name}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
    </div>
  )
}
