'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function adminLogin(email: string, password: string) {
  console.log('🔐 [ADMIN-AUTH] adminLogin chamado')
  console.log(`📧 [ADMIN-AUTH] Email: ${email}`)
  console.log(`🔑 [ADMIN-AUTH] Password length: ${password?.length}`)

  try {
    const supabase = await createClient()
    console.log('✅ [ADMIN-AUTH] Cliente Supabase criado')

    // Verificar credenciais usando a função crypt do PostgreSQL
    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_email: email,
      p_password: password,
    })

    console.log('📡 [ADMIN-AUTH] RPC verify_admin_password executado')
    console.log(`📊 [ADMIN-AUTH] Data:`, data)
    console.log(`❌ [ADMIN-AUTH] Error:`, error)

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      console.log('🔴 [ADMIN-AUTH] Credenciais inválidas')
      return { success: false, error: 'Credenciais inválidas' }
    }

    // A RPC retorna um array com um único objeto
    const adminData = data[0]
    console.log(`👤 [ADMIN-AUTH] Admin data:`, adminData)

    // Criar sessão admin usando cookies
    const cookieStore = await cookies()
    console.log('🍪 [ADMIN-AUTH] Cookie store obtido')

    cookieStore.set('admin_session', adminData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/', // Disponível em todas as rotas
    })
    console.log(
      `✅ [ADMIN-AUTH] Cookie admin_session setado com ID: ${adminData.id}`,
    )

    console.log(
      '🎉 [ADMIN-AUTH] Login bem-sucedido, fazendo redirect para /admin',
    )
    // Fazer redirect do lado do servidor para garantir que o cookie seja enviado
    redirect('/admin')
  } catch (error) {
    console.error('💥 [ADMIN-AUTH] Erro no login admin:', error)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // Se for um erro de redirect do Next.js, re-lançar
      throw error
    }
    return { success: false, error: 'Erro ao fazer login' }
  }
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin-login')
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  return session?.value || null
}
