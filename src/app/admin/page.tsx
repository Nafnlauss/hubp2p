import {
  ArrowUpRight,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Buscar estatísticas
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  const { count: pendingTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_payment')

  // Buscar valor total depositado
  const { data: totalAmountData } = await supabase
    .from('transactions')
    .select('amount_brl')
    .in('status', ['payment_received', 'converting', 'sent'])

  const totalAmount =
    totalAmountData?.reduce(
      (sum, transaction) => sum + transaction.amount_brl,
      0,
    ) || 0

  // Buscar transações recentes
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(
      `
      *,
      clients (
        full_name,
        email
      )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(5)

  const statusMap = {
    pending_payment: { label: 'Aguardando Pagamento', variant: 'warning' },
    payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
    converting: { label: 'Convertendo', variant: 'default' },
    sent: { label: 'Enviado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    expired: { label: 'Expirado', variant: 'destructive' },
  } as const

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Visão geral do sistema HubP2P
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">
                  Total de Clientes
                </p>
                <p className="mt-2 text-4xl font-bold">{totalClients || 0}</p>
                <p className="mt-1 text-xs opacity-75">clientes cadastrados</p>
              </div>
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">
                  Total de Transações
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {totalTransactions || 0}
                </p>
                <p className="mt-1 text-xs opacity-75">transações realizadas</p>
              </div>
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">
                  Pagamentos Pendentes
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {pendingTransactions || 0}
                </p>
                <p className="mt-1 text-xs opacity-75">aguardando confirmação</p>
              </div>
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <Clock className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Volume Total</p>
                <p className="mt-2 text-3xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalAmount)}
                </p>
                <p className="mt-1 text-xs opacity-75">em transações</p>
              </div>
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-purple-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Transações Recentes
            </CardTitle>
            <CardDescription className="mt-2">
              Últimas 5 transações realizadas no sistema
            </CardDescription>
          </div>
          <Button
            variant="outline"
            asChild
            className="border-purple-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white"
          >
            <Link href="/admin/transactions">
              Ver todas
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {recentTransactions && recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-100">
                  <TableHead className="font-semibold">Transação</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Método</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => {
                  const status =
                    statusMap[
                      transaction.status as keyof typeof statusMap
                    ] || statusMap.pending_payment
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
                            {
                              (
                                transaction.clients as unknown as {
                                  full_name: string
                                }
                              )?.full_name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {
                              (
                                transaction.clients as unknown as {
                                  email: string
                                }
                              )?.email
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
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
                        <Badge
                          variant={
                            status.variant as
                              | 'default'
                              | 'secondary'
                              | 'destructive'
                              | 'outline'
                          }
                          className="font-medium"
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-purple-100"
                        >
                          <Link href={`/admin/transactions`}>
                            Ver detalhes
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg bg-purple-50/50 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
