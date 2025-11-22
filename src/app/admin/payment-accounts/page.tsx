'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  QrCode,
  Trash2,
  Power,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  createPaymentAccount,
  deletePaymentAccount,
  getPaymentAccounts,
  toggleAccountActive,
} from '@/app/actions/payment-accounts'
import {
  createApiPaymentAccount,
  deleteApiPaymentAccount,
  getApiPaymentAccounts,
  toggleApiAccountActive,
  type ApiPaymentAccount,
} from '@/app/actions/api-payment-accounts'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface PaymentAccount {
  id: string
  account_type: 'pix' | 'ted'
  is_active: boolean
  pix_key?: string
  bank_name?: string
  bank_code?: string
  account_holder?: string
  account_agency?: string
  account_number?: string
  created_at: string
}

const pixSchema = z.object({
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
})

const tedSchema = z.object({
  bank_name: z.string().min(1, 'Nome do banco é obrigatório'),
  bank_code: z.string().min(1, 'Código do banco é obrigatório'),
  account_holder: z.string().min(1, 'Nome do titular é obrigatório'),
  account_agency: z.string().min(1, 'Agência é obrigatória'),
  account_number: z.string().min(1, 'Número da conta é obrigatório'),
})

const apiPixSchema = z.object({
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
})

export default function PaymentAccountsPage() {
  const { toast } = useToast()

  // HUB System States
  const [pixAccounts, setPixAccounts] = useState<PaymentAccount[]>([])
  const [tedAccounts, setTedAccounts] = useState<PaymentAccount[]>([])
  const [hubLoading, setHubLoading] = useState(true)
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false)
  const [isTedDialogOpen, setIsTedDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // API.HUB System States
  const [apiAccounts, setApiAccounts] = useState<ApiPaymentAccount[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [showApiDialog, setShowApiDialog] = useState(false)
  const [apiPixKey, setApiPixKey] = useState('')
  const [apiAdding, setApiAdding] = useState(false)

  const pixForm = useForm({
    resolver: zodResolver(pixSchema),
    defaultValues: { pix_key: '' },
  })

  const tedForm = useForm({
    resolver: zodResolver(tedSchema),
    defaultValues: {
      bank_name: '',
      bank_code: '',
      account_holder: '',
      account_agency: '',
      account_number: '',
    },
  })

  useEffect(() => {
    loadHubAccounts()
    loadApiAccounts()
  }, [])

  const loadHubAccounts = async () => {
    setHubLoading(true)
    try {
      const result = await getPaymentAccounts()

      if (!result.success) {
        throw new Error(result.error)
      }

      setPixAccounts(result.data?.filter((a) => a.account_type === 'pix') || [])
      setTedAccounts(result.data?.filter((a) => a.account_type === 'ted') || [])
    } catch (error) {
      console.error('Erro ao carregar contas HUB:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas HUB.',
        variant: 'destructive',
      })
    } finally {
      setHubLoading(false)
    }
  }

  const loadApiAccounts = async () => {
    setApiLoading(true)
    try {
      const data = await getApiPaymentAccounts()
      setApiAccounts(data)
    } catch (error) {
      console.error('Erro ao carregar contas API:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas API.HUB.',
        variant: 'destructive',
      })
    } finally {
      setApiLoading(false)
    }
  }

  // HUB Handlers
  const handleCreatePix = async (data: z.infer<typeof pixSchema>) => {
    setSubmitting(true)
    try {
      const result = await createPaymentAccount({
        account_type: 'pix',
        pix_key: data.pix_key,
      })

      if (result.success) {
        toast({
          title: 'Chave PIX criada!',
          description: 'A chave PIX foi cadastrada com sucesso.',
        })
        setIsPixDialogOpen(false)
        pixForm.reset()
        await loadHubAccounts()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar a chave PIX.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTed = async (data: z.infer<typeof tedSchema>) => {
    setSubmitting(true)
    try {
      const result = await createPaymentAccount({
        account_type: 'ted',
        ...data,
      })

      if (result.success) {
        toast({
          title: 'Conta TED criada!',
          description: 'A conta bancária foi cadastrada com sucesso.',
        })
        setIsTedDialogOpen(false)
        tedForm.reset()
        await loadHubAccounts()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar a conta TED.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (
    accountId: string,
    accountType: 'pix' | 'ted',
  ) => {
    try {
      const result = await toggleAccountActive(accountId, accountType)

      if (result.success) {
        toast({
          title: 'Conta ativada!',
          description: 'Esta conta agora é a ativa para os clientes.',
        })
        await loadHubAccounts()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao ativar a conta.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      const result = await deletePaymentAccount(accountId)

      if (result.success) {
        toast({
          title: 'Conta excluída!',
          description: 'A conta foi removida com sucesso.',
        })
        await loadHubAccounts()
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a conta.',
        variant: 'destructive',
      })
    }
  }

  // API.HUB Handlers
  const handleAddApiAccount = async () => {
    if (!apiPixKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma chave PIX válida.',
        variant: 'destructive',
      })
      return
    }

    setApiAdding(true)
    try {
      await createApiPaymentAccount({ pix_key: apiPixKey })
      toast({
        title: 'Sucesso',
        description: 'Chave PIX adicionada com sucesso.',
      })
      setApiPixKey('')
      setShowApiDialog(false)
      await loadApiAccounts()
    } catch (error) {
      console.error('Erro ao adicionar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a chave PIX.',
        variant: 'destructive',
      })
    } finally {
      setApiAdding(false)
    }
  }

  const handleToggleApiActive = async (accountId: string) => {
    try {
      await toggleApiAccountActive(accountId)
      toast({
        title: 'Sucesso',
        description: 'Status da conta atualizado.',
      })
      await loadApiAccounts()
    } catch (error) {
      console.error('Erro ao atualizar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da conta.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteApiAccount = async (accountId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta chave PIX?')) {
      return
    }

    try {
      await deleteApiPaymentAccount(accountId)
      toast({
        title: 'Sucesso',
        description: 'Chave PIX deletada com sucesso.',
      })
      await loadApiAccounts()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a chave PIX.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-3 shadow-lg">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Contas de Pagamento
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Gerencie as chaves PIX e contas bancárias de hubp2p.com e api.hubp2p
          </p>
        </div>
      </div>

      {/* HUB Section - hubp2p.com */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">hubp2p.com</h2>
            <p className="text-sm text-gray-600">Sistema principal com KYC - PIX e TED</p>
          </div>
        </div>
          <Tabs defaultValue="pix">
            <TabsList className="bg-gradient-to-r from-purple-100 to-pink-100 p-1">
              <TabsTrigger value="pix">
                <QrCode className="mr-2 h-4 w-4" />
                Chaves PIX
              </TabsTrigger>
              <TabsTrigger value="ted">
                <Building2 className="mr-2 h-4 w-4" />
                Contas Bancárias (TED)
              </TabsTrigger>
            </TabsList>

            {/* PIX Tab */}
            <TabsContent value="pix">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                        <QrCode className="h-5 w-5 text-white" />
                      </div>
                      Chaves PIX - HUB
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Apenas uma chave PIX pode estar ativa por vez
                    </CardDescription>
                  </div>
                  <Dialog open={isPixDialogOpen} onOpenChange={setIsPixDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:from-purple-700 hover:to-pink-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar PIX
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Chave PIX</DialogTitle>
                        <DialogDescription>
                          Cadastre uma nova chave PIX para receber pagamentos
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...pixForm}>
                        <form
                          onSubmit={pixForm.handleSubmit(handleCreatePix)}
                          className="space-y-4"
                        >
                          <FormField
                            control={pixForm.control}
                            name="pix_key"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chave PIX</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="email@exemplo.com ou CPF/CNPJ"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                          >
                            {submitting && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Adicionar
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="pt-6">
                  {hubLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : pixAccounts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-purple-100">
                          <TableHead className="font-semibold">Chave PIX</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pixAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-mono">
                              {account.pix_key}
                            </TableCell>
                            <TableCell>
                              {account.is_active ? (
                                <Badge
                                  variant="default"
                                  className="flex w-fit items-center gap-1 bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!account.is_active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleToggleActive(account.id, 'pix')
                                    }
                                  >
                                    Ativar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(account.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      Nenhuma chave PIX cadastrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TED Tab - mantém o código existente */}
            <TabsContent value="ted">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      Contas Bancárias - HUB
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Apenas uma conta bancária pode estar ativa por vez
                    </CardDescription>
                  </div>
                  <Dialog open={isTedDialogOpen} onOpenChange={setIsTedDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md hover:from-purple-700 hover:to-pink-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Conta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Conta Bancária</DialogTitle>
                        <DialogDescription>
                          Cadastre uma nova conta para receber TEDs
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...tedForm}>
                        <form
                          onSubmit={tedForm.handleSubmit(handleCreateTed)}
                          className="space-y-4"
                        >
                          <FormField
                            control={tedForm.control}
                            name="bank_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Banco</FormLabel>
                                <FormControl>
                                  <Input placeholder="Banco do Brasil" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={tedForm.control}
                            name="bank_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código do Banco</FormLabel>
                                <FormControl>
                                  <Input placeholder="001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={tedForm.control}
                            name="account_holder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Titular da Conta</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome completo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={tedForm.control}
                              name="account_agency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Agência</FormLabel>
                                  <FormControl>
                                    <Input placeholder="0001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={tedForm.control}
                              name="account_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Conta</FormLabel>
                                  <FormControl>
                                    <Input placeholder="12345-6" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full"
                          >
                            {submitting && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Adicionar
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="pt-6">
                  {hubLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : tedAccounts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-purple-100">
                          <TableHead className="font-semibold">Banco</TableHead>
                          <TableHead className="font-semibold">Titular</TableHead>
                          <TableHead className="font-semibold">Agência</TableHead>
                          <TableHead className="font-semibold">Conta</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tedAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{account.bank_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Código: {account.bank_code}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{account.account_holder}</TableCell>
                            <TableCell className="font-mono">
                              {account.account_agency}
                            </TableCell>
                            <TableCell className="font-mono">
                              {account.account_number}
                            </TableCell>
                            <TableCell>
                              {account.is_active ? (
                                <Badge
                                  variant="default"
                                  className="flex w-fit items-center gap-1 bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!account.is_active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleToggleActive(account.id, 'ted')
                                    }
                                  >
                                    Ativar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(account.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      Nenhuma conta bancária cadastrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      {/* API.HUB Section - api.hubp2p */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-2">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">api.hubp2p</h2>
            <p className="text-sm text-gray-600">Sistema API sem KYC - Apenas PIX</p>
          </div>
        </div>

        <Card className="border-blue-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-2">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  Chaves PIX - API.HUB
                </CardTitle>
                <CardDescription className="mt-2">
                  Sistema API (sem KYC) - Apenas uma chave pode estar ativa
                </CardDescription>
              </div>
              <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md hover:from-blue-700 hover:to-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar PIX
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Chave PIX - API.HUB</DialogTitle>
                    <DialogDescription>
                      Digite a chave PIX que será usada para receber pagamentos do sistema API.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="api-pix-key" className="text-sm font-medium">
                        Chave PIX
                      </label>
                      <Input
                        id="api-pix-key"
                        placeholder="email@exemplo.com ou CPF/CNPJ"
                        value={apiPixKey}
                        onChange={(e) => setApiPixKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddApiAccount()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowApiDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddApiAccount} disabled={apiAdding}>
                      {apiAdding ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-6">
              {apiLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : apiAccounts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-100">
                      <TableHead className="font-semibold">Chave PIX</TableHead>
                      <TableHead className="font-semibold">Data de Criação</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">
                          {account.pix_key}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(account.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={account.is_active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleApiActive(account.id)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {account.is_active ? 'Ativa' : 'Inativa'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteApiAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                  <p className="mb-4">Nenhuma chave PIX cadastrada</p>
                  <Button onClick={() => setShowApiDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeira Chave
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                Informações Importantes - API.HUB
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• Apenas uma chave PIX pode estar ativa por vez</p>
              <p>• Esta chave será usada para todas as transações do sistema API</p>
              <p>• Sistema API não requer KYC dos clientes</p>
              <p>• Gerencie com cuidado - mudanças afetam novas transações imediatamente</p>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
