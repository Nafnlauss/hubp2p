'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function adminLogin(email: string, password: string) {
  try {
    const supabase = await createClient()

    // Verificar credenciais usando a função crypt do PostgreSQL
    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_email: email,
      p_password: password,
    })

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Credenciais inválidas' }
    }

    // A RPC retorna um array com um único objeto
    const adminData = data[0]

    // Criar sessão admin usando cookies
    const cookieStore = await cookies()
    cookieStore.set('admin_session', adminData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/', // Disponível em todas as rotas
    })

    return { success: true }
  } catch (error) {
    console.error('Erro no login admin:', error)
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
