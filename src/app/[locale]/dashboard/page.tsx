import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpRight, PlusCircle } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils/format'

interface DashboardPageProps {
  params: Promise<{
    locale: string
  }>
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

async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar estatísticas
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalDeposited =
    transactions
      ?.filter((t: any) => t.status === 'sent')
      .reduce((sum: number, t: any) => sum + t.amount_brl, 0) || 0

  const pendingCount =
    transactions?.filter(
      (t: any) =>
        t.status === 'pending_payment' ||
        t.status === 'payment_received' ||
        t.status === 'converting',
    ).length || 0

  const completedCount =
    transactions?.filter((t) => t.status === 'sent').length || 0

  // Últimas 5 transações
  const recentTransactions = transactions?.slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Bem-vindo de volta! Aqui está um resumo das suas transações.
          </p>
        </div>
        <Button
          asChild
          className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
        >
          <Link href={`/${locale}/dashboard/deposit`}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Novo Depósito
          </Link>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-100 shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900">
              Total Depositado
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-5 w-5 text-white"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(totalDeposited, 'pt-BR')}
            </div>
            <p className="mt-1 text-sm text-blue-700">
              Total em transações concluídas
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-orange-50 to-amber-100 shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-900">
              Transações Pendentes
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-5 w-5 text-white"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {pendingCount}
            </div>
            <p className="mt-1 text-sm text-orange-700">
              Em processamento ou aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-green-50 to-emerald-100 shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-900">
              Transações Concluídas
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-5 w-5 text-white"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {completedCount}
            </div>
            <p className="mt-1 text-sm text-green-700">
              Criptomoedas enviadas com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card className="border-none shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Transações Recentes
              </CardTitle>
              <CardDescription className="mt-1 text-base text-gray-600">
                Suas últimas 5 transações na plataforma
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              asChild
              className="text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700"
            >
              <Link href={`/${locale}/dashboard/transactions`}>
                Ver todas
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                <PlusCircle className="h-8 w-8 text-white" />
              </div>
              <p className="mb-6 text-lg font-medium text-gray-700">
                Você ainda não possui transações.
              </p>
              <Button
                asChild
                className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-base font-semibold shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                <Link href={`/${locale}/dashboard/deposit`}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Criar Primeiro Depósito
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="font-semibold text-gray-700">
                    Número
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Data
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Valor
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Rede
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <TableCell className="font-mono text-xs">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(transaction.created_at!),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR },
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount_brl, 'pt-BR')}
                    </TableCell>
                    <TableCell>
                      {networkMap[transaction.crypto_network]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[transaction.status].variant}>
                        {statusMap[transaction.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.status === 'pending_payment' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="font-medium text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Link
                            href={`/${locale}/dashboard/deposit/${transaction.id}`}
                          >
                            Ver Detalhes
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Link
                            href={`/${locale}/dashboard/transactions?id=${transaction.id}`}
                          >
                            Ver
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
