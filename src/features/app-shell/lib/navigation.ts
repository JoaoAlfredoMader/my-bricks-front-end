import {
  Building2,
  CalendarDays,
  FileSignature,
  LayoutDashboard,
  type LucideIcon,
  Users,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  /** Absent while the screen is not built yet. */
  to?: '/app'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Painel', icon: LayoutDashboard, to: '/app' },
  { label: 'Imóveis', icon: Building2 },
  { label: 'Contratos', icon: FileSignature },
  { label: 'Reservas', icon: CalendarDays },
  { label: 'Finanças', icon: Wallet },
  { label: 'Clientes', icon: Users },
]
