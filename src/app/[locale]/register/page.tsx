'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { fetchAddressByCEP, formatAddressData } from '@/lib/cep'
import { formatCEP, formatCPF, formatPhone } from '@/lib/masks'
import {
  type SignUpStep1FormData,
  signUpStep1Schema,
  type SignUpStep2FormData,
  signUpStep2Schema,
  type SignUpStep3FormData,
  signUpStep3Schema,
} from '@/lib/validations/auth'
import type { SignUpData } from '@/types/auth'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [formData, setFormData] = useState<Partial<SignUpData>>({})

  // Forms para cada step
  const step1Form = useForm<SignUpStep1FormData>({
    resolver: zodResolver(signUpStep1Schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const step2Form = useForm<SignUpStep2FormData>({
    resolver: zodResolver(signUpStep2Schema),
    defaultValues: {
      fullName: '',
      cpf: '',
      phone: '',
      dateOfBirth: '',
    },
  })

  const step3Form = useForm<SignUpStep3FormData>({
    resolver: zodResolver(signUpStep3Schema),
    defaultValues: {
      addressZip: '',
      addressStreet: '',
      addressNumber: '',
      addressComplement: '',
      addressCity: '',
      addressState: '',
    },
  })

  async function handleStep1Submit(data: SignUpStep1FormData) {
    setFormData((previous) => ({ ...previous, ...data }))
    setCurrentStep(2)
  }

  async function handleStep2Submit(data: SignUpStep2FormData) {
    setFormData((previous) => ({ ...previous, ...data }))
    setCurrentStep(3)
  }

  async function handleStep3Submit(data: SignUpStep3FormData) {
    setIsLoading(true)

    try {
      const completeData: SignUpData = {
        ...formData,
        ...data,
      } as SignUpData

      const result = await signUp(completeData)

      if (result.success) {
        toast({
          title: t('common.success'),
          description:
            'Conta criada com sucesso! Complete seu KYC para começar.',
        })

        // Se recebeu credenciais, fazer login no client-side
        if (result.credentials) {
          console.log('🔵 [REGISTER] Fazendo login no client-side...')

          // Importar createClient do client
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()

          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email: result.credentials.email,
              password: result.credentials.password,
            },
          )

          if (signInError) {
            console.error('❌ [REGISTER] Erro no login:', signInError)
            toast({
              title: t('common.error'),
              description: 'Conta criada! Por favor, faça login manualmente.',
              variant: 'destructive',
            })
            window.location.href = `/${locale}/login`
            return
          }

          console.log('✅ [REGISTER] Login bem-sucedido!')
        }

        // Redirecionar para KYC
        const redirectSource = result.redirectTo ?? '/kyc'
        const redirectPath = redirectSource.startsWith('/')
          ? redirectSource
          : `/${redirectSource}`
        const target = `/${locale}${redirectPath}`

        setTimeout(() => {
          window.location.href = target
        }, 500)
      } else {
        toast({
          title: t('common.error'),
          description: result.error || 'Erro ao criar conta',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch {
      toast({
        title: t('common.error'),
        description: 'Erro inesperado ao criar conta',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  function goToPreviousStep() {
    if (currentStep > 1) {
      setCurrentStep((previous) => (previous - 1) as Step)
    }
  }

  // Função para buscar endereço pelo CEP
  async function handleCEPChange(cep: string) {
    const formatted = formatCEP(cep)
    step3Form.setValue('addressZip', formatted)

    // Remove formatação para verificar se tem 8 dígitos
    const cleanCEP = cep.replaceAll(/\D/g, '')

    // Só busca se tiver 8 dígitos completos
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true)

      try {
        const addressData = await fetchAddressByCEP(cleanCEP)

        if (addressData) {
          // Preenche os campos automaticamente
          const formattedAddress = formatAddressData(addressData)

          step3Form.setValue('addressStreet', formattedAddress.addressStreet)
          step3Form.setValue('addressCity', formattedAddress.addressCity)
          step3Form.setValue('addressState', formattedAddress.addressState)

          // Se tiver complemento no ViaCEP, preenche também
          if (formattedAddress.addressComplement) {
            step3Form.setValue(
              'addressComplement',
              formattedAddress.addressComplement,
            )
          }

          toast({
            title: 'CEP encontrado!',
            description: 'Endereço preenchido automaticamente.',
          })
        } else {
          toast({
            title: 'CEP não encontrado',
            description: 'Por favor, preencha o endereço manualmente.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Erro ao buscar CEP',
          description: 'Por favor, preencha o endereço manualmente.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingCEP(false)
      }
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t('auth.register.title')}
          </CardTitle>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
          <div className="pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('auth.register.stepOf', { current: currentStep, total: 3 })}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full ${
                    step <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Dados de Acesso */}
          {currentStep === 1 && (
            <Form {...step1Form}>
              <form
                onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                className="space-y-4"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {t('auth.register.step1.title')}
                  </h3>
                </div>

                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.step1.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t(
                            'auth.register.step1.emailPlaceholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.step1.password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t(
                            'auth.register.step1.passwordPlaceholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('auth.register.step1.confirmPassword')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t(
                            'auth.register.step1.confirmPasswordPlaceholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {t('common.next')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Dados Pessoais */}
          {currentStep === 2 && (
            <Form {...step2Form}>
              <form
                onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                className="space-y-4"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {t('auth.register.step2.title')}
                  </h3>
                </div>

                <FormField
                  control={step2Form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.step2.fullName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'auth.register.step2.fullNamePlaceholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.step2.cpf')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(event) => {
                            const formatted = formatCPF(event.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.register.step2.phone')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(event) => {
                            const formatted = formatPhone(event.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('auth.register.step2.dateOfBirth')}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {t('common.next')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Endereço */}
          {currentStep === 3 && (
            <Form {...step3Form}>
              <form
                onSubmit={step3Form.handleSubmit(handleStep3Submit)}
                className="space-y-4"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {t('auth.register.step3.title')}
                  </h3>
                </div>

                <FormField
                  control={step3Form.control}
                  name="addressZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('auth.register.step3.addressZip')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            {...field}
                            onChange={(event) => {
                              handleCEPChange(event.target.value)
                            }}
                            maxLength={9}
                            disabled={isLoading || isLoadingCEP}
                          />
                          {isLoadingCEP && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      {isLoadingCEP && (
                        <p className="text-xs text-muted-foreground">
                          Buscando endereço...
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={step3Form.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('auth.register.step3.addressStreet')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'auth.register.step3.addressStreetPlaceholder',
                            )}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step3Form.control}
                    name="addressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('auth.register.step3.addressNumber')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'auth.register.step3.addressNumberPlaceholder',
                            )}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step3Form.control}
                  name="addressComplement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('auth.register.step3.addressComplement')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'auth.register.step3.addressComplementPlaceholder',
                          )}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={step3Form.control}
                    name="addressCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('auth.register.step3.addressCity')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'auth.register.step3.addressCityPlaceholder',
                            )}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step3Form.control}
                    name="addressState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('auth.register.step3.addressState')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'auth.register.step3.addressStatePlaceholder',
                            )}
                            maxLength={2}
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('auth.register.submit')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.register.loginLink')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
