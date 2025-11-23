/* eslint-disable unicorn/filename-case */
'use server'

import { revalidatePath } from 'next/cache'

import { convertBrlToUsd, getFinalExchangeRate } from '@/lib/bitget'
import { createClient } from '@/lib/supabase/server'

import { sendApiNotification } from './admin'
import { getActiveApiPaymentAccount } from './api-payment-accounts'

export interface ApiTransaction {
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
  pix_key_holder: string | null
  tx_hash: string | null
  created_at: string
  expires_at: string
  payment_confirmed_at: string | null
  crypto_sent_at: string | null
  updated_at: string
  admin_notes: string | null
}

export interface CreateApiTransactionData {
  amount_brl: number
  crypto_network: 'bitcoin' | 'ethereum' | 'polygon' | 'bsc' | 'solana' | 'tron'
  wallet_address: string
}

/**
 * Create new API transaction (no user required)
 */
export async function createApiTransaction(
  data: CreateApiTransactionData,
): Promise<ApiTransaction> {
  const supabase = await createClient()

  // Get active payment account
  const paymentAccount = await getActiveApiPaymentAccount()
  if (!paymentAccount) {
    throw new Error('Nenhuma conta de pagamento ativa encontrada')
  }

  // Get current exchange rate
  const { finalRate } = await getFinalExchangeRate()

  // Calculate USD amount
  const usdAmount = await convertBrlToUsd(data.amount_brl)

  // Generate transaction number
  const { data: transactionNumber, error: rpcError } = await supabase.rpc(
    'generate_api_transaction_number',
  )

  if (rpcError) {
    console.error('Error generating transaction number:', rpcError)
    throw new Error('Erro ao gerar número da transação')
  }

  // Calculate expiration (40 minutes from now)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 40)

  console.log('[CREATE API TRANSACTION] Dados a inserir:', {
    crypto_network: data.crypto_network,
    wallet_address: data.wallet_address,
    amount_brl: data.amount_brl,
  })

  // Create transaction
  const { data: transaction, error } = await supabase
    .from('api_transactions')
    .insert({
      transaction_number: transactionNumber as string,
      amount_brl: data.amount_brl,
      amount_usd: usdAmount,
      exchange_rate: finalRate,
      crypto_network: data.crypto_network,
      wallet_address: data.wallet_address,
      status: 'pending_payment',
      pix_key: paymentAccount.pix_key,
      pix_key_holder: paymentAccount.pix_key_holder,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating API transaction:', error)
    throw new Error('Erro ao criar transação')
  }

  console.log(
    '[CREATE API TRANSACTION] Transação criada com sucesso:',
    transaction.id,
  )

  // Enviar notificação Pushover prioritária para o admin (não bloqueia retorno)
  sendApiNotification(transaction.id).catch((notificationError) => {
    // Log do erro mas não falha a transação
    console.error(
      '[CREATE API TRANSACTION] Erro ao enviar notificação Pushover:',
      notificationError,
    )
  })

  console.log(
    '[CREATE API TRANSACTION] Retornando transação:',
    transaction.transaction_number,
  )
  return transaction
}

/**
 * Get API transaction by ID (public access by transaction number)
 */
export async function getApiTransaction(
  transactionId: string,
): Promise<ApiTransaction | undefined> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('api_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return undefined
    }
    console.error('Error fetching API transaction:', error)
    throw new Error('Erro ao buscar transação')
  }

  return data
}

/**
 * Get API transaction by transaction number
 */
export async function getApiTransactionByNumber(
  transactionNumber: string,
): Promise<ApiTransaction | undefined> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('api_transactions')
    .select('*')
    .eq('transaction_number', transactionNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return undefined
    }
    console.error('Error fetching API transaction:', error)
    throw new Error('Erro ao buscar transação')
  }

  return data
}

/**
 * Get all API transactions (admin only, with filters)
 */
export async function getApiTransactions(filters?: {
  status?: string
  searchTerm?: string
}): Promise<ApiTransaction[]> {
  const supabase = await createClient()

  let query = supabase.from('api_transactions').select('*')

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  // Apply search filter
  if (filters?.searchTerm) {
    query = query.or(
      `transaction_number.ilike.%${filters.searchTerm}%,wallet_address.ilike.%${filters.searchTerm}%`,
    )
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching API transactions:', error)
    throw new Error('Erro ao buscar transações')
  }

  return data || []
}

/**
 * Update API transaction status (admin only)
 */
export async function updateApiTransactionStatus(
  transactionId: string,
  status: ApiTransaction['status'],
  additionalData?: {
    tx_hash?: string
    admin_notes?: string
  },
): Promise<void> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }

  // Set timestamps based on status
  if (status === 'payment_received' && !additionalData) {
    updateData.payment_confirmed_at = new Date().toISOString()
  }

  if (status === 'sent') {
    updateData.crypto_sent_at = new Date().toISOString()
    if (additionalData?.tx_hash) {
      updateData.tx_hash = additionalData.tx_hash
    }
  }

  if (additionalData?.admin_notes !== undefined) {
    updateData.admin_notes = additionalData.admin_notes
  }

  const { error } = await supabase
    .from('api_transactions')
    .update(updateData)
    .eq('id', transactionId)

  if (error) {
    console.error('Error updating API transaction:', error)
    throw new Error('Erro ao atualizar transação')
  }

  revalidatePath('/admin/api-transactions')
  revalidatePath(`/admin/api-transactions/${transactionId}`)
}

/**
 * Cancel API transaction
 */
export async function cancelApiTransaction(
  transactionId: string,
): Promise<void> {
  await updateApiTransactionStatus(transactionId, 'cancelled')
}

/**
 * Calculate USD amount from BRL and return exchange rate (public function for real-time calculation)
 */
export async function calculateUsdFromBrl(
  brlAmount: number,
): Promise<{ usdAmount: number; exchangeRate: number }> {
  try {
    console.log(
      '[SERVER ACTION] calculateUsdFromBrl - Início para BRL:',
      brlAmount,
    )
    const { displayRate } = await getFinalExchangeRate()
    const usdAmount = await convertBrlToUsd(brlAmount)
    console.log(
      '[SERVER ACTION] calculateUsdFromBrl - USD calculado:',
      usdAmount,
    )
    console.log(
      '[SERVER ACTION] calculateUsdFromBrl - Taxa exibida:',
      displayRate,
    )
    return { usdAmount, exchangeRate: displayRate }
  } catch (error) {
    console.error('[SERVER ACTION] calculateUsdFromBrl - Erro:', error)
    throw new Error('Erro ao calcular valor em USD. Tente novamente.')
  }
}
