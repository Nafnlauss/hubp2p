'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  calculateCryptoFromBrl,
  createApiTransaction,
} from '@/app/actions/api-transactions'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

// Validações de endereço por rede
const validateWalletAddress = (address: string, network: string): boolean => {
  switch (network) {
    case 'bitcoin': {
      // Bitcoin: começa com 1, 3, ou bc1
      return /^(1|3|bc1)[\dA-HJ-NP-Za-z]{25,62}$/.test(address)
    }
    case 'ethereum':
    case 'polygon':
    case 'bsc': {
      // Ethereum, Polygon, BSC: começa com 0x e tem 42 caracteres
      return /^0x[\dA-Fa-f]{40}$/.test(address)
    }
    case 'solana': {
      // Solana: Base58, 32-44 caracteres
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    }
    case 'tron': {
      // Tron: começa com T e tem 34 caracteres
      return /^T[\dA-Za-z]{33}$/.test(address)
    }
    default: {
      return false
    }
  }
}

const formSchema = z
  .object({
    amount_brl: z.number().min(100, 'Valor mínimo é R$ 100,00'),
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

type FormValues = z.infer<typeof formSchema>

const networks = [
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'polygon', label: 'Polygon (MATIC)' },
  { value: 'bsc', label: 'Binance Smart Chain (BNB)' },
  { value: 'tron', label: 'Tron (TRX)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
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

// Placeholders de endereço para cada rede
const walletPlaceholders: Record<string, string> = {
  bitcoin: '1A1z...',
  ethereum: '0x74...',
  polygon: '0x74...',
  bsc: '0x74...',
  solana: '7v91...',
  tron: 'TN3W...',
}

function formatBRL(value: string) {
  const numbers = value.replaceAll(/\D/g, '')
  const amount = Number.parseInt(numbers) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function ComprarForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [brlAmount, setBrlAmount] = useState('R$ 100,00')
  const [cryptoAmount, setCryptoAmount] = useState<number | undefined>()
  const [cryptoSymbol, setCryptoSymbol] = useState<string>('USDT')
  const [exchangeRate, setExchangeRate] = useState<number | undefined>()
  const [isCalculating, setIsCalculating] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isFirstMount = useRef(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount_brl: 100,
      crypto_network: 'ethereum',
      wallet_address: '',
    },
  })

  // Função para calcular cripto (BTC ou USDT) baseado na rede (memoizada com useCallback)
  const calculateCrypto = useCallback(async () => {
    const amount = Number.parseFloat(
      brlAmount.replaceAll(/[^\d,]/g, '').replace(',', '.'),
    )

    const network = form.getValues('crypto_network')

    if (Number.isNaN(amount) || amount < 100) {
      setCryptoAmount(undefined)
      setExchangeRate(undefined)
      return
    }

    setIsCalculating(true)
    try {
      console.log('[CALCULATE CRYPTO] Iniciando cálculo para BRL:', amount)
      console.log('[CALCULATE CRYPTO] Rede:', network)
      const result = await calculateCryptoFromBrl(amount, network)
      console.log('[CALCULATE CRYPTO] Cripto calculado:', result.cryptoAmount)
      console.log('[CALCULATE CRYPTO] Símbolo:', result.cryptoSymbol)
      console.log('[CALCULATE CRYPTO] Taxa:', result.exchangeRate)
      setCryptoAmount(result.cryptoAmount)
      setCryptoSymbol(result.cryptoSymbol)
      setExchangeRate(result.exchangeRate)
      form.setValue('amount_brl', amount)
    } catch (error) {
      console.error('[CALCULATE CRYPTO] Erro ao calcular cripto:', error)
      setCryptoAmount(undefined)
      setExchangeRate(undefined)
    } finally {
      setIsCalculating(false)
    }
  }, [brlAmount, form])

  // Calcula cripto em tempo real quando o valor BRL ou rede muda (com debounce)
  useEffect(() => {
    // Pula o cálculo no primeiro mount para evitar setState durante render
    if (isFirstMount.current) {
      isFirstMount.current = false
      // Mas ainda calcula o valor inicial após o mount
      const timer = setTimeout(() => {
        calculateCrypto()
      }, 0)
      return () => clearTimeout(timer)
    }

    const debounce = setTimeout(calculateCrypto, 500)
    return () => clearTimeout(debounce)
  }, [calculateCrypto])

  // Recalcula imediatamente quando a rede muda (sem esperar 30s)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'crypto_network') {
        calculateCrypto()
      }
    })
    return () => subscription.unsubscribe()
  }, [form, calculateCrypto])

  // Timer de 30 segundos para atualizar automaticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          // Quando chegar a 0, atualiza e reinicia
          setIsRefreshing(true)
          calculateCrypto().finally(() => {
            setIsRefreshing(false)
          })
          return 30
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateCrypto])

  const handleBrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBRL(event.target.value)
    setBrlAmount(formatted)
  }

  // Calcula o progresso do círculo (0 a 1)
  const progress = timeLeft / 30
  const circumference = 2 * Math.PI * 18 // raio do círculo = 18
  const strokeDashoffset = circumference * (1 - progress)

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      const transaction = await createApiTransaction({
        amount_brl: values.amount_brl,
        crypto_network: values.crypto_network,
        wallet_address: values.wallet_address,
      })

      toast({
        title: 'Transação criada!',
        description: `Número: ${transaction.transaction_number}`,
      })

      // Redireciona para a página de pagamento
      router.push(`/comprar/${transaction.id}`)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao criar transação',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Informações da Compra
        </CardTitle>
        <CardDescription className="text-base">
          Preencha os dados abaixo para gerar sua chave PIX
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Valor em BRL */}
            <div className="space-y-2">
              <label htmlFor="brl-amount" className="text-sm font-medium">
                Valor em Reais (BRL)
              </label>
              <Input
                id="brl-amount"
                type="text"
                placeholder="R$ 0,00"
                value={brlAmount}
                onChange={handleBrlChange}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Valor mínimo: R$ 100,00
              </p>
            </div>

            {/* Valor em Cripto (calculado automaticamente) */}
            <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex-1">
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
                        minimumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                        maximumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                  <span className="text-3xl font-bold text-white">
                    {cryptoSymbol === 'BTC' ? '₿' : '$'}
                  </span>
                </div>
              </div>

              {/* Timer e círculo de progresso */}
              <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600">
                    {cryptoSymbol}
                  </p>
                  {exchangeRate && (
                    <p className="text-xs font-semibold text-gray-700">
                      Taxa: R${' '}
                      {exchangeRate.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-600">
                      {isRefreshing ? 'Atualizando...' : 'Atualiza em'}
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      {timeLeft}s
                    </p>
                  </div>
                  <div className="relative h-12 w-12">
                    {/* Círculo de fundo */}
                    <svg className="h-12 w-12 -rotate-90 transform">
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-blue-200"
                      />
                      {/* Círculo de progresso */}
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-blue-600 transition-all duration-1000 ease-linear"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Ícone no centro */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isRefreshing ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rede Blockchain */}
            <FormField
              control={form.control}
              name="crypto_network"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rede Blockchain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a rede" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network.value} value={network.value}>
                          {network.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Escolha a rede onde deseja receber seus USDT
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Endereço da Carteira */}
            <FormField
              control={form.control}
              name="wallet_address"
              render={({ field }) => {
                const selectedNetwork = form.watch('crypto_network')
                return (
                  <FormItem>
                    <FormLabel>Endereço da Carteira</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedNetwork
                            ? walletPlaceholders[selectedNetwork]
                            : '0x...'
                        }
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      <p className="text-muted-foreground">
                        Cole aqui o endereço da sua carteira na rede selecionada
                      </p>
                      {selectedNetwork && (
                        <p className="font-medium text-blue-600">
                          ℹ️ {walletFormatDescriptions[selectedNetwork]}
                        </p>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              size="lg"
              disabled={isLoading || !cryptoAmount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Gerar Chave PIX'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
