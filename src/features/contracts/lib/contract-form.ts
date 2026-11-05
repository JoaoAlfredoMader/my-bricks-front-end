import { z } from 'zod'
import { ApiError } from '@/lib/api/client'
import { dateToInput, moneyToInput, parseDate, parseInteger, parseMoney } from '@/lib/parse'
import type {
  AdjustmentIndex,
  Contract,
  ContractType,
  CreateContractRequest,
  Occupant,
  UpdateContractRequest,
} from '../api/queries'

/**
 * The contract forms keep what is typed as text and convert it only on submit, like the
 * property form: "1.850,00" becomes 185000 cents, "14/05/2024" becomes "2024-05-14".
 */

export interface RentTermsValues {
  monthlyRent: string
  dueDay: string
  adjustmentIndex: AdjustmentIndex | ''
}

export interface NewContractValues extends RentTermsValues {
  propertyId: string
  occupantMode: 'existing' | 'new'
  occupant: Occupant | null
  occupantName: string
  occupantDocument: string
  occupantEmail: string
  occupantPhone: string
  startDate: string
  endDate: string
  notes: string
}

export interface EditContractValues extends RentTermsValues {
  endDate: string
  notes: string
}

export const EMPTY_RENT_TERMS: RentTermsValues = { monthlyRent: '', dueDay: '', adjustmentIndex: '' }

export function emptyNewContract(propertyId = ''): NewContractValues {
  return {
    propertyId,
    occupantMode: 'new',
    occupant: null,
    occupantName: '',
    occupantDocument: '',
    occupantEmail: '',
    occupantPhone: '',
    startDate: '',
    endDate: '',
    notes: '',
    ...EMPTY_RENT_TERMS,
  }
}

export function fromContract(contract: Contract): EditContractValues {
  return {
    endDate: dateToInput(contract.endDate),
    notes: contract.notes ?? '',
    monthlyRent: moneyToInput(contract.rentTerms?.monthlyRentCents),
    dueDay: contract.rentTerms ? String(contract.rentTerms.dueDay) : '',
    adjustmentIndex: contract.rentTerms?.adjustmentIndex ?? '',
  }
}

