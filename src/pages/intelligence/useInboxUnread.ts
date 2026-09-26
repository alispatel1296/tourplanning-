import { useEffect, useState } from 'react'
import { unreadCount } from '@/pages/intelligence/catalog'
import type { Role } from '@/types'

export function useInboxUnread(role: Extract<Role, 'traveler' | 'operator'>) {
  const [count, setCount] = useState(() => unreadCount(role))
  useEffect(() => {
    const sync = () => setCount(unreadCount(role))
    sync()
    window.addEventListener('tf-inbox', sync)
    return () => window.removeEventListener('tf-inbox', sync)
  }, [role])
  return count
}
