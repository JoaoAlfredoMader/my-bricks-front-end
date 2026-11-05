import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link, type LinkProps } from '@tanstack/react-router'
import { CircleAlert, Info } from 'lucide-react'
import {
  Controller,
  type FieldValues,
  FormProvider,
  type Path,
  type UseFormSetError,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { AffixInput } from '@/components/form/affix-input'
import { ChoiceGroup } from '@/components/form/choice-group'
import { Field } from '@/components/form/field'
import { FormSection } from '@/components/form/form-section'
import { OptionSelect } from '@/components/form/option-select'
import { Textarea } from '@/components/form/textarea'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Property } from '@/features/properties/api/queries'
import { ApiError } from '@/lib/api/client'
import { formatNumericDate } from '@/lib/format'
import { maskDate } from '@/lib/parse'
import { activeContractQueryOptions, type Contract, type CreateContractRequest, type UpdateContractRequest } from '../api/queries'
import {
  apiMessageInPortuguese,
  contractErrorMessage,
  type EditContractValues,
  editContractSchema,
  type NewContractValues,
  newContractSchema,
  REQUEST_PATH_TO_FIELD,
  type RentTermsValues,
  toCreateRequest,
  toUpdateRequest,
} from '../lib/contract-form'
import { ADJUSTMENT_INDEX_LABEL, CONTRACT_TYPE_LABEL, contractTypeFor } from '../lib/labels'
import { OccupantCombobox } from './occupant-combobox'

const ADJUSTMENT_OPTIONS = (Object.entries(ADJUSTMENT_INDEX_LABEL) as [RentTermsValues['adjustmentIndex'] & string, string][]).map(
  ([value, label]) => ({ value, label }),
)

/** Puts each API validation error under its field; the rest goes to the top of the form. */
function showApiError<T extends FieldValues>(failure: unknown, setError: UseFormSetError<T>, fields: readonly string[]) {
  const unplaced: string[] = []
  if (failure instanceof ApiError && failure.fieldErrors.length > 0) {
    for (const { path, message } of failure.fieldErrors) {
      const field = REQUEST_PATH_TO_FIELD[path]
      if (field && fields.includes(field)) setError(field as Path<T>, { message: apiMessageInPortuguese(message) }, { shouldFocus: true })
      else unplaced.push(apiMessageInPortuguese(message))
    }
  } else {
    unplaced.push(contractErrorMessage(failure))
  }
  if (unplaced.length > 0) setError('root', { message: unplaced.join(' ') })
}

function FormAlert({ message }: { message: string | undefined }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

function FormFooter({ cancel, submitLabel, submitting }: { cancel: LinkProps; submitLabel: string; submitting: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <Link {...cancel} className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'h-10 px-5' })}>
        Cancelar
      </Link>
      <Button type="submit" size="lg" className="h-10 px-6" disabled={submitting}>
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </div>
  )
}

/** A dd/mm/aaaa field that adds the slashes while typing. */
function DateField<T extends FieldValues>({ name, label, hint }: { name: Path<T>; label: string; hint?: string }) {
  const { control, formState } = useFormContext<T>()
  const error = formState.errors[name]?.message as string | undefined
  return (
    <Field label={label} error={error} hint={hint}>
      {(controlProps) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Input
              {...controlProps}
              className="h-10"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              autoComplete="off"
              name={field.name}
              ref={field.ref}
              value={field.value as string}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(maskDate(event.target.value))}
            />
          )}
        />
      )}
    </Field>
  )
}

