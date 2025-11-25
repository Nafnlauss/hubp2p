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
            window.location.href = '/login'
            return
          }

          console.log('✅ [REGISTER] Login bem-sucedido!')

          // Polling: tentar várias vezes até a sessão estar disponível
          console.log('⏳ [REGISTER] Aguardando sessão estar disponível...')
          let verifyUser
          const maxAttempts = 10 // 10 tentativas
          const delayBetweenAttempts = 300 // 300ms entre cada tentativa

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 [REGISTER] Tentativa ${attempt}/${maxAttempts}...`)

            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser()

            if (currentUser) {
              verifyUser = currentUser
              console.log(
                `✅ [REGISTER] Sessão encontrada na tentativa ${attempt}:`,
                currentUser.email,
              )
              break
            }

            if (attempt < maxAttempts) {
              await new Promise((resolve) =>
                setTimeout(resolve, delayBetweenAttempts),
              )
            }
          }

          if (!verifyUser) {
            console.error(
              '❌ [REGISTER] Sessão não disponível após todas as tentativas! Redirecionando para login.',
            )
            toast({
              title: t('common.error'),
              description: 'Conta criada! Por favor, faça login manualmente.',
              variant: 'destructive',
            })
            window.location.href = '/login'
            return
          }

          console.log(
            '✅ [REGISTER] Sessão confirmada, redirecionando para KYC...',
          )
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
      <div className="container mx-auto flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-3xl font-bold">
              {t('auth.register.title')}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {t('auth.register.subtitle')}
            </CardDescription>
            <div className="pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {t('auth.register.stepOf', {
                    current: currentStep,
                    total: 3,
                  })}
                </span>
                <span className="text-sm opacity-90">
                  {currentStep === 1 && '🔐 Credenciais'}
                  {currentStep === 2 && '👤 Dados Pessoais'}
                  {currentStep === 3 && '📍 Endereço'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                      step <= currentStep ? 'bg-white shadow-lg' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Step 1: Dados de Acesso */}
            {currentStep === 1 && (
              <Form {...step1Form}>
                <form
                  onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {t('auth.register.step1.title')}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Crie suas credenciais de acesso à plataforma
                    </p>
                  </div>

                  <FormField
                    control={step1Form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step1.email')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t(
                              'auth.register.step1.emailPlaceholder',
                            )}
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step1.password')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t(
                              'auth.register.step1.passwordPlaceholder',
                            )}
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
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
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step1.confirmPassword')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t(
                              'auth.register.step1.confirmPasswordPlaceholder',
                            )}
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="mt-8 h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                  >
                    {t('common.next')}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </Form>
            )}

            {/* Step 2: Dados Pessoais */}
            {currentStep === 2 && (
              <Form {...step2Form}>
                <form
                  onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {t('auth.register.step2.title')}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Informe seus dados pessoais para verificação KYC
                    </p>
                  </div>

                  <FormField
                    control={step2Form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step2.fullName')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'auth.register.step2.fullNamePlaceholder',
                            )}
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={step2Form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step2.cpf')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step2.phone')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              onChange={(event) => {
                                const formatted = formatPhone(
                                  event.target.value,
                                )
                                field.onChange(formatted)
                              }}
                              maxLength={15}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={step2Form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step2.dateOfBirth')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-8 flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="h-12 flex-1 border-2 border-gray-300 transition-all hover:border-blue-500 hover:bg-blue-50"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      {t('common.previous')}
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                    >
                      {t('common.next')}
                      <ChevronRight className="ml-2 h-5 w-5" />
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
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {t('auth.register.step3.title')}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Informe seu endereço para finalizar o cadastro
                    </p>
                  </div>

                  <FormField
                    control={step3Form.control}
                    name="addressZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step3.zip')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="00000-000"
                              className="h-11 pr-10 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              onChange={(event) => {
                                const formatted = formatCEP(event.target.value)
                                field.onChange(formatted)
                                handleCEPChange(formatted)
                              }}
                              maxLength={9}
                              disabled={isLoading || isLoadingCEP}
                            />
                            {isLoadingCEP && (
                              <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-blue-500" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step3Form.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          {t('auth.register.step3.street')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua, Avenida..."
                            className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                            {...field}
                            disabled={isLoading || isLoadingCEP}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={step3Form.control}
                      name="addressNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step3.number')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123"
                              className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading || isLoadingCEP}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step3Form.control}
                      name="addressComplement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step3.complement')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apto, Bloco... (opcional)"
                              className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading || isLoadingCEP}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={step3Form.control}
                      name="addressCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step3.city')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
                              className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading || isLoadingCEP}
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            {t('auth.register.step3.state')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="UF"
                              className="h-11 uppercase transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                              {...field}
                              onChange={(event) => {
                                const value = event.target.value.toUpperCase()
                                field.onChange(value)
                              }}
                              maxLength={2}
                              disabled={isLoading || isLoadingCEP}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      <strong>🔒 Verificação KYC:</strong> Após finalizar o
                      cadastro, você será redirecionado para completar a
                      verificação de identidade (KYC) obrigatória.
                    </p>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="h-12 flex-1 border-2 border-gray-300 transition-all hover:border-blue-500 hover:bg-blue-50"
                      disabled={isLoading}
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      {t('common.previous')}
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          {t('auth.register.submit')}
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>

          <CardFooter className="border-t bg-gray-50/50 p-6">
            <div className="w-full text-center text-sm text-gray-600">
              {t('auth.register.hasAccount')}{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 transition-colors hover:text-purple-600 hover:underline"
              >
                {t('auth.register.loginLink')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
