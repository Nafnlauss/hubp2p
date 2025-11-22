import { Suspense } from 'react'
import { Receipt, Search, Filter } from 'lucide-react'
import Link from 'next/link'

import { getApiTransactions } from '@/app/actions/api-transactions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; search?: string }>
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_payment: { label: 'Aguardando Pagamento', variant: 'outline' },
  payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
  converting: { label: 'Convertendo', variant: 'default' },
  sent: { label: 'Enviado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'destructive' },
}

const networkLabels: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  polygon: 'Polygon (MATIC)',
  bsc: 'Binance Smart Chain (BNB)',
  solana: 'Solana (SOL)',
  tron: 'Tron (TRX)',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

async function TransactionsTable({
  status,
  search,
}: {
  status?: string
  search?: string
}) {
  const transactions = await getApiTransactions({
    status,
    searchTerm: search,
  })

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Nenhuma transação encontrada
        </h3>
        <p className="text-sm text-gray-500">
          Não há transações API para exibir no momento.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Rede</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono text-sm">
                {transaction.transaction_number}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatCurrency(transaction.amount_brl)}
                  </span>
                  {transaction.amount_usd && (
                    <span className="text-xs text-gray-500">
                      ${transaction.amount_usd.toFixed(2)} USDT
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {networkLabels[transaction.crypto_network]}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={statusLabels[transaction.status].variant}>
                  {statusLabels[transaction.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDate(transaction.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/api-transactions/${transaction.id}`}>
                    Ver detalhes
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function ApiTransactionsPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { status, search } = await searchParams

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Transações API
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie as transações do sistema API (sem KYC)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre as transações por status ou número
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Buscar por número da transação ou carteira..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </div>
            <Select name="status" defaultValue={status || 'all'}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="payment_received">Pagamento Recebido</SelectItem>
                <SelectItem value="converting">Convertendo</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
          <CardDescription>
            Lista completa de transações do sistema API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              </div>
            }
          >
            <TransactionsTable status={status} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
