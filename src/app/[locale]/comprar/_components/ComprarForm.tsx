'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  calculateUsdFromBrl,
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

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>

const networks = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'polygon', label: 'Polygon (MATIC)' },
  { value: 'bsc', label: 'Binance Smart Chain (BNB)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'tron', label: 'Tron (TRX)' },
] as const

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
  const [usdAmount, setUsdAmount] = useState<number | undefined>()
  const [exchangeRate, setExchangeRate] = useState<number | undefined>()
  const [isCalculating, setIsCalculating] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isFirstMount = useRef(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount_brl: 100,
      crypto_network: 'bitcoin',
      wallet_address: '',
    },
  })

  // Função para calcular USD (memoizada com useCallback)
  const calculateUsd = useCallback(async () => {
    const amount = Number.parseFloat(
      brlAmount.replaceAll(/[^\d,]/g, '').replace(',', '.'),
    )

    if (Number.isNaN(amount) || amount < 100) {
      setUsdAmount(undefined)
      setExchangeRate(undefined)
      return
    }

    setIsCalculating(true)
    try {
      console.log('[CALCULATE USD] Iniciando cálculo para BRL:', amount)
      const result = await calculateUsdFromBrl(amount)
      console.log('[CALCULATE USD] USD calculado:', result.usdAmount)
      console.log('[CALCULATE USD] Taxa:', result.exchangeRate)
      setUsdAmount(result.usdAmount)
      setExchangeRate(result.exchangeRate)
      form.setValue('amount_brl', amount)
    } catch (error) {
      console.error('[CALCULATE USD] Erro ao calcular USD:', error)
      setUsdAmount(undefined)
      setExchangeRate(undefined)
    } finally {
      setIsCalculating(false)
    }
  }, [brlAmount, form])

  // Calcula USD em tempo real quando o valor BRL muda (com debounce)
  useEffect(() => {
    // Pula o cálculo no primeiro mount para evitar setState durante render
    if (isFirstMount.current) {
      isFirstMount.current = false
      // Mas ainda calcula o valor inicial após o mount
      const timer = setTimeout(() => {
        calculateUsd()
      }, 0)
      return () => clearTimeout(timer)
    }

    const debounce = setTimeout(calculateUsd, 500)
    return () => clearTimeout(debounce)
  }, [calculateUsd])

  // Timer de 30 segundos para atualizar automaticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          // Quando chegar a 0, atualiza e reinicia
          setIsRefreshing(true)
          calculateUsd().finally(() => {
            setIsRefreshing(false)
          })
          return 30
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateUsd])

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

            {/* Valor em USD (calculado automaticamente) */}
            <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Você receberá:
                  </p>
                  {isCalculating || usdAmount === undefined ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-500">
                        Calculando...
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                      $
                      {usdAmount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                  <span className="text-3xl font-bold text-white">$</span>
                </div>
              </div>

              {/* Timer e círculo de progresso */}
              <div className="mt-4 flex items-center justify-between border-t border-blue-200 pt-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600">USDT</p>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço da Carteira</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Cole aqui o endereço da sua carteira na rede selecionada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              size="lg"
              disabled={isLoading || !usdAmount}
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
