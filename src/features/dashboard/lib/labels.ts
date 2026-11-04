import type { PropertyStatus, UsageType } from '../api/portfolio-kpis'

interface StatusStyle {
  /** One property: "Alugado". */
  label: string
  /** The group: "Alugados". */
  group: string
  /** Categorical slot, in this fixed order (dataviz palette, validated on white). */
  color: string
  /** Ink for text set inside the color. */
  ink: string
}

/** The derived status of a property, in the order the split shows it. */
export const STATUS: Record<PropertyStatus, StatusStyle> = {
  rented: { label: 'Alugado', group: 'Alugados', color: 'var(--chart-1)', ink: '#fff' },
  vacant: { label: 'Vago', group: 'Vagos', color: 'var(--chart-2)', ink: '#fff' },
  own_use: { label: 'Uso próprio', group: 'Uso próprio', color: 'var(--chart-3)', ink: '#fff' },
  loan_for_use: { label: 'Comodato', group: 'Comodato', color: 'var(--chart-4)', ink: '#0b0b0b' },
}

export const STATUS_ORDER: PropertyStatus[] = ['rented', 'vacant', 'own_use', 'loan_for_use']

export const USAGE_LABEL: Record<UsageType, string> = {
  rental: 'Locação',
  short_stay: 'Temporada',
  agricultural_lease: 'Arrendamento rural',
  concession: 'Concessão',
  own_use: 'Uso próprio',
  loan_for_use: 'Comodato',
}
