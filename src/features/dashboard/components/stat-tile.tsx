interface StatTileProps {
  label: string
  value: string
  /** A short line under the value: what it is measured against. */
  hint?: string | undefined
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}
