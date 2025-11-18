"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { toggleAdmin } from "@/app/actions/admin"
import { Search, Shield, ShieldOff } from "lucide-react"

interface User {
  id: string
  full_name: string
  cpf: string
  phone: string | null
  is_admin: boolean
  created_at: string
  kyc_verifications: Array<{
    status: string
  }>
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        kyc_verifications (
          status
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setUsers(data as any)
    }

    setLoading(false)
  }

  async function handleToggleAdmin(userId: string, currentStatus: boolean) {
    setActionLoading(userId)

    const result = await toggleAdmin(userId, !currentStatus)

    if (result.success) {
      loadUsers()
    } else {
      alert(`Erro: ${result.error}`)
    }

    setActionLoading(null)
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
    if (!user.kyc_verifications || user.kyc_verifications.length === 0) {
      return <Badge variant="secondary">Não Verificado</Badge>
    }

    const latestKyc = user.kyc_verifications[0]

    switch (latestKyc.status) {
      case "approved":
        return <Badge variant="success">Aprovado</Badge>
      case "pending":
        return <Badge variant="warning">Pendente</Badge>
      case "in_review":
        return <Badge variant="default">Em Análise</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="secondary">Não Verificado</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="mt-2 text-gray-600">Visualize e gerencie todos os usuários da plataforma</p>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status KYC</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{user.cpf}</TableCell>
                      <TableCell>{user.phone || "Não informado"}</TableCell>
                      <TableCell>{getKycStatus(user)}</TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="success">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Usuário</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={user.is_admin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={actionLoading === user.id}
                        >
                          {user.is_admin ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Tornar Admin
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {users.filter((u) =>
                u.kyc_verifications?.[0]?.status === "approved"
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
