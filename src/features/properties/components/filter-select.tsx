import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

interface FilterSelectProps<T extends string> {
  label: string
  /** Shown when nothing is picked. */
  allLabel: string
  value: T | undefined
  options: Record<T, string>
  onChange: (value: T | undefined) => void
}

/** A native select, labelled and pill-shaped, for one filter dimension. */
export function FilterSelect<T extends string>({ label, allLabel, value, options, onChange }: FilterSelectProps<T>) {
  const id = useId()
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
        className="h-10 w-full appearance-none rounded-full border border-input bg-card pr-9 pl-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">{allLabel}</option>
        {(Object.entries(options) as [T, string][]).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
