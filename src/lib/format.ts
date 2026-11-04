/**
 * Formatting for what the API sends: money in integer cents (BRL), rates as fractions
 * (0.065 = 6,5%) and calendar dates as YYYY-MM-DD. Nothing here recalculates a value.
 */

const EMPTY = '—'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const wholeMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const compactMoney = [1, 2].map(
  (digits) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: digits }),
) as [Intl.NumberFormat, Intl.NumberFormat]
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const longDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

/** R$ 1.234,56 */
export function formatMoney(cents: number): string {
  return money.format(cents / 100)
}

/** R$ 1.235 — for tables where cents are noise. */
export function formatWholeMoney(cents: number): string {
  return wholeMoney.format(Math.round(cents / 100))
}

/** R$ 6,57 mi — for headline figures; `digits: 1` (R$ 325,1 mil) where space is tight. */
export function formatCompactMoney(cents: number, { digits = 2 }: { digits?: 1 | 2 } = {}): string {
  return compactMoney[digits - 1]!.format(cents / 100)
}

/** 6,5% from 0.065; a dash when the API could not compute the rate. */
export function formatRate(fraction: number | null): string {
  return fraction === null ? EMPTY : percent.format(fraction)
}

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** 2.400 m² */
export function formatArea(squareMeters: number): string {
  return `${number.format(squareMeters)} m²`
}

/** 9,5% a.a. from a rate the API sends in percent (financing), not as a fraction. */
export function formatAnnualPercent(percentPerYear: number): string {
  return `${number.format(percentPerYear)}% a.a.`
}

/** "em 23 horas", "em 40 minutos": how long until a moment, rounded down. */
export function formatTimeUntil(moment: Date, now: Date = new Date()): string {
  const minutes = Math.floor((moment.getTime() - now.getTime()) / 60_000)
  if (minutes < 1) return 'em instantes'
  if (minutes < 60) return minutes === 1 ? 'em 1 minuto' : `em ${minutes} minutos`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? 'em 1 hora' : `em ${hours} horas`
}

/** 4 de novembro de 2026, read as a calendar day (no time zone shift). */
export function formatDate(day: string): string {
  return longDate.format(new Date(`${day}T00:00:00Z`))
}
