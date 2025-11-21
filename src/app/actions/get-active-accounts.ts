'use server'

import { createClient } from '@/lib/supabase/server'

export async function getActivePaymentAccounts() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao buscar contas ativas:', error)
      return { success: false, error: 'Erro ao buscar contas de pagamento' }
    }

    const pixAccount = data?.find((a) => a.account_type === 'pix')
    const tedAccount = data?.find((a) => a.account_type === 'ted')

    return {
      success: true,
      data: {
        pix: pixAccount
          ? {
              pix_key: pixAccount.pix_key,
              pix_qr_code: pixAccount.pix_key, // Para QR Code, você pode usar a chave PIX
            }
          : null,
        ted: tedAccount
          ? {
              bank_name: tedAccount.bank_name,
              bank_code: tedAccount.bank_code,
              account_holder: tedAccount.account_holder,
              account_agency: tedAccount.account_agency,
              account_number: tedAccount.account_number,
            }
          : null,
      },
    }
  } catch (error) {
    console.error('Erro ao buscar contas ativas:', error)
    return { success: false, error: 'Erro ao buscar contas de pagamento' }
  }
}
