'use client'

import { Plus, Power, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  createApiPaymentAccount,
  deleteApiPaymentAccount,
  getApiPaymentAccounts,
  toggleApiAccountActive,
  type ApiPaymentAccount,
} from '@/app/actions/api-payment-accounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function ApiPaymentAccountsPage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<ApiPaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [pixKey, setPixKey] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await getApiPaymentAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas de pagamento.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!pixKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma chave PIX válida.',
        variant: 'destructive',
      })
      return
    }

    setAdding(true)
    try {
      await createApiPaymentAccount({ pix_key: pixKey })
      toast({
        title: 'Sucesso',
        description: 'Chave PIX adicionada com sucesso.',
      })
      setPixKey('')
      setShowDialog(false)
      await loadAccounts()
    } catch (error) {
      console.error('Erro ao adicionar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a chave PIX.',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  const handleToggleActive = async (accountId: string) => {
    try {
      await toggleApiAccountActive(accountId)
      toast({
        title: 'Sucesso',
        description: 'Status da conta atualizado.',
      })
      await loadAccounts()
    } catch (error) {
      console.error('Erro ao atualizar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da conta.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta chave PIX?')) {
      return
    }

    try {
      await deleteApiPaymentAccount(accountId)
      toast({
        title: 'Sucesso',
        description: 'Chave PIX deletada com sucesso.',
      })
      await loadAccounts()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a chave PIX.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chaves PIX API</h1>
          <p className="text-muted-foreground">
            Gerenciar chaves PIX para sistema API
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chaves PIX API</h1>
          <p className="text-muted-foreground">
            Gerenciar chaves PIX para sistema API (sem KYC)
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Chave PIX
        </Button>
      </div>

      {/* Accounts List */}
      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-lg text-muted-foreground">
                Nenhuma chave PIX cadastrada
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Chave
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-mono">{account.pix_key}</CardTitle>
                    <CardDescription>
                      Criado em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={account.is_active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleActive(account.id)}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• Apenas uma chave PIX pode estar ativa por vez</p>
          <p>• Esta chave será usada para todas as transações do sistema API</p>
          <p>• Sistema API não requer KYC dos clientes</p>
          <p>• Gerencie com cuidado - mudanças afetam novas transações imediatamente</p>
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Chave PIX</DialogTitle>
            <DialogDescription>
              Digite a chave PIX que será usada para receber pagamentos do sistema API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Input
                id="pix-key"
                placeholder="email@exemplo.com ou CPF/CNPJ"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddAccount()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAccount} disabled={adding}>
              {adding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
