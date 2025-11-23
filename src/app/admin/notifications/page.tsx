'use client'

import { Bell, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  recipient: string
  message: string
  status: string
  created_at: string
  sent_at: string | null
  error_message: string | null
  transaction_id: string | null
  transactions?: {
    transaction_number: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('notification_logs')
      .select(
        `
        *,
        transactions (
          transaction_number
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setNotifications(data as any)
    }

    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': {
        return <CheckCircle className="h-4 w-4 text-green-600" />
      }
      case 'failed': {
        return <XCircle className="h-4 w-4 text-red-600" />
      }
      case 'pending': {
        return <Clock className="h-4 w-4 text-yellow-600" />
      }
      default: {
        return null
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': {
        return <Badge variant="success">Enviado</Badge>
      }
      case 'failed': {
        return <Badge variant="destructive">Falhou</Badge>
      }
      case 'pending': {
        return <Badge variant="warning">Pendente</Badge>
      }
      default: {
        return <Badge variant="secondary">{status}</Badge>
      }
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'pushover': {
        return <Badge variant="default">Pushover</Badge>
      }
      case 'email': {
        return <Badge variant="secondary">Email</Badge>
      }
      case 'sms': {
        return <Badge variant="outline">SMS</Badge>
      }
      default: {
        return <Badge>{type}</Badge>
      }
    }
  }

  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === 'sent').length,
    failed: notifications.filter((n) => n.status === 'failed').length,
    pending: notifications.filter((n) => n.status === 'pending').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
        <p className="mt-2 text-gray-600">
          Histórico de notificações enviadas pela plataforma
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total
            </CardTitle>
            <Bell className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Enviadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.sent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Falharam
            </CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Notificações */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Transação</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>{getTypeBadge(notification.type)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {notification.transactions?.transaction_number ? (
                          `#${notification.transactions.transaction_number}`
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {notification.recipient}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm">
                        {notification.message}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          {getStatusBadge(notification.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {notification.sent_at
                          ? new Date(notification.sent_at).toLocaleString(
                              'pt-BR',
                            )
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-red-600">
                        {notification.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      Nenhuma notificação encontrada
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
