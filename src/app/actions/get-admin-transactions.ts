'use server'

import { createAdminClient } from '@/lib/supabase/server'

interface Transaction {
  id: string
  transaction_number: string
  amount_brl: number
  payment_method: string
  crypto_network: string
  status: string
  created_at: string
  profiles: {
    full_name: string
    cpf: string
  }
}

export async function getAdminTransactions(filters?: {
  status?: string
  method?: string
}) {
  try {
    const supabase = await createAdminClient()

    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        profiles (
          full_name,
          cpf
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.method && filters.method !== 'all') {
      query = query.eq('payment_method', filters.method)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as Transaction[] }
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}
