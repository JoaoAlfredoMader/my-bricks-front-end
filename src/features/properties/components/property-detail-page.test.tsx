import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fakeApi, makePropertyRecord, makeSession } from '@/test/fake-api'
import { renderRoute } from '@/test/render-route'

const plain = (value: string | null | undefined) => value?.replace(/ /g, ' ')

/** The label/value pairs of one detail card, as the reader sees them. */
function card(title: string) {
  const section = screen.getByRole('region', { name: title })
  const labels = within(section).getAllByRole('term').map((term) => term.textContent)
  const values = within(section).getAllByRole('definition').map((value) => plain(value.textContent))
  return Object.fromEntries(labels.map((label, i) => [label, values[i]]))
}

describe('Property detail', () => {
  it('shows what the property is, where it is and its indicators', async () => {
    const property = makePropertyRecord({ clientId: 'client-1', ownershipPercentage: 50, agencyName: 'Imobiliária Central' })
    fakeApi({ session: makeSession(), properties: [property], clients: [{ id: 'client-1', name: 'Marina Prado' }] })
    renderRoute(`/app/imoveis/${property.id}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Apartamento Centro' })).toBeInTheDocument()
    expect(screen.getByText('Residencial · Apartamento · Locação')).toBeInTheDocument()
    expect(screen.getByText('Avenida Paulista, 1500 · apto 82')).toBeInTheDocument()
    expect(screen.getByText('Bela Vista · São Paulo, SP · 01310-100')).toBeInTheDocument()

    const indicators = screen.getByRole('region', { name: 'Indicadores do imóvel' })
    expect(plain(indicators.textContent)).toContain('Valor estimadoR$ 680 mil50% é seu')
    expect(plain(indicators.textContent)).toContain('Receita anualR$ 43,3 milAluguel do contrato ativo')
    expect(plain(indicators.textContent)).toContain('TIR3,2%Em 60 meses')

    expect(card('Características')).toMatchObject({ 'Área total': '78 m²', Quartos: '2', Suítes: '—', Conservação: 'Bom' })
    expect(await screen.findByText('Marina Prado')).toBeInTheDocument()
    expect(card('Proprietário e gestão')).toEqual({
      Cliente: 'Marina Prado',
      Participação: '50%',
      Imobiliária: 'Imobiliária Central',
    })
    expect(card('Aquisição')).toEqual({ Forma: 'Compra', Data: '14 de maio de 2021', Custo: 'R$ 520.000' })
  })

  it('shows manual rent and an irregular registry when there are any', async () => {
    const property = makePropertyRecord({
      rentalMode: 'manual',
      manualRental: { tenantName: 'João Lima', monthlyRentCents: 185_000, dueDay: 10 },
      legalRecord: {
        registrationStatus: 'irregular',
        irregularityDescription: 'Averbação pendente',
        registryNumber: null,
        registryOffice: null,
        notes: null,
      },
      notes: 'Próximo ao metrô.',
    })
    fakeApi({ session: makeSession(), properties: [property] })
    renderRoute(`/app/imoveis/${property.id}`)

    await screen.findByRole('heading', { level: 1, name: 'Apartamento Centro' })
    expect(card('Locação')).toMatchObject({ Inquilino: 'João Lima', 'Aluguel mensal': 'R$ 1.850,00', Vencimento: 'Dia 10' })
    expect(card('Documentação')).toMatchObject({ Registro: 'Irregular: Averbação pendente', Seguro: 'Sem seguro' })
    expect(screen.getByRole('region', { name: 'Observações' })).toHaveTextContent('Próximo ao metrô.')
  })

  it('leaves out sections with nothing to show', async () => {
    const property = makePropertyRecord({ acquisition: null, financing: null })
    fakeApi({ session: makeSession(), properties: [property] })
    renderRoute(`/app/imoveis/${property.id}`)

    await screen.findByRole('heading', { level: 1, name: 'Apartamento Centro' })
    expect(screen.queryByRole('region', { name: 'Aquisição' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Financiamento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Observações' })).not.toBeInTheDocument()
  })

  it('says so when the property is not in this portfolio', async () => {
    fakeApi({ session: makeSession(), properties: [] })
    renderRoute('/app/imoveis/00000000-0000-4000-8000-999999999999')

    expect(await screen.findByRole('heading', { level: 1, name: 'Imóvel não encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todos os imóveis' })).toHaveAttribute('href', '/app/imoveis')
  })
})
