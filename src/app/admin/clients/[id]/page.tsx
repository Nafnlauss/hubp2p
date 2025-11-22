import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MapPin,
  User,
  Wallet,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const resolvedParameters = await params
  const supabase = await createClient()

  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParameters.id)
    .single()

  if (!client) {
    notFound()
  }

  // Buscar email do auth.users
  const { data: userData } = await supabase.auth.admin.getUserById(client.id)

  // Buscar transações do cliente
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', resolvedParameters.id)
    .order('created_at', { ascending: false })

  const statusMap = {
    pending_payment: { label: 'Aguardando Pagamento', variant: 'warning' },
    payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
    converting: { label: 'Convertendo', variant: 'default' },
    sent: { label: 'Enviado', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    expired: { label: 'Expirado', variant: 'destructive' },
  } as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para clientes
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {client.full_name}
            </h1>
            <p className="text-muted-foreground">
              {userData?.user?.email || ''}
            </p>
          </div>
          {client.kyc_status === 'approved' ? (
            <Badge
              variant="default"
              className="flex items-center gap-1 bg-green-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              KYC Aprovado
            </Badge>
          ) : client.kyc_status === 'pending' ? (
            <Badge variant="warning">KYC Pendente</Badge>
          ) : client.kyc_status === 'rejected' ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              KYC Rejeitado
            </Badge>
          ) : (
            <Badge variant="secondary">KYC Não Iniciado</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Nome Completo
                </div>
                <p className="text-sm">{client.full_name}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  CPF
                </div>
                <p className="font-mono text-sm">{client.cpf}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Data de Nascimento
                </div>
                <p className="text-sm">
                  {client.birth_date
                    ? format(new Date(client.birth_date), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })
                    : '-'}
                </p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Cadastrado em
                </div>
                <p className="text-sm">
                  {format(
                    new Date(client.created_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  E-mail
                </div>
                <p className="text-sm">{userData?.user?.email || ''}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Telefone
                </div>
                <p className="text-sm">{client.phone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Logradouro
                </div>
                <p className="text-sm">{client.address_street || '-'}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Número
                  </div>
                  <p className="text-sm">{client.address_number || '-'}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Complemento
                  </div>
                  <p className="text-sm">{client.address_complement || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Bairro
                  </div>
                  <p className="text-sm">
                    {client.address_neighborhood || '-'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    CEP
                  </div>
                  <p className="font-mono text-sm">
                    {client.address_zip_code || '-'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Cidade
                  </div>
                  <p className="text-sm">{client.address_city || '-'}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Estado
                  </div>
                  <p className="text-sm">{client.address_state || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carteiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Carteiras de Criptomoedas
            </CardTitle>
            <CardDescription>
              Endereços de carteira cadastrados pelo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {[
                  ...new Set(
                    transactions.map((t) => ({
                      network: t.crypto_network,
                      address: t.wallet_address,
                    })),
                  ),
                ].map((wallet, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      {wallet.network}
                    </label>
                    <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
                      {wallet.address}
                    </p>
                    {index <
                      new Set(
                        transactions.map((t) => ({
                          network: t.crypto_network,
                          address: t.wallet_address,
                        })),
                      ).size -
                        1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma carteira cadastrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Todas as transações realizadas por este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Rede</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const status =
                    statusMap[transaction.status as keyof typeof statusMap] ||
                    statusMap.pending_payment
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        #{transaction.transaction_number}
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
                      <TableCell className="uppercase">
                        {transaction.payment_method}
                      </TableCell>
                      <TableCell className="uppercase">
                        {transaction.crypto_network}
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
