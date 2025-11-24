'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { sendNotification } from '@/app/actions/admin'
import { getActivePaymentAccounts } from '@/app/actions/get-active-accounts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { convertUsdToBtc, getUsdtBrlRate } from '@/lib/bitget'
import { createClient } from '@/lib/supabase/client'

// Validação de endereço por rede
const validateWalletAddress = (address: string, network: string): boolean => {
  switch (network) {
    case 'bitcoin': {
      return /^(1|3|bc1)[\dA-HJ-NP-Za-z]{25,62}$/.test(address)
    }
    case 'ethereum':
    case 'polygon':
    case 'bsc': {
      return /^0x[\dA-Fa-f]{40}$/.test(address)
    }
    case 'solana': {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    }
    case 'tron': {
      return /^T[\dA-Za-z]{33}$/.test(address)
    }
    default: {
      return false
    }
  }
}

const depositSchema = z
  .object({
    payment_method: z.enum(['pix', 'ted']),
    amount_brl: z.coerce.number().min(100, 'Valor mínimo é R$ 100,00'),
    crypto_network: z.enum([
      'bitcoin',
      'ethereum',
      'polygon',
      'bsc',
      'solana',
      'tron',
    ]),
    wallet_address: z
      .string()
      .min(26, 'Endereço inválido')
      .max(100, 'Endereço muito longo'),
  })
  .refine(
    (data) => validateWalletAddress(data.wallet_address, data.crypto_network),
    {
      message: 'Endereço de carteira inválido para a rede selecionada',
      path: ['wallet_address'],
    },
  )

type DepositFormValues = z.infer<typeof depositSchema>

interface TransactionData {
  user_id: string
  transaction_number: string
  payment_method: 'pix' | 'ted'
  amount_brl: number
  crypto_network: string
  wallet_address: string
  expires_at: string
  status: string
  pix_key?: string
  pix_qr_code?: string
  bank_name?: string
  bank_code?: string
  bank_account_holder?: string
  bank_account_agency?: string
  bank_account_number?: string
}

const paymentMethods = [
  {
    id: 'pix',
    name: 'PIX',
    time: 'Instantâneo',
    description: 'Instantâneo para valores menores',
  },
  {
    id: 'ted',
    name: 'TED',
    time: '30 min a 1h',
    description: 'Recomendado para valores maiores',
  },
] as const

const cryptoNetworks = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'Rede Bitcoin (BTC)',
    addressExample: '1A1z...',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Rede Ethereum (ETH)',
    addressExample: '0x74...',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    description: 'Rede Polygon (MATIC)',
    addressExample: '0x74...',
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BSC',
    description: 'Binance Smart Chain (BNB)',
    addressExample: '0x74...',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    description: 'Rede Solana (SOL)',
    addressExample: '7v91...',
  },
  {
    id: 'tron',
    name: 'Tron',
    symbol: 'TRX',
    description: 'Rede Tron (TRX)',
    addressExample: 'TN3W...',
  },
] as const

// Descrições de formato de endereço para cada rede
const walletFormatDescriptions: Record<string, string> = {
  bitcoin:
    'Endereço Bitcoin deve começar com 1, 3 ou bc1 (ex: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)',
  ethereum:
    'Endereço Ethereum deve começar com 0x e ter 42 caracteres (ex: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)',
  polygon:
    'Endereço Polygon deve começar com 0x e ter 42 caracteres (ex: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)',
  bsc: 'Endereço BSC deve começar com 0x e ter 42 caracteres (ex: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)',
  solana:
    'Endereço Solana em formato Base58, 32-44 caracteres (ex: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q)',
  tron: 'Endereço Tron deve começar com T e ter 34 caracteres (ex: TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9)',
}

// Funções auxiliares para formatação de moeda brasileira
function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseCurrencyBRL(value: string): number {
  // Remove tudo exceto números e vírgula
  const cleaned = value.replaceAll(/[^\d,]/g, '')
  // Substitui vírgula por ponto para conversão
  const normalized = cleaned.replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numbers = value.replaceAll(/\D/g, '')

  if (numbers.length === 0) return ''

  // Converte para número de centavos
  const cents = Number.parseInt(numbers, 10)

  // Converte para formato BRL
  const reais = cents / 100

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais)
}

// Função para calcular cripto com taxa de hubp2p.com (Bitget + R$0,05 + 4%)
async function calculateCryptoForHubP2P(
  brlAmount: number,
  network: string,
): Promise<{
  cryptoAmount: number
  cryptoSymbol: string
  usdAmount: number
}> {
  // Pegar taxa USDT/BRL da Bitget
  const bitgetRate = await getUsdtBrlRate()

  // Aplicar markup: taxa base + R$0,05 + 4%
  const markupFixed = 0.05
  const markupPercentage = 0.04
  const finalRate = bitgetRate + markupFixed + bitgetRate * markupPercentage

  // Converter BRL para USD usando a taxa com markup
  const usdAmount = brlAmount / finalRate

  if (network === 'bitcoin') {
    // Para Bitcoin, converter USD para BTC
    const btcAmount = await convertUsdToBtc(usdAmount)
    return {
      cryptoAmount: btcAmount,
      cryptoSymbol: 'BTC',
      usdAmount,
    }
  }

  // Para outras redes, retornar USDT
  return {
    cryptoAmount: usdAmount,
    cryptoSymbol: 'USDT',
    usdAmount,
  }
}

