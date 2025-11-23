'use client'

import { Eye, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getUsers } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface User {
  id: string
  full_name: string
  cpf: string
  phone: string | null
  date_of_birth: string | null
  address_zip: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_city: string | null
  address_state: string | null
  is_admin: boolean
  created_at: string
  kyc_verifications: Array<{
    id: string
    status: string
    created_at: string
    updated_at: string
  }>
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const result = await getUsers()

    if (result.success && result.data) {
      setUsers(result.data as any)
    } else {
      console.error('Erro ao carregar usuários:', result.error)
    }

    setLoading(false)
  }

  function handleViewDetails(user: User) {
    setSelectedUser(user)
    setDetailsOpen(true)
  }

  const filteredUsers = users.filter((user) => {
    if (!search) return true

    const searchLower = search.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.cpf.includes(searchLower)
    )
  })

  const getKycStatus = (user: User) => {
    if (
      !user.kyc_verifications ||
      !Array.isArray(user.kyc_verifications) ||
      user.kyc_verifications.length === 0
    ) {
      return <Badge variant="secondary">Não Verificado</Badge>
    }

    // Ordena por data de atualização mais recente
    const sortedKyc = [...user.kyc_verifications].sort((a, b) => {
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      )
    })

    const latestKyc = sortedKyc[0]

    // Verifica se latestKyc existe e tem status
    if (!latestKyc || !latestKyc.status) {
      return <Badge variant="secondary">Não Verificado</Badge>
    }

    switch (latestKyc.status) {
      case 'approved': {
        return <Badge variant="success">Aprovado</Badge>
      }
      case 'pending': {
        return <Badge variant="warning">Pendente</Badge>
      }
      case 'in_review': {
        return <Badge variant="default">Em Análise</Badge>
      }
      case 'rejected': {
        return <Badge variant="destructive">Rejeitado</Badge>
      }
      default: {
        return <Badge variant="secondary">Não Verificado</Badge>
      }
    }
  }

  const isKycApproved = (user: User) => {
    if (
      !user.kyc_verifications ||
      !Array.isArray(user.kyc_verifications) ||
      user.kyc_verifications.length === 0
    ) {
      return false
    }
    return user.kyc_verifications.some((kyc) => kyc.status === 'approved')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="mt-2 text-gray-600">
          Visualize e gerencie todos os usuários da plataforma
        </p>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status KYC</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.cpf}
                      </TableCell>
                      <TableCell>{user.phone || 'Não informado'}</TableCell>
                      <TableCell>{getKycStatus(user)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-gray-500"
                    >
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.is_admin).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              KYC Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => isKycApproved(u)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes do Usuário */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do cadastro
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Informações Pessoais */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">
                      Nome Completo
                    </Label>
                    <p className="mt-1 font-medium">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">CPF</Label>
                    <p className="mt-1 font-mono text-sm">{selectedUser.cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Telefone</Label>
                    <p className="mt-1">
                      {selectedUser.phone || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">
                      Data de Nascimento
                    </Label>
                    <p className="mt-1">
                      {selectedUser.date_of_birth
                        ? new Date(
                            selectedUser.date_of_birth,
                          ).toLocaleDateString('pt-BR')
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Endereço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">CEP</Label>
                    <p className="mt-1">
                      {selectedUser.address_zip || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Rua</Label>
                    <p className="mt-1">
                      {selectedUser.address_street || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Número</Label>
                    <p className="mt-1">
                      {selectedUser.address_number || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Complemento</Label>
                    <p className="mt-1">
                      {selectedUser.address_complement || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cidade</Label>
                    <p className="mt-1">
                      {selectedUser.address_city || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Estado</Label>
                    <p className="mt-1">
                      {selectedUser.address_state || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações da Conta */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Informações da Conta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Status KYC</Label>
                    <div className="mt-1">{getKycStatus(selectedUser)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">
                      Data de Cadastro
                    </Label>
                    <p className="mt-1">
                      {new Date(selectedUser.created_at).toLocaleDateString(
                        'pt-BR',
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">
                      Tipo de Conta
                    </Label>
                    <p className="mt-1">
                      {selectedUser.is_admin ? (
                        <Badge variant="default">Administrador</Badge>
                      ) : (
                        <Badge variant="secondary">Usuário</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Histórico de KYC */}
              {selectedUser.kyc_verifications &&
                selectedUser.kyc_verifications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 font-semibold text-gray-900">
                        Histórico de Verificações KYC
                      </h3>
                      <div className="space-y-2">
                        {[...selectedUser.kyc_verifications]
                          .sort((a, b) => {
                            return (
                              new Date(b.updated_at || b.created_at).getTime() -
                              new Date(a.updated_at || a.created_at).getTime()
                            )
                          })
                          .map((kyc) => (
                            <div
                              key={kyc.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-sm font-medium">
                                    Verificação #{kyc.id.slice(0, 8)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Atualizado em:{' '}
                                    {new Date(
                                      kyc.updated_at || kyc.created_at,
                                    ).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div>
                                {kyc.status === 'approved' && (
                                  <Badge variant="success">Aprovado</Badge>
                                )}
                                {kyc.status === 'pending' && (
                                  <Badge variant="warning">Pendente</Badge>
                                )}
                                {kyc.status === 'in_review' && (
                                  <Badge variant="default">Em Análise</Badge>
                                )}
                                {kyc.status === 'rejected' && (
                                  <Badge variant="destructive">Rejeitado</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
