import { useEffect, useState } from 'react'
import { COVER_FALLBACK } from '@/lib/covers'
import { cn } from '@/lib/cn'

export function CoverImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  return (
    <img
      src={current}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => {
        if (current !== COVER_FALLBACK) setCurrent(COVER_FALLBACK)
      }}
    />
  )
}
