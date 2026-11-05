import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface ContractFormPageProps {
  title: string
  description: string
  back: LinkProps
  children: ReactNode
}

/** The frame around the contract forms, for creating and for editing. */
export function ContractFormPage({ title, description, back, children }: ContractFormPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-8 sm:pt-10">
      <Link {...back} className="inline-flex items-center gap-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </main>
  )
}
