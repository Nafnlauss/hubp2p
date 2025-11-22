/* eslint-disable unicorn/filename-case, unicorn/no-null */
'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function getTransactionDetail(transactionId: string) {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        profiles (
          full_name,
          cpf,
          phone
        )
      `,
      )
      .eq('id', transactionId)
      .single()

    if (error) {
      console.error('Erro ao buscar transação:', error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar transação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null,
    }
  }
}
