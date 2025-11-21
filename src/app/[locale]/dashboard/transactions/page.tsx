'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Copy, ExternalLink, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

interface Transaction {
  id: string
  transaction_number: string
  payment_method: 'pix' | 'ted'
  amount_brl: number
  crypto_network: string
  crypto_amount: number | null
  wallet_address: string
  status: string
  tx_hash: string | null
  created_at: string
  payment_confirmed_at: string | null
  crypto_sent_at: string | null
}

const statusMap = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    variant: 'warning' as const,
  },
  payment_received: { label: 'Pagamento Recebido', variant: 'info' as const },
  converting: { label: 'Convertendo', variant: 'info' as const },
  sent: { label: 'Enviado', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const },
  expired: { label: 'Expirado', variant: 'destructive' as const },
}

const networkMap = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BSC',
  solana: 'Solana',
}

const paymentMethodMap = {
  pix: 'PIX',
  ted: 'TED',
}

export default function TransactionsPage() {
  const router = useRouter()
  const searchParameters = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    filterTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, statusFilter, searchQuery])

  const loadTransactions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas transações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.transaction_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          t.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tx_hash?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    })
  }

  const getExplorerUrl = (network: string, txHash: string) => {
    const explorers: Record<string, string> = {
      bitcoin: `https://blockchair.com/bitcoin/transaction/${txHash}`,
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      solana: `https://solscan.io/tx/${txHash}`,
    }
    return explorers[network] || '#'
  }

  // Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
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
          Minhas Transações
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Acompanhe o histórico completo de suas transações
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Filtros
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Filtre suas transações por status ou pesquise por número
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, carteira ou hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending_payment">
                  Aguardando Pagamento
                </SelectItem>
                <SelectItem value="payment_received">
                  Pagamento Recebido
                </SelectItem>
                <SelectItem value="converting">Convertendo</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {currentTransactions.length} de{' '}
              {filteredTransactions.length} transações
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card className="border-none shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Transações
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {currentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                <Search className="h-8 w-8 text-white" />
              </div>
              <p className="mb-6 text-lg font-medium text-gray-700">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhuma transação encontrada com os filtros aplicados.'
                  : 'Você ainda não possui transações.'}
              </p>
              <Button
                asChild
                className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                <Link href="/dashboard/deposit">Criar Novo Depósito</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor BRL</TableHead>
                      <TableHead>Rede</TableHead>
                      <TableHead>Valor Crypto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {transaction.transaction_number}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                copyToClipboard(
                                  transaction.transaction_number,
                                  'Número da transação',
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(
                            new Date(transaction.created_at),
                            'dd/MM/yyyy HH:mm',
                            { locale: ptBR },
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {paymentMethodMap[transaction.payment_method]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(
                            transaction.amount_brl,
                            'pt-BR',
                            'BRL',
                          )}
                        </TableCell>
                        <TableCell>
                          {
                            networkMap[
                              transaction.crypto_network as keyof typeof networkMap
                            ]
                          }
                        </TableCell>
                        <TableCell>
                          {transaction.crypto_amount ? (
                            <span className="font-mono text-xs">
                              {transaction.crypto_amount.toFixed(8)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusMap[
                                transaction.status as keyof typeof statusMap
                              ].variant
                            }
                          >
                            {
                              statusMap[
                                transaction.status as keyof typeof statusMap
                              ].label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {transaction.tx_hash && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={getExplorerUrl(
                                    transaction.crypto_network,
                                    transaction.tx_hash,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Explorer
                                </a>
                              </Button>
                            )}
                            {transaction.status === 'pending_payment' && (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/dashboard/deposit/${transaction.id}`}
                                >
                                  Pagar
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
