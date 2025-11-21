import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'
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

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Administrativo
        </h1>
        <p className="mt-2 text-gray-600">
          Visão geral das operações da plataforma
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transações Hoje
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total Hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aprovadas Hoje
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico - Últimos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle>Transações dos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{item.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 rounded bg-blue-600"
                      style={{
                        width: `${(item.count / Math.max(...stats.chartData.map((d) => d.count))) * 100}%`,
                        minWidth: '2rem',
                      }}
                    />
                    <span className="text-sm font-medium">
                      {item.count} transações
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transações Pendentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações Pendentes de Ação</CardTitle>
            <Link
              href={`/${locale}/admin/transactions`}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTransactions && pendingTransactions.length > 0 ? (
                pendingTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      #{transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transaction.profiles.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.profiles.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(transaction.amount_brl)}
                    </TableCell>
                    <TableCell className="text-sm uppercase">
                      {transaction.payment_method}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString(
                        'pt-BR',
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/transactions/${transaction.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-gray-500"
                  >
                    Nenhuma transação pendente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
