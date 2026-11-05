import { CircleAlert } from 'lucide-react'

/** What went wrong with the whole form (not one field), read out as soon as it shows up. */
export function FormError({ message }: { message: string | undefined }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}
