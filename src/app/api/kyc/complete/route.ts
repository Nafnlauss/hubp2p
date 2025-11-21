export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * API para marcar KYC como aprovado quando o Proteo envia mensagem de conclusão
 * Esta é uma solução fallback caso o webhook do Proteo não seja disparado automaticamente
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    console.log(
      '✅ [KYC COMPLETE] Marcando KYC como aprovado para:',
      user.email,
    )

    // Atualizar status do perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        kyc_status: 'approved',
        kyc_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('❌ [KYC COMPLETE] Erro ao atualizar perfil:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 },
      )
    }

    console.log('✅ [KYC COMPLETE] Perfil atualizado com sucesso')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[KYC COMPLETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 },
    )
  }
}
