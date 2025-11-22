'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ApiPaymentAccount {
  id: string
  pix_key: string
  pix_qr_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all API payment accounts (for admin)
 */
export async function getApiPaymentAccounts(): Promise<ApiPaymentAccount[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('api_payment_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching API payment accounts:', error)
    throw new Error('Erro ao buscar contas de pagamento')
  }

  return data || []
}

/**
 * Get active API payment account (for creating transactions)
 */
export async function getActiveApiPaymentAccount(): Promise<ApiPaymentAccount | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('api_payment_accounts')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No active account found
      return null
    }
    console.error('Error fetching active API payment account:', error)
    throw new Error('Erro ao buscar conta de pagamento ativa')
  }

  return data
}

/**
 * Create new API payment account
 */
export async function createApiPaymentAccount(data: {
  pix_key: string
  pix_qr_code?: string
}): Promise<ApiPaymentAccount> {
  const supabase = await createAdminClient()

  const { data: account, error } = await supabase
    .from('api_payment_accounts')
    .insert({
      pix_key: data.pix_key,
      pix_qr_code: data.pix_qr_code || null,
      is_active: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating API payment account:', error)
    throw new Error('Erro ao criar conta de pagamento')
  }

  revalidatePath('/admin/api-payment-accounts')
  return account
}

/**
 * Toggle account active status (only one can be active at a time)
 */
export async function toggleApiAccountActive(accountId: string): Promise<void> {
  const supabase = await createAdminClient()

  // First, get the account to check current status
  const { data: account, error: fetchError } = await supabase
    .from('api_payment_accounts')
    .select('is_active')
    .eq('id', accountId)
    .single()

  if (fetchError) {
    console.error('Error fetching API payment account:', fetchError)
    throw new Error('Erro ao buscar conta de pagamento')
  }

  const newStatus = !account.is_active

  // If activating this account, deactivate all others first
  if (newStatus) {
    const { error: deactivateError } = await supabase
      .from('api_payment_accounts')
      .update({ is_active: false })
      .neq('id', accountId)

    if (deactivateError) {
      console.error('Error deactivating other accounts:', deactivateError)
      throw new Error('Erro ao desativar outras contas')
    }
  }

  // Update the target account
  const { error: updateError } = await supabase
    .from('api_payment_accounts')
    .update({ is_active: newStatus })
    .eq('id', accountId)

  if (updateError) {
    console.error('Error updating API payment account:', updateError)
    throw new Error('Erro ao atualizar conta de pagamento')
  }

  revalidatePath('/admin/api-payment-accounts')
}

/**
 * Delete API payment account
 */
export async function deleteApiPaymentAccount(accountId: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('api_payment_accounts')
    .delete()
    .eq('id', accountId)

  if (error) {
    console.error('Error deleting API payment account:', error)
    throw new Error('Erro ao deletar conta de pagamento')
  }

  revalidatePath('/admin/api-payment-accounts')
}