export default function NewDepositPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [cryptoAmount, setCryptoAmount] = useState<number | undefined>()
  const [cryptoSymbol, setCryptoSymbol] = useState<string>('USDT')
  const [isCalculating, setIsCalculating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      payment_method: 'pix',
      amount_brl: 100,
      crypto_network: 'ethereum',
      wallet_address: '',
    },
  })

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const selectedPaymentMethod = paymentMethods.find(
    (m) => m.id === form.watch('payment_method'),
  )

  const selectedNetwork = cryptoNetworks.find(
    (n) => n.id === form.watch('crypto_network'),
  )

  // Função para calcular cripto (memoizada com useCallback)
  const calculateCrypto = useCallback(async () => {
    const amount = form.getValues('amount_brl')
    const network = form.getValues('crypto_network')

    if (!amount || amount < 100) {
      setCryptoAmount(undefined)
      return
    }

    setIsCalculating(true)
    try {
      const result = await calculateCryptoForHubP2P(amount, network)
      setCryptoAmount(result.cryptoAmount)
      setCryptoSymbol(result.cryptoSymbol)
    } catch (error) {
      console.error('[CALCULATE CRYPTO] Erro ao calcular cripto:', error)
      setCryptoAmount(undefined)
    } finally {
      setIsCalculating(false)
    }
  }, [form])

  // Recalcula quando o valor BRL muda (com debounce)
  useEffect(() => {
    const debounce = setTimeout(calculateCrypto, 500)
    return () => clearTimeout(debounce)
  }, [amountDisplay, calculateCrypto])

  // Recalcula imediatamente quando a rede muda
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'crypto_network') {
        calculateCrypto()
      }
    })
    return () => subscription.unsubscribe()
  }, [form, calculateCrypto])

  const onSubmit = async (data: DepositFormValues) => {
    setIsSubmitting(true)
    try {
      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado.',
          variant: 'destructive',
        })
        return
      }

      // Buscar contas de pagamento ativas
      const accountsResult = await getActivePaymentAccounts()

      if (!accountsResult.success || !accountsResult.data) {
        toast({
          title: 'Erro',
          description: 'Não foi possível obter os dados de pagamento.',
          variant: 'destructive',
        })
        return
      }

      const accounts = accountsResult.data

      // Verificar se existe conta ativa para o método selecionado
      if (data.payment_method === 'pix' && !accounts.pix) {
        toast({
          title: 'Erro',
          description:
            'Não há nenhuma chave PIX ativa. Entre em contato com o suporte.',
          variant: 'destructive',
        })
        return
      }

      if (data.payment_method === 'ted' && !accounts.ted) {
        toast({
          title: 'Erro',
          description:
            'Não há nenhuma conta bancária ativa. Entre em contato com o suporte.',
          variant: 'destructive',
        })
        return
      }

      // Gerar número da transação (será gerado pela função do banco)
      const { data: transactionNumber } = await supabase.rpc(
        'generate_transaction_number',
      )

      // Calcular data de expiração (40 minutos)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 40)

      // Preparar dados da transação
      const transactionData: TransactionData = {
        user_id: user.id,
        transaction_number: transactionNumber || `TXN-${Date.now()}`,
        payment_method: data.payment_method,
        amount_brl: data.amount_brl,
        crypto_network: data.crypto_network,
        wallet_address: data.wallet_address,
        expires_at: expiresAt.toISOString(),
        status: 'pending_payment',
      }

      // Adicionar dados específicos do método de pagamento
      if (data.payment_method === 'pix' && accounts.pix) {
        transactionData.pix_key = accounts.pix.pix_key
        transactionData.pix_qr_code = accounts.pix.pix_qr_code
      } else if (data.payment_method === 'ted' && accounts.ted) {
        transactionData.bank_name = accounts.ted.bank_name
        transactionData.bank_account_holder = accounts.ted.account_holder
        transactionData.bank_account_agency = accounts.ted.account_agency
        transactionData.bank_account_number = accounts.ted.account_number
      }

      // Criar transação
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar transação:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a transação. Tente novamente.',
          variant: 'destructive',
        })
        return
      }

      // Enviar notificação Pushover prioritária para o admin
      try {
        await sendNotification(transaction.id, 'new_transaction')
      } catch (notificationError) {
        // Log do erro mas não falha a transação
        console.error('Erro ao enviar notificação Pushover:', notificationError)
      }

      toast({
        title: 'Transação criada!',
        description: 'Você será redirecionado para a página de pagamento.',
      })

      // Redirecionar para página de pagamento
      if (transaction && 'id' in transaction) {
        router.push(`/dashboard/deposit/${transaction.id}`)
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof DepositFormValues)[] = []

    switch (step) {
      case 1: {
        fieldsToValidate = ['payment_method']

        break
      }
      case 2: {
        fieldsToValidate = ['amount_brl']

        break
      }
      case 3: {
        fieldsToValidate = ['crypto_network']

        break
      }
      // No default
    }

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid && step < totalSteps) {
      setStep(step + 1)
    }
  }

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 transition-all hover:bg-blue-50 hover:text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          Novo Depósito
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Complete as etapas abaixo para criar seu depósito
        </p>
      </div>

      {/* Progress */}
      <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-100 shadow-xl">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-900">
                Etapa {step} de {totalSteps}
              </span>
              <span className="text-sm font-medium text-blue-700">
                {Math.round(progress)}% completo
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-blue-700">
              <span>Método</span>
              <span>Valor</span>
              <span>Rede</span>
              <span>Carteira</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Método de Pagamento */}
          {step === 1 && (
            <Card className="border-none shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Escolha o Método de Pagamento
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Selecione como deseja realizar o depósito
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid gap-4 md:grid-cols-2">
                          {paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              role="button"
                              tabIndex={0}
                              className={`cursor-pointer rounded-xl border-2 p-6 shadow-lg transition-all duration-300 ${
                                field.value === method.id
                                  ? 'scale-105 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl'
                                  : 'border-gray-200 bg-white hover:scale-105 hover:border-blue-300 hover:shadow-xl'
                              }`}
                              onClick={() => field.onChange(method.id)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' ||
                                  event.key === ' '
                                ) {
                                  event.preventDefault()
                                  field.onChange(method.id)
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">
                                    {method.name}
                                  </h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                                {field.value === method.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="mt-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4" />
                                  <span>{method.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Valor */}
          {step === 2 && (
            <Card className="border-none shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Informe o Valor
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Digite o valor que deseja depositar em BRL
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="amount_brl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor em Reais (BRL)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            className="pl-10 text-lg"
                            value={amountDisplay}
                            onChange={(event) => {
                              const value = event.target.value
                              // Formatar em tempo real
                              const formatted = formatCurrencyInput(value)
                              setAmountDisplay(formatted)

                              // Converter para número e atualizar o form
                              const numericValue = parseCurrencyBRL(formatted)
                              field.onChange(numericValue)
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Informe o valor em reais que deseja depositar
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor em Cripto Calculado */}
                {form.watch('amount_brl') >= 100 && (
                  <div className="mt-6 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600">
                        Você receberá:
                      </p>
                      {isCalculating || cryptoAmount === undefined ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-500">
                            Calculando...
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                          {cryptoSymbol === 'BTC' ? '₿' : '$'}
                          {cryptoAmount.toLocaleString('pt-BR', {
                            minimumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                            maximumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="border-t border-blue-200 pt-4">
                      <p className="text-xs font-medium text-gray-600">
                        {cryptoSymbol}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Rede de Criptomoeda */}
          {step === 3 && (
            <Card className="border-none shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Escolha a Rede
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Selecione a rede blockchain para receber suas criptomoedas
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="crypto_network"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid gap-3">
                          {cryptoNetworks.map((network) => (
                            <div
                              key={network.id}
                              role="button"
                              tabIndex={0}
                              className={`cursor-pointer rounded-xl border-2 p-4 shadow-lg transition-all duration-300 ${
                                field.value === network.id
                                  ? 'scale-105 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-2xl'
                                  : 'border-gray-200 bg-white hover:scale-105 hover:border-blue-300 hover:shadow-xl'
                              }`}
                              onClick={() => field.onChange(network.id)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' ||
                                  event.key === ' '
                                ) {
                                  event.preventDefault()
                                  field.onChange(network.id)
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">
                                      {network.name}
                                    </h3>
                                    <Badge variant="secondary">
                                      {network.symbol}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {network.description}
                                  </p>
                                </div>
                                {field.value === network.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Endereço da Carteira */}
          {step === 4 && (
            <Card className="border-none shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Endereço da Carteira
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Insira o endereço da sua carteira {selectedNetwork?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="wallet_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Carteira</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={selectedNetwork?.addressExample}
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="space-y-1">
                        <p className="text-muted-foreground">
                          Verifique cuidadosamente o endereço. Transações para
                          endereços incorretos não podem ser revertidas.
                        </p>
                        {selectedNetwork && (
                          <p className="font-medium text-blue-600">
                            ℹ️ {walletFormatDescriptions[selectedNetwork.id]}
                          </p>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumo */}
                <div className="mt-6 space-y-3 rounded-xl border-none bg-gradient-to-br from-gray-50 to-slate-100 p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-gray-900">
                    Resumo do Depósito
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">
                        R$ {formatCurrencyBRL(form.watch('amount_brl') || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rede:</span>
                      <span className="font-medium">
                        {selectedNetwork?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod?.time}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={step === 1}
              className="h-12 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Anterior
            </Button>

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                Próximo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? 'Criando...' : 'Criar Depósito'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
