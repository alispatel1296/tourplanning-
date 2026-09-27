import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-charcoal)]/90 shadow-sm',
  secondary: 'bg-white text-[var(--color-charcoal)] border border-[var(--color-soft-sand)] hover:bg-[var(--color-warm-ivory)]',
  ghost: 'bg-transparent text-[var(--color-charcoal)] hover:bg-[var(--color-warm-ivory)]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ai: 'bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90 shadow-sm',
  outline: 'border border-[var(--color-soft-sand)] bg-transparent text-[var(--color-charcoal)] hover:bg-[var(--color-warm-ivory)]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'dark'
}

export function IconButton({ label, tone = 'default', className, children, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        tone === 'dark'
          ? 'border-white/10 bg-white/5 text-[var(--color-warm-ivory)] hover:bg-white/10'
          : 'border-[var(--color-muted-gold)]/20 bg-transparent text-[var(--color-charcoal)] hover:bg-black/5',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
