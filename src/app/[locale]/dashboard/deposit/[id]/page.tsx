/* eslint-disable jsx-a11y/label-has-associated-control, unicorn/no-null, unicorn/consistent-function-scoping */
'use client'

import { differenceInSeconds, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, Clock, Copy } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { convertUsdToBtc } from '@/lib/bitget'
import { createClient } from '@/lib/supabase/client'

interface Transaction {
  id: string
  transaction_number: string
  payment_method: 'pix' | 'ted'
  amount_brl: number
  amount_usd: number | null
  exchange_rate: number | null
  crypto_network: string
  wallet_address: string
  status: string
  expires_at: string
  created_at: string
  pix_key: string | null
  pix_qr_code: string | null
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_account_agency: string | null
  tx_hash: string | null
  payment_confirmed_at: string | null
  crypto_sent_at: string | null
  updated_at: string
  admin_notes: string | null
}

const statusMap = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    variant: 'warning' as const,
    icon: Clock,
  },
  payment_received: {
    label: 'Pagamento Recebido',
    variant: 'secondary' as const,
    icon: CheckCircle2,
  },
  converting: {
    label: 'Convertendo',
    variant: 'default' as const,
    icon: Clock,
  },
  sent: {
    label: 'Enviado',
    variant: 'success' as const,
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
  expired: {
    label: 'Expirado',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
}

const networkLabels = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  polygon: 'Polygon (MATIC)',
  bsc: 'Binance Smart Chain (BNB)',
  solana: 'Solana (SOL)',
  tron: 'Tron (TRX)',
}

