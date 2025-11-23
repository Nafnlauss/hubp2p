'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { createAdminClient } from '@/lib/supabase/server'

// Helper para verificar se usuário é admin
async function checkAdminAccess() {
  // Verificar cookie de sessão admin
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')

  console.log('🔍 [CHECK-ADMIN] Cookie admin_session:', adminSession?.value)

  if (!adminSession?.value) {
    console.log('❌ [CHECK-ADMIN] Cookie não encontrado')
    throw new Error('Não autenticado')
  }

  // Verificar se o admin existe e é válido
  const supabase = await createAdminClient()
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('id', adminSession.value)
    .single()

  console.log('📊 [CHECK-ADMIN] Admin data:', admin)
  console.log('❌ [CHECK-ADMIN] Error:', error)

  if (error || !admin) {
    console.log('🔴 [CHECK-ADMIN] Sessão inválida')
    throw new Error('Sessão admin inválida')
  }

  console.log('✅ [CHECK-ADMIN] Admin autenticado:', admin.email)
  return { adminId: admin.id, supabase }
}

// Atualizar status da transação
export async function updateTransactionStatus(
  transactionId: string,
  status: string,
  data?: {
    tx_hash?: string
    admin_notes?: string
  },
) {
  try {
    // Verificar se é admin
    await checkAdminAccess()

    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    const updateData: {
      status: string
      updated_at: string
      payment_confirmed_at?: string
      crypto_sent_at?: string
      tx_hash?: string
      admin_notes?: string
    } = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Adicionar timestamps específicos baseado no status
    if (status === 'payment_received') {
      updateData.payment_confirmed_at = new Date().toISOString()
    } else if (status === 'sent') {
      updateData.crypto_sent_at = new Date().toISOString()
      if (data?.tx_hash) {
        updateData.tx_hash = data.tx_hash
      }
    }

    if (data?.admin_notes) {
      updateData.admin_notes = data.admin_notes
    }

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)

    if (error) throw error

    revalidatePath('/admin/transactions')
    revalidatePath(`/admin/transactions/${transactionId}`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Aprovar KYC
export async function approveKYC(kycId: string) {
  try {
    // Verificar se é admin
    await checkAdminAccess()

    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('kyc_verifications')
      .update({
        status: 'approved',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', kycId)

    if (error) throw error

    revalidatePath('/admin/kyc')

    return { success: true }
  } catch (error) {
    console.error('Erro ao aprovar KYC:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Rejeitar KYC
export async function rejectKYC(kycId: string, reason: string) {
  try {
    // Verificar se é admin
    await checkAdminAccess()

    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('kyc_verifications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kycId)

    if (error) throw error

    revalidatePath('/admin/kyc')

    return { success: true }
  } catch (error) {
    console.error('Erro ao rejeitar KYC:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Tornar/remover admin
export async function toggleAdmin(userId: string, isAdmin: boolean) {
  try {
    // Verificar se é admin
    await checkAdminAccess()

    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Erro ao alterar status de admin:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Enviar notificação via Pushover para transações API (sem usuário)
export async function sendApiNotification(transactionId: string) {
  try {
    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    // Buscar dados da transação API
    const { data: transaction } = await supabase
      .from('api_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    const title = '🚨 NOVA TRANSAÇÃO PIX!'
    const message =
      `Transação #${transaction.transaction_number}\n` +
      `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount_brl)}\n` +
      `Rede: ${transaction.crypto_network}\n` +
      `Aguardando confirmação de pagamento PIX`

    // Integração real com Pushover
    const pushoverToken = process.env.PUSHOVER_APP_TOKEN
    const pushoverUser = process.env.PUSHOVER_USER_KEY

    if (!pushoverToken || !pushoverUser) {
      console.error('Pushover não configurado: faltam variáveis de ambiente')
      return { success: false, error: 'Pushover não configurado' }
    }

    try {
      // Enviar notificação prioritária (Emergency Priority)
      const response = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: pushoverToken,
          user: pushoverUser,
          title: title,
          message: message,
          priority: 2, // Emergency - requer confirmação
          retry: 30, // Tentar novamente a cada 30 segundos
          expire: 3600, // Expirar após 1 hora
          sound: 'siren', // Som de sirene
        }),
      })

      const result = await response.json()

      if (response.ok && result.status === 1) {
        return { success: true }
      } else {
        return { success: false, error: result.errors?.join(', ') }
      }
    } catch (fetchError) {
      console.error('Erro ao chamar API do Pushover:', fetchError)
      return {
        success: false,
        error:
          fetchError instanceof Error ? fetchError.message : 'Erro ao enviar',
      }
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Enviar notificação via Pushover
export async function sendNotification(
  transactionId: string,
  type: 'new_transaction' | 'status_update' = 'status_update',
) {
  try {
    // Verificar se é admin (não necessário para new_transaction)
    if (type === 'status_update') {
      await checkAdminAccess()
    }

    // Usar admin client para bypass de RLS
    const supabase = await createAdminClient()

    // Buscar dados da transação
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, profiles(*)')
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    // Mensagem baseada no tipo de notificação
    let message = ''
    let title = ''

    if (type === 'new_transaction') {
      title = '🚨 NOVA TRANSAÇÃO PIX!'
      message =
        `Transação #${transaction.transaction_number}\n` +
        `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount_brl)}\n` +
        `Cliente: ${transaction.profiles?.full_name || 'N/A'}\n` +
        `Aguardando confirmação de pagamento PIX`
    } else {
      title = `Transação #${transaction.transaction_number}`
      message =
        `Status: ${transaction.status}\n` +
        `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount_brl)}`
    }

    // Integração real com Pushover
    const pushoverToken = process.env.PUSHOVER_APP_TOKEN
    const pushoverUser = process.env.PUSHOVER_USER_KEY

    if (!pushoverToken || !pushoverUser) {
      console.error('Pushover não configurado: faltam variáveis de ambiente')
      await supabase.from('notification_logs').insert({
        transaction_id: transactionId,
        type: 'pushover',
        recipient: 'admin',
        message: message,
        status: 'failed',
        error_message: 'Pushover não configurado',
        sent_at: new Date().toISOString(),
      })
      return { success: false, error: 'Pushover não configurado' }
    }

    try {
      // Enviar notificação prioritária (Emergency Priority)
      const response = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: pushoverToken,
          user: pushoverUser,
          title: title,
          message: message,
          priority: 2, // Emergency - requer confirmação
          retry: 30, // Tentar novamente a cada 30 segundos
          expire: 3600, // Expirar após 1 hora
          sound: 'siren', // Som de sirene
        }),
      })

      const result = await response.json()

      if (response.ok && result.status === 1) {
        // Notificação enviada com sucesso
        await supabase.from('notification_logs').insert({
          transaction_id: transactionId,
          type: 'pushover',
          recipient: 'admin',
          message: message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        return { success: true }
      } else {
        // Erro ao enviar notificação
        await supabase.from('notification_logs').insert({
          transaction_id: transactionId,
          type: 'pushover',
          recipient: 'admin',
          message: message,
          status: 'failed',
          error_message: result.errors?.join(', ') || 'Erro desconhecido',
          sent_at: new Date().toISOString(),
        })
        return { success: false, error: result.errors?.join(', ') }
      }
    } catch (fetchError) {
      console.error('Erro ao chamar API do Pushover:', fetchError)
      await supabase.from('notification_logs').insert({
        transaction_id: transactionId,
        type: 'pushover',
        recipient: 'admin',
        message: message,
        status: 'failed',
        error_message:
          fetchError instanceof Error ? fetchError.message : 'Erro ao enviar',
        sent_at: new Date().toISOString(),
      })
      return {
        success: false,
        error:
          fetchError instanceof Error ? fetchError.message : 'Erro ao enviar',
      }
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Buscar estatísticas do dashboard
export async function getDashboardStats() {
  try {
    const { supabase } = await checkAdminAccess()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Total de transações hoje
    const { count: todayCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Valor total hoje
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('amount_brl')
      .gte('created_at', today.toISOString())

    const todayTotal =
      todayTransactions?.reduce((sum, t) => sum + t.amount_brl, 0) || 0

    // Transações pendentes
    const { count: pendingCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_payment')

    // Transações aprovadas hoje
    const { count: approvedCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', today.toISOString())

    // Transações dos últimos 7 dias para gráfico
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: weekTransactions } = await supabase
      .from('transactions')
      .select('created_at, amount_brl')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Agrupar por dia
    const chartData =
      weekTransactions?.reduce(
        (
          accumulator: Array<{ date: string; count: number; value: number }>,
          transaction,
        ) => {
          const date = new Date(transaction.created_at!).toLocaleDateString(
            'pt-BR',
          )
          const existing = accumulator.find((item) => item.date === date)

          if (existing) {
            existing.count += 1
            existing.value += transaction.amount_brl
          } else {
            accumulator.push({
              date,
              count: 1,
              value: transaction.amount_brl,
            })
          }

          return accumulator
        },
        [],
      ) || []

    return {
      todayCount: todayCount || 0,
      todayTotal,
      pendingCount: pendingCount || 0,
      approvedCount: approvedCount || 0,
      chartData,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}

// Buscar usuários sem KYC (admin only)
export async function getUsersWithoutKYC() {
  try {
    const { supabase } = await checkAdminAccess()

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        kyc_verifications (
          id
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error('Erro ao buscar usuários')
    }

    // Filtrar apenas usuários que não têm nenhuma verificação KYC
    const usersWithoutKYC =
      data?.filter(
        (user: any) =>
          !user.kyc_verifications || user.kyc_verifications.length === 0,
      ) || []

    return { success: true, data: usersWithoutKYC }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}

// Buscar todos os usuários (admin only)
export async function getUsers() {
  try {
    const { supabase } = await checkAdminAccess()

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        kyc_verifications (
          id,
          status,
          created_at,
          updated_at
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error('Erro ao buscar usuários')
    }

    // Garantir que kyc_verifications sempre seja um array
    const normalizedData = data?.map((user) => ({
      ...user,
      kyc_verifications: Array.isArray(user.kyc_verifications)
        ? user.kyc_verifications
        : user.kyc_verifications
          ? [user.kyc_verifications]
          : [],
    }))

    return { success: true, data: normalizedData }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    }
  }
}