const digits = (text: string) => text.replace(/\D/g, '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Issue = (path: string, message: string) => void

function checkRentTerms(values: RentTermsValues, issue: Issue) {
  const rent = parseMoney(values.monthlyRent)
  if (rent === null) issue('monthlyRent', 'Informe o aluguel mensal.')
  else if (rent === undefined || rent <= 0) issue('monthlyRent', 'Valor em reais, por exemplo 1.850,00.')

  const day = parseInteger(values.dueDay)
  if (day === null) issue('dueDay', 'Informe o dia do vencimento.')
  else if (day === undefined || day < 1 || day > 31) issue('dueDay', 'Um dia entre 1 e 31.')
}

/** Checks the end date alone, and against `startDate` (YYYY-MM-DD) when that is known. */
function checkEndDate(endDate: string, startDate: string | null | undefined, issue: Issue) {
  const end = parseDate(endDate)
  if (end === undefined) issue('endDate', 'Data no formato dd/mm/aaaa.')
  else if (end && startDate && end <= startDate) issue('endDate', 'O fim precisa ser depois do início.')
}

function issuer(context: z.RefinementCtx): Issue {
  return (path, message) => context.addIssue({ code: 'custom', path: [path], message })
}

/** `contractTypeOf` says what the chosen property takes; the rent fields only count for conventional ones. */
export function newContractSchema(contractTypeOf: (propertyId: string) => ContractType | undefined) {
  return z.custom<NewContractValues>().superRefine((values, context) => {
    const issue = issuer(context)
    if (!values.propertyId) issue('propertyId', 'Escolha o imóvel.')

    if (values.occupantMode === 'existing') {
      if (!values.occupant) issue('occupant', 'Escolha o ocupante, ou cadastre um novo.')
    } else {
      if (values.occupantName.trim().length < 2) issue('occupantName', 'Informe o nome (pelo menos 2 letras).')
      const document = digits(values.occupantDocument)
      if (values.occupantDocument.trim() && document.length !== 11 && document.length !== 14) {
        issue('occupantDocument', 'CPF com 11 dígitos ou CNPJ com 14.')
      }
      if (values.occupantEmail.trim() && !EMAIL.test(values.occupantEmail.trim())) {
        issue('occupantEmail', 'E-mail no formato nome@exemplo.com.')
      }
      const phone = digits(values.occupantPhone)
      if (values.occupantPhone.trim() && (phone.length < 10 || phone.length > 15)) {
        issue('occupantPhone', 'Telefone com DDD, por exemplo (11) 98765-4321.')
      }
    }

    const start = parseDate(values.startDate)
    if (start === null) issue('startDate', 'Informe o início.')
    else if (start === undefined) issue('startDate', 'Data no formato dd/mm/aaaa.')
    checkEndDate(values.endDate, start, issue)

    if (contractTypeOf(values.propertyId) === 'conventional') checkRentTerms(values, issue)
  })
}

export function editContractSchema(contract: Pick<Contract, 'contractType' | 'startDate'>) {
  return z.custom<EditContractValues>().superRefine((values, context) => {
    const issue = issuer(context)
    checkEndDate(values.endDate, contract.startDate, issue)
    if (contract.contractType === 'conventional') checkRentTerms(values, issue)
  })
}

const orNull = (text: string) => text.trim() || null

function rentTermsRequest(values: RentTermsValues) {
  return {
    monthlyRentCents: parseMoney(values.monthlyRent)!,
    dueDay: parseInteger(values.dueDay)!,
    adjustmentIndex: values.adjustmentIndex || null,
  }
}

/** Only call with values the schema accepted. */
export function toCreateRequest(values: NewContractValues, contractType: ContractType): CreateContractRequest {
  return {
    propertyId: values.propertyId,
    contractType,
    startDate: parseDate(values.startDate)!,
    endDate: parseDate(values.endDate) ?? null,
    notes: orNull(values.notes),
    ...(values.occupantMode === 'existing'
      ? { occupantId: values.occupant!.id }
      : {
          occupant: {
            name: values.occupantName.trim(),
            document: orNull(digits(values.occupantDocument)),
            email: orNull(values.occupantEmail),
            phone: orNull(digits(values.occupantPhone)),
          },
        }),
    rentTerms: contractType === 'conventional' ? rentTermsRequest(values) : null,
  }
}

/** Sends every editable field, so a cleared end date or note is removed. */
export function toUpdateRequest(values: EditContractValues, contractType: ContractType): UpdateContractRequest {
  return {
    endDate: parseDate(values.endDate) ?? null,
    notes: orNull(values.notes),
    ...(contractType === 'conventional' ? { rentTerms: rentTermsRequest(values) } : {}),
  }
}

/** Where a validation error from the API lands in the forms. */
export const REQUEST_PATH_TO_FIELD: Record<string, keyof NewContractValues> = {
  propertyId: 'propertyId',
  occupantId: 'occupant',
  'occupant.name': 'occupantName',
  'occupant.document': 'occupantDocument',
  'occupant.email': 'occupantEmail',
  'occupant.phone': 'occupantPhone',
  startDate: 'startDate',
  endDate: 'endDate',
  rentTerms: 'monthlyRent',
  'rentTerms.monthlyRentCents': 'monthlyRent',
  'rentTerms.dueDay': 'dueDay',
  'rentTerms.adjustmentIndex': 'adjustmentIndex',
  notes: 'notes',
}

/** The API answers in English; what a person can act on is said here in Portuguese. */
const API_MESSAGES: Record<string, string> = {
  'End date must be after the start date': 'O fim precisa ser depois do início.',
  'Invalid CPF or CNPJ': 'CPF ou CNPJ inválido.',
  'Enter the phone number with area code': 'Informe o telefone com DDD.',
  'Occupant not found': 'Este ocupante não existe mais.',
  'Send either occupantId or occupant': 'Escolha um ocupante cadastrado ou cadastre um novo.',
  'Conventional contracts need rent terms': 'Informe o aluguel.',
  'Short-stay contracts have no rent terms': 'Contratos de temporada não têm aluguel fixo.',
  'Property not found': 'Este imóvel não existe mais.',
  'A property for own use or loan for use cannot have contracts': 'Imóveis de uso próprio ou em comodato não têm contratos.',
  'Switch the property to contract rental mode before creating contracts':
    'O aluguel deste imóvel é informado no próprio imóvel. Edite-o e escolha "Do contrato ativo" em "De onde vem o aluguel" antes.',
  'Short-stay properties only take short-stay contracts': 'Imóveis de temporada só têm contratos de temporada.',
  'Short-stay contracts need a property with short-stay usage': 'Contratos de temporada são só para imóveis de temporada.',
  'Only active contracts can be changed': 'Só contratos ativos podem ser alterados.',
  'An occupant with this document already exists': 'Já existe um ocupante com este documento. Escolha-o em "Já cadastrado".',
  'The property already has an active contract': 'Outro contrato acabou de ficar ativo neste imóvel. Recarregue a página e tente de novo.',
  'Only conventional contracts have a PDF': 'Só contratos de locação têm PDF.',
}

export function apiMessageInPortuguese(message: string): string {
  return API_MESSAGES[message] ?? 'A API recusou este valor. Revise e tente de novo.'
}

/** For errors that do not belong to one field. */
export function contractErrorMessage(error: unknown, fallback = 'Não foi possível salvar agora. Verifique a conexão e tente de novo.'): string {
  if (error instanceof ApiError && API_MESSAGES[error.message]) return API_MESSAGES[error.message]!
  return fallback
}
