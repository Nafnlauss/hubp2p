import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Eye, UserCircle2, XCircle } from 'lucide-react'
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

export default async function ClientsPage() {
  const supabase = await createClient()

  // Buscar todos os clientes
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Buscar contagem de transações para cada perfil
  const clients = await Promise.all(
    (profilesData || []).map(async (profile) => {
      // Buscar email do auth.users
      const { data: userData } = await supabase.auth.admin.getUserById(
        profile.id,
      )

      // Buscar contagem de transações
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)

      return {
        ...profile,
        email: userData?.user?.email || '',
        transactions: count || 0,
      }
    }),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-3 shadow-lg">
          <UserCircle2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Clientes
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Gerenciamento de todos os clientes cadastrados
          </p>
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-purple-100 shadow-lg">
        <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <UserCircle2 className="h-5 w-5 text-white" />
            </div>
            Lista de Clientes
          </CardTitle>
          <CardDescription className="mt-2">
            Total de{' '}
            <span className="font-semibold text-purple-600">
              {clients?.length || 0}
            </span>{' '}
            clientes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {clients && clients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-100">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">E-mail</TableHead>
                    <TableHead className="font-semibold">CPF</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold">KYC</TableHead>
                    <TableHead className="font-semibold">Transações</TableHead>
                    <TableHead className="font-semibold">Cadastro</TableHead>
                    <TableHead className="text-right font-semibold">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => {
                    const transactionCount = client.transactions || 0

                    return (
                      <TableRow
                        key={client.id}
                        className="border-purple-50 transition-colors hover:bg-purple-50/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold">{client.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600">
                            {client.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm font-medium">
                            {client.cpf}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{client.phone || '-'}</p>
                        </TableCell>
                        <TableCell>
                          {client.kyc_status === 'approved' ? (
                            <Badge
                              variant="default"
                              className="flex w-fit items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Aprovado
                            </Badge>
                          ) : client.kyc_status === 'pending' ? (
                            <Badge
                              variant="warning"
                              className="shadow-sm"
                            >
                              Pendente
                            </Badge>
                          ) : client.kyc_status === 'rejected' ? (
                            <Badge
                              variant="destructive"
                              className="flex w-fit items-center gap-1 shadow-sm"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejeitado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shadow-sm">
                              Não iniciado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center rounded-full bg-purple-100 px-3 py-1">
                            <span className="text-sm font-semibold text-purple-700">
                              {transactionCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(
                              new Date(client.created_at),
                              'dd/MM/yyyy',
                              { locale: ptBR },
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover:bg-purple-100"
                          >
                            <Link href={`/admin/clients/${client.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </Link>
                          </Button>
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
                <UserCircle2 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Nenhum cliente cadastrado
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