function RentTermsFields() {
  const { register, control, formState } = useFormContext<RentTermsValues>()
  const { errors } = formState
  return (
    <FormSection title="Aluguel" description="O aluguel do contrato ativo é a receita do imóvel nos indicadores.">
      <Field label="Aluguel mensal" error={errors.monthlyRent?.message}>
        {(controlProps) => (
          <AffixInput {...controlProps} prefix="R$" inputMode="decimal" autoComplete="off" placeholder="0,00" {...register('monthlyRent')} />
        )}
      </Field>
      <Field label="Dia do vencimento" error={errors.dueDay?.message}>
        {(controlProps) => (
          <AffixInput {...controlProps} inputMode="numeric" autoComplete="off" placeholder="10" {...register('dueDay')} />
        )}
      </Field>
      <Field label="Índice de reajuste" error={errors.adjustmentIndex?.message}>
        {(controlProps) => (
          <Controller
            control={control}
            name="adjustmentIndex"
            render={({ field }) => (
              <OptionSelect
                control={controlProps}
                value={field.value}
                options={ADJUSTMENT_OPTIONS}
                emptyLabel="Sem índice"
                placeholder="Sem índice"
                onChange={field.onChange}
              />
            )}
          />
        )}
      </Field>
    </FormSection>
  )
}

function NotesField() {
  const { register } = useFormContext<{ notes: string }>()
  return (
    <FormSection title="Observações">
      <Field label="Observações" className="sm:col-span-2">
        {(controlProps) => <Textarea {...controlProps} {...register('notes')} />}
      </Field>
    </FormSection>
  )
}

const NEW_FIELDS = Object.values(REQUEST_PATH_TO_FIELD)

interface NewContractFormProps {
  initialValues: NewContractValues
  /** The properties that take contracts. */
  properties: Property[]
  cancel: LinkProps
  onSubmit: (request: CreateContractRequest) => Promise<unknown>
}