export default function PaymentPage() {
  const parameters = useParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [confirming, setConfirming] = useState(false)
  const [cryptoAmount, setCryptoAmount] = useState<number | undefined>()
  const [cryptoSymbol, setCryptoSymbol] = useState<string>('USDT')

  useEffect(() => {
    loadTransaction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters.id])

  // Calcula o valor em cripto quando a transação carrega
  useEffect(() => {
    const calculateCrypto = async () => {
      if (!transaction || !transaction.amount_usd) return

      if (transaction.crypto_network === 'bitcoin') {
        try {
          // Para Bitcoin, converter USD para BTC
          const btcAmount = await convertUsdToBtc(transaction.amount_usd)
          setCryptoAmount(btcAmount)
          setCryptoSymbol('BTC')
        } catch (error) {
          console.error('Erro ao converter USD para BTC:', error)
          // Fallback para USDT em caso de erro
          setCryptoAmount(transaction.amount_usd)
          setCryptoSymbol('USDT')
        }
      } else {
        // Para outras redes, usar USDT direto
        setCryptoAmount(transaction.amount_usd)
        setCryptoSymbol('USDT')
      }
    }

    calculateCrypto()
  }, [transaction])

  // Realtime subscription
  useEffect(() => {
    if (!transaction) return

    console.log(
      '[REALTIME] Configurando subscription para transação:',
      transaction.id,
    )

    const channel = supabase
      .channel(`transaction-${transaction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transaction.id}`,
        },
        (payload) => {
          console.log('[REALTIME] Atualização recebida:', payload)
          console.log('[REALTIME] Status anterior:', transaction.status)
          console.log('[REALTIME] Status novo:', payload.new.status)
          setTransaction(payload.new as Transaction)

          // Toast de notificação para o usuário
          if (payload.new.status !== transaction.status) {
            const statusInfo =
              statusMap[payload.new.status as keyof typeof statusMap]
            if (statusInfo) {
              toast({
                title: 'Status Atualizado',
                description: `Status da transação: ${statusInfo.label}`,
              })
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status da subscription:', status)
      })

    return () => {
      console.log('[REALTIME] Removendo subscription')
      supabase.removeChannel(channel)
    }
  }, [transaction, supabase, toast])

  // Countdown timer
  useEffect(() => {
    if (!transaction || transaction.status !== 'pending_payment') return

    const interval = setInterval(() => {
      const now = new Date()
      const expiresAt = new Date(transaction.expires_at)
      const seconds = differenceInSeconds(expiresAt, now)

      if (seconds <= 0) {
        setTimeRemaining(0)
        clearInterval(interval)
      } else {
        setTimeRemaining(seconds)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [transaction])

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', parameters.id)
        .single()

      if (error) throw error

      setTransaction(data)
    } catch (error) {
      console.error('Erro ao carregar transação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da transação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    })
  }

  const confirmPayment = async () => {
    setConfirming(true)
    try {
      // Aqui você notificaria o admin via Pushover ou outro sistema
      // Por enquanto, apenas mostramos uma mensagem
      toast({
        title: 'Confirmação enviada!',
        description: 'O pagamento será validado em breve.',
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a confirmação.',
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-xl font-bold text-white">₿</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HubP2P</span>
            </Link>
          </div>
        </header>
        <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
          <Skeleton className="h-12 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-xl font-bold text-white">₿</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HubP2P</span>
            </Link>
          </div>
        </header>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Transação não encontrada</CardTitle>
              <CardDescription>
                A transação solicitada não foi encontrada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Voltar ao Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusInfo = statusMap[transaction.status as keyof typeof statusMap]
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header com Logo */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-xl font-bold text-white">₿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HubP2P</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Pagamento do Depósito
              </h1>
              <p className="text-muted-foreground">
                Transação #{transaction.transaction_number}
              </p>
            </div>
            <Badge
              variant={statusInfo.variant}
              className="flex items-center gap-1"
            >
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Timer */}
        {transaction.status === 'pending_payment' && timeRemaining > 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-warning/20 flex h-12 w-12 items-center justify-center rounded-full">
                  <Clock className="text-warning h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Tempo restante para pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Complete o pagamento antes do prazo expirar
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums">
                  {formatTime(timeRemaining)}
                </p>
                <p className="text-xs text-muted-foreground">minutos</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados de Pagamento */}
        {transaction.status === 'pending_payment' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {transaction.payment_method === 'pix' ? (
                  <>Dados para Pagamento PIX</>
                ) : (
                  <>Dados para TED</>
                )}
              </CardTitle>
              <CardDescription>
                {transaction.payment_method === 'pix'
                  ? 'Use a chave PIX abaixo para realizar o pagamento'
                  : 'Realize a transferência bancária com os dados abaixo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {transaction.payment_method === 'pix' ? (
                <>
                  {/* Chave PIX */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Chave PIX</label>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                        {transaction.pix_key || 'pix@example.com'}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            transaction.pix_key || 'pix@example.com',
                            'Chave PIX',
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Valor</label>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.amount_brl)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            transaction.amount_brl.toFixed(2),
                            'Valor',
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Dados bancários para TED
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Banco</label>
                      <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                        {transaction.bank_name || 'Banco Example'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Favorecido</label>
                      <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                        {transaction.bank_account_holder ||
                          'Nome do Favorecido'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Agência</label>
                      <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                        {transaction.bank_account_agency || '0001'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Conta</label>
                      <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                        {transaction.bank_account_number || '12345-6'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor</label>
                    <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount_brl)}
                    </p>
                  </div>
                </div>
              )}

              {/* Botão de Confirmação */}
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="mb-3 text-sm">
                  Após realizar o pagamento, clique no botão abaixo para
                  confirmar. Sua transação será processada automaticamente.
                </p>
                <Button
                  onClick={confirmPayment}
                  disabled={confirming}
                  className="w-full"
                >
                  {confirming ? 'Confirmando...' : 'Já realizei o pagamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de sucesso quando cripto for enviada */}
        {transaction.status === 'sent' && transaction.tx_hash && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Cripto enviada com sucesso!
                  </h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Sua criptomoeda foi enviada para o endereço fornecido.
                  </p>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-green-900 dark:text-green-100">
                      Hash da Transação:
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 rounded bg-green-100 px-2 py-1 text-xs dark:bg-green-900">
                        {transaction.tx_hash}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          copyToClipboard(transaction.tx_hash || '', 'Hash')
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Transação */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Transação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor em BRL:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(transaction.amount_brl)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Você receberá:</span>
                <span className="font-medium">
                  {cryptoSymbol === 'BTC' ? '₿' : '$'}
                  {cryptoAmount?.toLocaleString('pt-BR', {
                    minimumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                    maximumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                  }) || '0,00'}{' '}
                  {cryptoSymbol}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rede:</span>
                <span className="font-medium">
                  {networkLabels[
                    transaction.crypto_network as keyof typeof networkLabels
                  ] || transaction.crypto_network}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Endereço da Carteira:
                </span>
                <div className="flex items-center gap-2">
                  <span className="max-w-[200px] truncate font-mono text-xs">
                    {transaction.wallet_address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      copyToClipboard(transaction.wallet_address, 'Endereço')
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span className="font-medium">
                  {format(
                    new Date(transaction.created_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expira em:</span>
                <span className="font-medium">
                  {format(
                    new Date(transaction.expires_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
