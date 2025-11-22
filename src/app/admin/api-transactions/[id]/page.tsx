'use client'

import { ArrowLeft, CheckCircle, Clock, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  getApiTransaction,
  updateApiTransactionStatus,
} from '@/app/actions/api-transactions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ApiTransactionDetail {
  id: string
  transaction_number: string
  amount_brl: number
  amount_usd: number | null
  exchange_rate: number | null
  crypto_network: 'bitcoin' | 'ethereum' | 'polygon' | 'bsc' | 'solana' | 'tron'
  wallet_address: string
  status:
    | 'pending_payment'
    | 'payment_received'
    | 'converting'
    | 'sent'
    | 'cancelled'
    | 'expired'
  pix_key: string | null
  tx_hash: string | null
  created_at: string
  expires_at: string
  payment_confirmed_at: string | null
  crypto_sent_at: string | null
  updated_at: string
  admin_notes: string | null
}

const networkLabels: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  polygon: 'Polygon (MATIC)',
  bsc: 'Binance Smart Chain (BNB)',
  solana: 'Solana (SOL)',
  tron: 'Tron (TRX)',
}

export default function ApiTransactionDetailPage() {
  const parameters = useParams()
  const router = useRouter()
  const locale = parameters.locale as string
  const transactionId = parameters.id as string

  const [transaction, setTransaction] = useState<ApiTransactionDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [txHash, setTxHash] = useState('')
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTransaction()
  }, [transactionId])

  async function loadTransaction() {
    try {
      const data = await getApiTransaction(transactionId)
      if (data) {
        setTransaction(data)
        setNotes(data.admin_notes || '')
        if (data.tx_hash) {
          setTxHash(data.tx_hash)
        }
      }
    } catch (error) {
      console.error('Error loading transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(
    newStatus: ApiTransactionDetail['status'],
    requiresTxHash = false,
  ) {
    if (requiresTxHash && !txHash.trim()) {
      alert('Por favor, insira o TX Hash')
      return
    }

    setActionLoading(true)

    try {
      await updateApiTransactionStatus(transactionId, newStatus, {
        tx_hash: requiresTxHash ? txHash : undefined,
        admin_notes: notes,
      })

      router.refresh()
      await loadTransaction()
    } catch (error) {
      alert(
        `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    } finally {
      setActionLoading(false)
    }
  }

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
        variant: 'default' | 'secondary' | 'destructive' | 'outline'
      }
    > = {
      pending_payment: { label: 'Aguardando Pagamento', variant: 'outline' },
      payment_received: { label: 'Pagamento Recebido', variant: 'secondary' },
      converting: { label: 'Convertendo', variant: 'default' },
      sent: { label: 'Enviado', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      expired: { label: 'Expirado', variant: 'destructive' },
    }

    const status_info = statusMap[status] || {
      label: status,
      variant: 'default' as const,
    }
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Transação não encontrada</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/api-transactions`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transação API #{transaction.transaction_number}
            </h1>
            <p className="mt-1 text-gray-600">
              Criada em{' '}
              {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {getStatusBadge(transaction.status)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Informações da Transação */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Transação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Valor em BRL</Label>
                  <div className="text-2xl font-bold">
                    {formatCurrency(transaction.amount_brl)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Valor em USDT</Label>
                  <div className="text-2xl font-bold">
                    {transaction.amount_usd
                      ? `$${transaction.amount_usd.toFixed(2)}`
                      : 'Calculando...'}
                  </div>
                </div>
              </div>

              {transaction.exchange_rate && (
                <div>
                  <Label className="text-gray-600">Taxa de Câmbio</Label>
                  <div className="font-medium">
                    R$ {transaction.exchange_rate.toFixed(2)} / USD
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-600">Rede Blockchain</Label>
                <div className="font-medium">
                  {networkLabels[transaction.crypto_network]}
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Endereço da Carteira</Label>
                <div className="break-all rounded bg-gray-100 p-2 font-mono text-sm">
                  {transaction.wallet_address}
                </div>
              </div>

              {transaction.tx_hash && (
                <div>
                  <Label className="text-gray-600">TX Hash</Label>
                  <div className="break-all rounded bg-gray-100 p-2 font-mono text-sm">
                    {transaction.tx_hash}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados de Pagamento PIX */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Pagamento PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-600">Chave PIX</Label>
                <div className="font-mono text-sm">
                  {transaction.pix_key || 'Não disponível'}
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Expira em</Label>
                <div className="text-sm">
                  {new Date(transaction.expires_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações e Timeline */}
        <div className="space-y-6">
          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.status === 'pending_payment' && (
                <Button
                  onClick={() => handleStatusUpdate('payment_received')}
                  disabled={actionLoading}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pagamento Recebido
                </Button>
              )}

              {transaction.status === 'payment_received' && (
                <Button
                  onClick={() => handleStatusUpdate('converting')}
                  disabled={actionLoading}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Marcar como Convertendo
                </Button>
              )}

              {(transaction.status === 'payment_received' ||
                transaction.status === 'converting') && (
                <div className="space-y-2">
                  <Label>TX Hash</Label>
                  <Input
                    placeholder="Cole o hash da transação"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                  />
                  <Button
                    onClick={() => handleStatusUpdate('sent', true)}
                    disabled={actionLoading || !txHash.trim()}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Marcar como Enviado
                  </Button>
                </div>
              )}

              {transaction.status !== 'cancelled' &&
                transaction.status !== 'sent' && (
                  <Button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Transação
                  </Button>
                )}
            </CardContent>
          </Card>

          {/* Notas do Admin */}
          <Card>
            <CardHeader>
              <CardTitle>Notas do Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Adicione notas sobre esta transação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Transação Criada</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {transaction.payment_confirmed_at && (
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Pagamento Confirmado
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(
                          transaction.payment_confirmed_at,
                        ).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}

                {transaction.crypto_sent_at && (
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Crypto Enviado</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.crypto_sent_at).toLocaleString(
                          'pt-BR',
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
