'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Filter,
  Loader2,
  Receipt,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { updateTransactionStatus } from '@/app/actions/admin-transactions'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface Transaction {
  id: string
  transaction_number: string
  payment_method: 'pix' | 'ted'
  amount_brl: number
  crypto_network: string
  wallet_address: string
  status: string
  expires_at: string
  created_at: string
  user_id: string
  profiles?: {
    full_name: string
  }
}

const statusMap = {
  pending_payment: { label: 'Aguardando Pagamento', variant: 'warning' },
  payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
  converting: { label: 'Convertendo', variant: 'default' },
  sent: { label: 'Enviado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'destructive' },
} as const

export default function TransactionsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [statusFilter])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('transactions')
        .select(
          `
          *,
          profiles (
            full_name
          )
        `,
        )
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as transações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    transactionId: string,
    newStatus: string,
  ) => {
    setUpdatingStatus(transactionId)
    try {
      const result = await updateTransactionStatus(transactionId, newStatus)

      if (result.success) {
        toast({
          title: 'Status atualizado!',
          description: 'O status da transação foi atualizado com sucesso.',
        })
        await loadTransactions()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível atualizar o status.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o status.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-3 shadow-lg">
          <Receipt className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Transações
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Gerenciamento de todas as transações do sistema
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white p-2">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[240px] border-purple-200 bg-white shadow-sm">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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
            <div className="rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="text-sm font-semibold text-purple-700">
                {transactions.length} transações encontradas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-purple-100 shadow-lg">
        <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            Lista de Transações
          </CardTitle>
          <CardDescription className="mt-2">
            Clique nos botões de ação para alterar o status das transações
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-100">
                    <TableHead className="font-semibold">Transação</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Método</TableHead>
                    <TableHead className="font-semibold">
                      Rede/Carteira
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const status =
                      statusMap[transaction.status as keyof typeof statusMap] ||
                      statusMap.pending_payment
                    const isUpdating = updatingStatus === transaction.id

                    return (
                      <TableRow
                        key={transaction.id}
                        className="border-purple-50 transition-colors hover:bg-purple-50/50"
                      >
                        <TableCell className="font-mono font-semibold">
                          #{transaction.transaction_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.profiles?.full_name || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(transaction.created_at),
                            'dd/MM/yyyy HH:mm',
                            { locale: ptBR },
                          )}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(transaction.amount_brl)}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold uppercase text-purple-700">
                            {transaction.payment_method}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs font-medium uppercase">
                              {transaction.crypto_network}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="max-w-[120px] truncate font-mono text-xs text-muted-foreground">
                                {transaction.wallet_address}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(
                                    transaction.wallet_address,
                                    'Endereço',
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status.variant as
                                | 'default'
                                | 'secondary'
                                | 'destructive'
                                | 'outline'
                            }
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {transaction.status === 'pending_payment' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(
                                    transaction.id,
                                    'payment_received',
                                  )
                                }
                                disabled={isUpdating}
                                className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-600 hover:to-emerald-600 hover:text-white"
                              >
                                {isUpdating ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Pagamento Recebido
                              </Button>
                            )}
                            {transaction.status === 'payment_received' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(transaction.id, 'sent')
                                }
                                disabled={isUpdating}
                                className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-600 hover:to-cyan-600 hover:text-white"
                              >
                                {isUpdating ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <ArrowUpRight className="mr-2 h-4 w-4" />
                                )}
                                Cripto Enviada
                              </Button>
                            )}
                            {transaction.status === 'sent' && (
                              <Badge variant="success" className="px-3 py-1">
                                Concluído
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg bg-purple-50/50">
              <div className="text-center">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Nenhuma transação encontrada
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
