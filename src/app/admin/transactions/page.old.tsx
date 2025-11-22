'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { getAdminTransactions } from '@/app/actions/get-admin-transactions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Transaction {
  id: string
  transaction_number: string
  amount_brl: number
  payment_method: string
  crypto_network: string
  status: string
  created_at: string
  profiles: {
    full_name: string
    cpf: string
  }
}

export default function TransactionsPage() {
  const parameters = useParams()
  const locale = parameters.locale as string
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, methodFilter])

  async function loadTransactions() {
    setLoading(true)

    const result = await getAdminTransactions({
      status: statusFilter,
      method: methodFilter,
    })

    if (result.success && result.data) {
      setTransactions(result.data)
    }

    setLoading(false)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (!search) return true

    const searchLower = search.toLowerCase()
    return (
      transaction.transaction_number.toLowerCase().includes(searchLower) ||
      transaction.profiles.cpf.includes(searchLower) ||
      transaction.profiles.full_name.toLowerCase().includes(searchLower)
    )
  })

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gerenciar Transações
        </h1>
        <p className="mt-2 text-gray-600">
          Visualize e gerencie todas as transações da plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por número, CPF ou nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
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

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="ted">TED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor BRL</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Rede</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
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
                      <TableCell className="capitalize">
                        {transaction.crypto_network}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${locale}/admin/transactions/${transaction.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Ver detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-gray-500"
                    >
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
