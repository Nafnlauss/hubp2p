import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  DollarSign,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

import { getDashboardStats } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const stats = await getDashboardStats()
  const supabase = await createClient()

  // Buscar transações pendentes
  const { data: pendingTransactions } = await supabase
    .from('transactions')
    .select(
      `
      *,
      profiles (
        full_name,
        cpf
      )
    `,
    )
    .in('status', ['pending_payment', 'payment_received', 'converting'])
    .order('created_at', { ascending: false })
    .limit(10)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string
        variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'
      }
    > = {
      pending_payment: { label: 'Aguardando Pagamento', variant: 'warning' },
      payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
      converting: { label: 'Convertendo', variant: 'default' },
      sent: { label: 'Enviado', variant: 'success' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      expired: { label: 'Expirado', variant: 'destructive' },
    }

    const status_info = statusMap[status] || {
      label: status,
      variant: 'default' as const,
    }
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>
  }

  const statCards = [
    {
      title: 'Transações Hoje',
      value: stats.todayCount,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    },
    {
      title: 'Valor Total Hoje',
      value: formatCurrency(stats.todayTotal),
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    },
    {
      title: 'Pendentes',
      value: stats.pendingCount,
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      valueColor: 'text-orange-600',
    },
    {
      title: 'Aprovadas Hoje',
      value: stats.approvedCount,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      valueColor: 'text-green-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header com gradiente */}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 shadow-xl">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Dashboard Administrativo
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Visão geral das operações da plataforma
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas com Gradientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Background gradient sutil */}
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-5 ${stat.bgGradient}`}
              />

              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-xl p-2 shadow-md ${stat.iconBg}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div
                  className={`text-3xl font-bold ${stat.valueColor || 'text-gray-900'}`}
                >
                  {stat.value}
                </div>
              </CardContent>

              {/* Borda gradiente no hover */}
              <div
                className={`absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${stat.gradient}`}
              />
            </Card>
          )
        })}
      </div>

      {/* Gráfico - Últimos 7 dias com Gradientes */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Transações dos Últimos 7 Dias
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {stats.chartData.map((item, index) => {
              const percentage =
                (item.count /
                  Math.max(...stats.chartData.map((d) => d.count))) *
                100
              return (
                <div
                  key={index}
                  className="group flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <div className="w-28 text-sm font-semibold text-gray-700">
                    {item.date}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md transition-all duration-500 ease-out"
                          style={{
                            width: `${percentage}%`,
                            minWidth: '3rem',
                          }}
                        />
                      </div>
                      <div className="flex min-w-[140px] flex-col items-end">
                        <span className="text-sm font-bold text-gray-900">
                          {item.count} transação{item.count !== 1 ? 'ões' : ''}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transações Pendentes com design melhorado */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 p-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Transações Pendentes de Ação
              </CardTitle>
            </div>
            <Link
              href="/admin/transactions"
              className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              Ver todas
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="font-bold text-gray-700">
                    Número
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Usuário
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Valor
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Método
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Data
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransactions && pendingTransactions.length > 0 ? (
                  pendingTransactions.map((transaction: any) => (
                    <TableRow
                      key={transaction.id}
                      className="transition-colors hover:bg-purple-50/30"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-gray-700">
                        #{transaction.transaction_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {transaction.profiles.full_name}
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            {transaction.profiles.cpf}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">
                        {formatCurrency(transaction.amount_brl)}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-700">
                          {transaction.payment_method}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString(
                          'pt-BR',
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/transactions/${transaction.id}`}
                          className="group inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-purple-600"
                        >
                          Ver detalhes
                          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-12 w-12 text-gray-300" />
                        <p className="font-semibold">
                          Nenhuma transação pendente
                        </p>
                        <p className="text-sm text-gray-400">
                          Todas as transações foram processadas!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