export function NewContractForm({ initialValues, properties, cancel, onSubmit }: NewContractFormProps) {
  const contractTypeOf = (id: string) => {
    const property = properties.find((p) => p.id === id)
    return property ? contractTypeFor(property) : undefined
  }
  const form = useForm<NewContractValues>({
    resolver: zodResolver(newContractSchema(contractTypeOf)),
    defaultValues: initialValues,
  })
  const { register, control, setError, handleSubmit, formState } = form
  const { errors, isSubmitting } = formState
  const [propertyId, occupantMode] = useWatch({ control, name: ['propertyId', 'occupantMode'] })
  const property = properties.find((p) => p.id === propertyId)
  const contractType = property ? contractTypeFor(property) : undefined
  const active = useQuery(activeContractQueryOptions(propertyId)).data

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toCreateRequest(values, contractTypeOf(values.propertyId)!))
    } catch (failure) {
      showApiError(failure, setError, NEW_FIELDS)
    }
  })

  const text = (name: 'occupantName' | 'occupantDocument' | 'occupantEmail' | 'occupantPhone', label: string, extra: { hint?: string; inputMode?: 'email' | 'tel' | 'numeric'; autoComplete?: string } = {}) => (
    <Field label={label} error={errors[name]?.message} hint={extra.hint}>
      {(controlProps) => (
        <Input {...controlProps} className="h-10" inputMode={extra.inputMode} autoComplete={extra.autoComplete ?? 'off'} {...register(name)} />
      )}
    </Field>
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormAlert message={errors.root?.message} />

        <FormSection
          title="Imóvel"
          description="Aparecem os imóveis que podem ter contrato: os que não são de uso próprio nem comodato."
        >
          <Field
            label="Imóvel"
            error={errors.propertyId?.message}
            className="sm:col-span-2"
            hint={
              contractType === 'short_stay'
                ? 'Imóvel de temporada: o contrato não tem aluguel fixo, a receita vem das reservas.'
                : contractType === 'conventional'
                  ? `Contrato de ${CONTRACT_TYPE_LABEL.conventional.toLowerCase()}, com aluguel mensal.`
                  : undefined
            }
          >
            {(controlProps) => (
              <Controller
                control={control}
                name="propertyId"
                render={({ field }) => (
                  <OptionSelect
                    control={controlProps}
                    value={field.value}
                    options={properties.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="Escolha o imóvel"
                    onChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
          {active && (
            <p className="flex items-start gap-2 rounded-2xl bg-pastel-yellow px-4 py-3 text-sm sm:col-span-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {property?.name} já tem um contrato ativo com {active.occupant.name}, desde{' '}
                {formatNumericDate(active.startDate)}. Ao salvar este, aquele é encerrado.
              </span>
            </p>
          )}
          {property && property.rentalMode === 'manual' && (
            <p className="flex items-start gap-2 rounded-2xl bg-pastel-yellow px-4 py-3 text-sm sm:col-span-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                O aluguel deste imóvel é informado no próprio imóvel. Para ele ter contratos, edite o imóvel e escolha
                "Do contrato ativo" em "De onde vem o aluguel".
              </span>
            </p>
          )}
        </FormSection>

        <FormSection title="Ocupante" description={contractType === 'short_stay' ? 'Quem ocupa o imóvel.' : 'O inquilino.'}>
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="occupantMode"
              render={({ field }) => (
                <ChoiceGroup
                  label="Quem é"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'new', label: 'Novo' },
                    { value: 'existing', label: 'Já cadastrado' },
                  ]}
                  hint={
                    field.value === 'new'
                      ? 'Se o CPF ou CNPJ já estiver cadastrado, o cadastro existente é usado.'
                      : 'Inquilinos e hóspedes de contratos e reservas anteriores.'
                  }
                />
              )}
            />
          </div>
          {occupantMode === 'existing' ? (
            <Field label="Ocupante" error={errors.occupant?.message} className="sm:col-span-2">
              {(controlProps) => (
                <Controller
                  control={control}
                  name="occupant"
                  render={({ field }) => <OccupantCombobox control={controlProps} value={field.value} onChange={field.onChange} />}
                />
              )}
            </Field>
          ) : (
            <>
              <div className="sm:col-span-2">{text('occupantName', 'Nome', { autoComplete: 'name' })}</div>
              {text('occupantDocument', 'CPF ou CNPJ', { inputMode: 'numeric', hint: 'Opcional. Pode digitar com ou sem pontos.' })}
              {text('occupantPhone', 'Telefone', { inputMode: 'tel', hint: 'Opcional, com DDD.' })}
              <div className="sm:col-span-2">{text('occupantEmail', 'E-mail', { inputMode: 'email', hint: 'Opcional.' })}</div>
            </>
          )}
        </FormSection>

        <FormSection title="Vigência">
          <DateField<NewContractValues> name="startDate" label="Início" />
          <DateField<NewContractValues> name="endDate" label="Fim" hint="Deixe em branco para prazo indeterminado." />
        </FormSection>

        {contractType !== 'short_stay' && <RentTermsFields />}
        <NotesField />

        <FormFooter cancel={cancel} submitLabel="Cadastrar contrato" submitting={isSubmitting} />
      </form>
    </FormProvider>
  )
}

const EDIT_FIELDS = ['endDate', 'notes', 'monthlyRent', 'dueDay', 'adjustmentIndex'] as const

interface EditContractFormProps {
  contract: Contract
  initialValues: EditContractValues
  cancel: LinkProps
  onSubmit: (request: UpdateContractRequest) => Promise<unknown>
}

/** The property, the type, the occupant and the start are fixed; the rest can change while the contract is active. */
export function EditContractForm({ contract, initialValues, cancel, onSubmit }: EditContractFormProps) {
  const form = useForm<EditContractValues>({
    resolver: zodResolver(editContractSchema(contract)),
    defaultValues: initialValues,
  })
  const { setError, handleSubmit, formState } = form

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toUpdateRequest(values, contract.contractType))
    } catch (failure) {
      showApiError(failure, setError, EDIT_FIELDS)
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormAlert message={formState.errors.root?.message} />
        <FormSection title="Vigência" description={`Começou em ${formatNumericDate(contract.startDate)}.`}>
          <DateField<EditContractValues> name="endDate" label="Fim" hint="Deixe em branco para prazo indeterminado." />
        </FormSection>
        {contract.contractType === 'conventional' && <RentTermsFields />}
        <NotesField />
        <FormFooter cancel={cancel} submitLabel="Salvar alterações" submitting={formState.isSubmitting} />
      </form>
    </FormProvider>
  )
}
