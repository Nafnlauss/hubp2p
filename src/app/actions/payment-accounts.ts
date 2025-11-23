/* eslint-disable unicorn/filename-case */
'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/server'

export async function getPaymentAccounts() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('payment_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contas:', error)
      return {
        success: false,
        error: 'Erro ao buscar contas de pagamento',
        data: [],
      }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar contas:', error)
    return {
      success: false,
      error: 'Erro ao buscar contas de pagamento',
      data: [],
    }
  }
}

export async function createPaymentAccount(data: {
  account_type: 'pix' | 'ted'
  pix_key?: string
  pix_key_holder?: string
  bank_name?: string
  bank_code?: string
  account_holder?: string
  account_agency?: string
  account_number?: string
}) {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase.from('payment_accounts').insert({
      account_type: data.account_type,
      is_active: false,
      pix_key: data.pix_key || undefined,
      pix_key_holder: data.pix_key_holder || undefined,
      bank_name: data.bank_name || undefined,
      bank_code: data.bank_code || undefined,
      account_holder: data.account_holder || undefined,
      account_agency: data.account_agency || undefined,
      account_number: data.account_number || undefined,
    })

    if (error) {
      console.error('Erro ao criar conta:', error)
      return { success: false, error: 'Erro ao criar conta de pagamento' }
    }

    revalidatePath('/admin/payment-accounts')
    return { success: true }
  } catch (error) {
    console.error('Erro ao criar conta:', error)
    return { success: false, error: 'Erro ao criar conta de pagamento' }
  }
}

export async function toggleAccountActive(
  accountId: string,
  accountType: 'pix' | 'ted',
) {
  try {
    const supabase = await createAdminClient()

    // Primeiro, desativar todas as contas do mesmo tipo
    await supabase
      .from('payment_accounts')
      .update({ is_active: false })
      .eq('account_type', accountType)

    // Depois, ativar a conta selecionada
    const { error } = await supabase
      .from('payment_accounts')
      .update({ is_active: true })
      .eq('id', accountId)

    if (error) {
      console.error('Erro ao atualizar conta:', error)
      return { success: false, error: 'Erro ao atualizar conta' }
    }

    revalidatePath('/admin/payment-accounts')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    return { success: false, error: 'Erro ao atualizar conta' }
  }
}

export async function deletePaymentAccount(accountId: string) {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('payment_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Erro ao deletar conta:', error)
      return { success: false, error: 'Erro ao deletar conta de pagamento' }
    }

    revalidatePath('/admin/payment-accounts')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar conta:', error)
    return { success: false, error: 'Erro ao deletar conta de pagamento' }
  }
}
