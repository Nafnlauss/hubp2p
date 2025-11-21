'use client'

import { Badge } from '@/components/ui/badge'

export type TransactionStatus =
  | 'pending_payment'
  | 'payment_received'
  | 'converting'
  | 'sent'
  | 'cancelled'
  | 'expired'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

const statusConfig: Record<
  TransactionStatus,
  {
    label: string
    className: string
    bgColor: string
    textColor: string
  }
> = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  payment_received: {
    label: 'Pagamento Recebido',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  converting: {
    label: 'Convertendo',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  sent: {
    label: 'Enviado',
    className: 'bg-green-100 text-green-800 border-green-300',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-300',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-red-100 text-red-800 border-red-300',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={`${config.className} border ${className}`}
    >
      {config.label}
    </Badge>
  )
}
