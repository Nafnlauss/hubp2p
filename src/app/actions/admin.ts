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

// Enviar notificação via Pushover
export async function sendNotification(transactionId: string) {
  try {
    // Verificar se é admin
    await checkAdminAccess()

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

    // Mock de integração Pushover
    const message = `Atualização na transação #${transaction.transaction_number}: Status ${transaction.status}`

    // Aqui seria a integração real com Pushover
    // const response = await fetch("https://api.pushover.net/1/messages.json", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     token: process.env.PUSHOVER_TOKEN,
    //     user: process.env.PUSHOVER_USER,
    //     message: message,
    //   }),
    // })

    // Registrar log de notificação
    await supabase.from('notification_logs').insert({
      transaction_id: transactionId,
      type: 'pushover',
      recipient: 'admin',
      message: message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return { success: true }
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
