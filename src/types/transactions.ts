/**
 * Tipos compartilhados para transações P2P
 */

export type TransactionStatus =
  | 'pending_payment'
  | 'payment_received'
  | 'converting'
  | 'sent'
  | 'cancelled'
  | 'expired'

export type PaymentMethod = 'pix' | 'bank_transfer' | 'credit_card'

export type CryptoNetwork =
  | 'ethereum'
  | 'bitcoin'
  | 'solana'
  | 'polygon'
  | 'arbitrum'

export interface Transaction {
  id: string
  userId: string
  status: TransactionStatus
  amount: number
  currency: string
  cryptoAmount: number
  cryptoNetwork: CryptoNetwork
  paymentMethod: PaymentMethod
  fromAddress: string
  toAddress: string
  txHash?: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  notes?: string
}

export interface TransactionCreationData {
  amount: number
  currency: string
  cryptoNetwork: CryptoNetwork
  paymentMethod: PaymentMethod
  toAddress: string
  expiresInMinutes?: number // Padrão: 30 minutos
}

export interface TransactionUpdateData {
  status?: TransactionStatus
  txHash?: string
  completedAt?: Date
  notes?: string
}

export interface TransactionFilterParameters {
  status?: TransactionStatus
  paymentMethod?: PaymentMethod
  cryptoNetwork?: CryptoNetwork
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface TransactionStats {
  totalTransactions: number
  completedTransactions: number
  totalAmountBRL: number
  totalAmountCrypto: number
  successRate: number
  averageAmount: number
}

export interface UserTransaction extends Transaction {
  user?: {
    id: string
    fullName: string
    email: string
    isVerified: boolean
  }
}
