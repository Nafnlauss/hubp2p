'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return { success: false, error: 'Erro ao atualizar status da transação' }
    }

    // Revalidar a página de transações
    revalidatePath('/admin/transactions')

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return { success: false, error: 'Erro ao atualizar transação' }
  }
}
