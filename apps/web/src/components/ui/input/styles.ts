export const inputRoundedMap = {
  sm: 'rounded-xs',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  default: 'rounded-xl',
} as const

export const fieldSurfaceClassName = [
  'border border-black/[0.05] bg-paper',
  'shadow-[0_1px_1px_rgba(0,0,0,0.01),0_3px_10px_rgba(0,0,0,0.02)]',
  'dark:border-white/[0.08]',
  'dark:shadow-[0_1px_1px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.16)]',
].join(' ')

export const fieldFocusClassName = [
  'focus-visible:border-accent/20 focus-visible:bg-accent/[0.045]',
  'focus-visible:[background-image:linear-gradient(180deg,rgba(51,166,184,0.05),rgba(255,255,255,0)_26%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.8))]',
  'focus-visible:[box-shadow:inset_1px_9px_7px_-10px_var(--color-accent),0_1px_1px_rgba(0,0,0,0.01),0_3px_10px_rgba(0,0,0,0.02)]',
  'dark:focus-visible:[background-image:linear-gradient(180deg,rgba(51,166,184,0.08),rgba(255,255,255,0)_28%)]',
  'dark:focus-visible:[box-shadow:inset_1px_9px_7px_-10px_var(--color-accent),0_1px_1px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.16)]',
].join(' ')

export const fieldWrapperBaseClassName = [
  'group relative h-full overflow-hidden border border-black/[0.05] bg-paper',
  'shadow-[0_1px_1px_rgba(0,0,0,0.01),0_3px_10px_rgba(0,0,0,0.02)]',
  'duration-200',
  'dark:border-white/[0.08]',
  'dark:shadow-[0_1px_1px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.16)]',
].join(' ')

export const fieldWrapperFocusClassName = [
  'focus-within:border-accent/20 focus-within:bg-accent/[0.045]',
  'focus-within:[background-image:linear-gradient(180deg,rgba(51,166,184,0.05),rgba(255,255,255,0)_26%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.8))]',
  'focus-within:[box-shadow:inset_1px_9px_7px_-10px_var(--color-accent),0_1px_1px_rgba(0,0,0,0.01),0_3px_10px_rgba(0,0,0,0.02)]',
  'dark:focus-within:[background-image:linear-gradient(180deg,rgba(51,166,184,0.08),rgba(255,255,255,0)_28%)]',
  'dark:focus-within:[box-shadow:inset_1px_9px_7px_-10px_var(--color-accent),0_1px_1px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.16)]',
].join(' ')

export const noteFieldSurfaceClassName = [
  '[background-image:linear-gradient(180deg,rgba(255,250,239,0.72),rgba(255,255,255,0.88)_24%)]',
  'dark:[background-image:linear-gradient(180deg,rgba(255,255,255,0.048),rgba(255,255,255,0)_30%)]',
].join(' ')
