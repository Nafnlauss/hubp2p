'use client'

import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  QrCode,
  Receipt,
  Search,
  Settings,
  Trash2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getAdminTransactions } from '@/app/actions/get-admin-transactions'
import {
  deleteApiPaymentAccount,
  getApiPaymentAccounts,
  toggleApiAccountActive,
} from '@/app/actions/api-payment-accounts'
import { getApiTransactions } from '@/app/actions/api-transactions'
import type { ApiTransaction } from '@/app/actions/api-transactions'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApiPaymentAccount {
  id: string
  pix_key: string
  pix_qr_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface HubTransaction {
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

const networkLabels: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  polygon: 'Polygon (MATIC)',
  bsc: 'Binance Smart Chain (BNB)',
  solana: 'Solana (SOL)',
  tron: 'Tron (TRX)',
}

export default function TransactionsPage() {
  // HUB States
  const [hubTransactions, setHubTransactions] = useState<HubTransaction[]>([])
  const [hubLoading, setHubLoading] = useState(true)
  const [hubSearch, setHubSearch] = useState('')
  const [hubStatusFilter, setHubStatusFilter] = useState('all')
  const [hubMethodFilter, setHubMethodFilter] = useState('all')

  // API States
  const [apiTransactions, setApiTransactions] = useState<ApiTransaction[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiSearch, setApiSearch] = useState('')
  const [apiStatusFilter, setApiStatusFilter] = useState('all')

  // API Payment Accounts States
  const [apiPaymentAccounts, setApiPaymentAccounts] = useState<
    ApiPaymentAccount[]
  >([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  useEffect(() => {
    loadHubTransactions()
  }, [hubStatusFilter, hubMethodFilter])

  useEffect(() => {
    loadApiTransactions()
    loadApiPaymentAccounts()
  }, [apiStatusFilter])

  async function loadHubTransactions() {
    setHubLoading(true)

    const result = await getAdminTransactions({
      status: hubStatusFilter,
      method: hubMethodFilter,
    })

    if (result.success && result.data) {
      setHubTransactions(result.data)
    }

    setHubLoading(false)
  }

  async function loadApiTransactions() {
    setApiLoading(true)
    try {
      const data = await getApiTransactions({
        status: apiStatusFilter !== 'all' ? apiStatusFilter : undefined,
      })
      setApiTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações API:', error)
    } finally {
      setApiLoading(false)
    }
  }

  async function loadApiPaymentAccounts() {
    setAccountsLoading(true)
    try {
      const accounts = await getApiPaymentAccounts()
      setApiPaymentAccounts(accounts)
    } catch (error) {
      console.error('Erro ao carregar contas de pagamento:', error)
    } finally {
      setAccountsLoading(false)
    }
  }

  async function handleToggleAccountActive(accountId: string) {
    try {
      await toggleApiAccountActive(accountId)
      await loadApiPaymentAccounts()
    } catch (error) {
      console.error('Erro ao ativar/desativar conta:', error)
      alert('Erro ao ativar/desativar conta')
    }
  }

  async function handleDeleteAccount(accountId: string) {
    if (!confirm('Tem certeza que deseja deletar esta conta de pagamento?')) {
      return
    }

    try {
      await deleteApiPaymentAccount(accountId)
      await loadApiPaymentAccounts()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      alert('Erro ao deletar conta')
    }
  }

  const filteredHubTransactions = hubTransactions.filter((transaction) => {
    if (!hubSearch) return true

    const searchLower = hubSearch.toLowerCase()
    return (
      transaction.transaction_number.toLowerCase().includes(searchLower) ||
      transaction.profiles.cpf.includes(searchLower) ||
      transaction.profiles.full_name.toLowerCase().includes(searchLower)
    )
  })

  const filteredApiTransactions = apiTransactions.filter((transaction) => {
    if (!apiSearch) return true

    const searchLower = apiSearch.toLowerCase()
    return (
      transaction.transaction_number.toLowerCase().includes(searchLower) ||
      transaction.wallet_address.toLowerCase().includes(searchLower)
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
        icon: React.ElementType
        className: string
      }
    > = {
      pending_payment: {
        label: 'Aguardando Pagamento',
        icon: Clock,
        className:
          'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200',
      },
      payment_received: {
        label: 'Pagamento Recebido',
        icon: CheckCircle,
        className:
          'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
      },
      converting: {
        label: 'Convertendo',
        icon: Loader2,
        className:
          'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
      },
      sent: {
        label: 'Enviado',
        icon: CheckCircle,
        className:
          'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
      },
      cancelled: {
        label: 'Cancelado',
        icon: XCircle,
        className:
          'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
      },
      expired: {
        label: 'Expirado',
        icon: AlertCircle,
        className:
          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300',
      },
    }

    const statusInfo = statusMap[status] || {
      label: status,
      icon: AlertCircle,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    }

    const StatusIcon = statusInfo.icon

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
      >
        <StatusIcon
          className={`h-3.5 w-3.5 ${status === 'converting' ? 'animate-spin' : ''}`}
        />
        {statusInfo.label}
      </div>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodInfo = {
      pix: {
        label: 'PIX',
        className: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
      },
      ted: {
        label: 'TED',
        className: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
      },
    }

    const info = methodInfo[method as keyof typeof methodInfo] || {
      label: method.toUpperCase(),
      className: 'bg-gray-500 text-white',
    }

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase shadow-sm ${info.className}`}
      >
        {info.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 p-3 shadow-xl">
          <Receipt className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Gerenciar Transações
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Visualize e gerencie transações de hubp2p.com e api.hubp2p
            separadamente
          </p>
        </div>
      </div>

      <Tabs defaultValue="hub" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 p-1.5 shadow-md">
          <TabsTrigger
            value="hub"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Building2 className="mr-2 h-4 w-4" />
            hubp2p.com
          </TabsTrigger>
          <TabsTrigger
            value="api"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <QrCode className="mr-2 h-4 w-4" />
            api.hubp2p
          </TabsTrigger>
        </TabsList>

        {/* HUB Tab */}
        <TabsContent value="hub" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 p-2">
                  <Search className="h-5 w-5 text-white" />
                </div>
                Filtros - hubp2p.com
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, CPF ou nome..."
                    value={hubSearch}
                    onChange={(e) => setHubSearch(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <Select value={hubStatusFilter} onValueChange={setHubStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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

                <Select value={hubMethodFilter} onValueChange={setHubMethodFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {hubLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                  <p className="mt-4 text-sm font-medium text-gray-600">
                    Carregando transações...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-bold text-gray-700">
                          ID
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Usuário
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Valor BRL
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Método
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Rede
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
                      {filteredHubTransactions.length > 0 ? (
                        filteredHubTransactions.map((transaction) => (
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
                              {getPaymentMethodBadge(transaction.payment_method)}
                            </TableCell>
                            <TableCell className="text-sm font-medium capitalize text-gray-700">
                              {transaction.crypto_network}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(transaction.status)}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-600">
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
                              <Link href={`/admin/transactions/${transaction.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="group border-purple-200 text-purple-600 hover:border-purple-600 hover:bg-purple-600 hover:text-white"
                                >
                                  Ver detalhes
                                  <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-12 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Receipt className="h-12 w-12 text-gray-300" />
                              <p className="font-semibold">
                                Nenhuma transação encontrada
                              </p>
                              <p className="text-sm text-gray-400">
                                Tente ajustar os filtros
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          {/* Payment Accounts Management Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Contas de Pagamento - api.hubp2p
                </CardTitle>
                <Link href="/admin/api-payment-accounts">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Conta
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {accountsLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    Carregando contas...
                  </p>
                </div>
              ) : apiPaymentAccounts.length > 0 ? (
                <div className="space-y-3">
                  {apiPaymentAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm font-bold text-gray-900">
                            {account.pix_key}
                          </div>
                          <Badge
                            variant={account.is_active ? 'default' : 'outline'}
                            className={
                              account.is_active
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : ''
                            }
                          >
                            {account.is_active ? '✓ Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs font-medium text-gray-500">
                          Criada em{' '}
                          {new Date(account.created_at).toLocaleDateString(
                            'pt-BR',
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={account.is_active ? 'outline' : 'default'}
                          onClick={() => handleToggleAccountActive(account.id)}
                          className={
                            !account.is_active
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                              : ''
                          }
                        >
                          {account.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="bg-gradient-to-r from-red-600 to-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <QrCode className="h-12 w-12 text-gray-300" />
                  <p className="mt-3 font-semibold text-gray-600">
                    Nenhuma conta de pagamento cadastrada
                  </p>
                  <Link href="/admin/api-payment-accounts" className="mt-4">
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeira Conta
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2">
                  <Search className="h-5 w-5 text-white" />
                </div>
                Filtros - api.hubp2p
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por número ou carteira..."
                    value={apiSearch}
                    onChange={(e) => setApiSearch(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Select value={apiStatusFilter} onValueChange={setApiStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {apiLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="mt-4 text-sm font-medium text-gray-600">
                    Carregando transações...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-bold text-gray-700">
                          Número
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Valor BRL
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Valor USDT
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">
                          Rede
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
                      {filteredApiTransactions.length > 0 ? (
                        filteredApiTransactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            className="transition-colors hover:bg-blue-50/30"
                          >
                            <TableCell className="font-mono text-sm font-semibold text-gray-700">
                              #{transaction.transaction_number}
                            </TableCell>
                            <TableCell className="font-bold text-gray-900">
                              {formatCurrency(transaction.amount_brl)}
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {transaction.amount_usd
                                ? `$${transaction.amount_usd.toFixed(2)}`
                                : 'Calculando...'}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-700">
                              {networkLabels[transaction.crypto_network]}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(transaction.status)}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-600">
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
                                href={`/admin/api-transactions/${transaction.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="group border-blue-200 text-blue-600 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                                >
                                  Ver detalhes
                                  <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Button>
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
                              <Receipt className="h-12 w-12 text-gray-300" />
                              <p className="font-semibold">
                                Nenhuma transação encontrada
                              </p>
                              <p className="text-sm text-gray-400">
                                Tente ajustar os filtros
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
