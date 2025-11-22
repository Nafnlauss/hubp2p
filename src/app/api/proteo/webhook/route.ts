export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Webhook do Proteo - OTIMIZADO para responder RÁPIDO
 * Recebe notificações do Proteo quando KYC é aprovado/rejeitado
 */

export async function POST(request: Request) {
  // Processar webhook em background (sem await para responder rápido)
  processWebhook(request).catch((error) => {
    console.error(
      '❌ [PROTEO WEBHOOK] Erro no processamento background:',
      error,
    )
  })

  // Retornar 200 OK instantaneamente
  return NextResponse.json({ success: true }, { status: 200 })
}

// Processar webhook em background (async)
async function processWebhook(request: Request) {
  try {
    console.log('📨 [PROTEO WEBHOOK] Requisição recebida')

    // 1. Validar secret
    const secret = process.env.PROTEO_WEBHOOK_SECRET
    if (!secret) {
      console.error('❌ [PROTEO WEBHOOK] PROTEO_WEBHOOK_SECRET não configurado')
      return
    }

    // Verificar secret no header Authorization ou query param
    const url = new URL(request.url)
    const querySecret = url.searchParams.get('secret')
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.replace('Bearer ', '')

    if (querySecret !== secret && bearerToken !== secret) {
      console.error('❌ [PROTEO WEBHOOK] Secret inválido')
      return
    }

    console.log('✅ [PROTEO WEBHOOK] Secret validado')

    // 2. Obter dados do body
    const body = await request.json()
    console.log('📦 [PROTEO WEBHOOK] Payload recebido:', JSON.stringify(body))

    // 3. Extrair CPF e status (flexível para diferentes formatos)
    const cpf =
      body.document ||
      body.cpf ||
      body.data?.document ||
      body.data?.cpf ||
      body.user?.document ||
      body.user?.cpf

    const rawStatus =
      body.status ||
      body.kyc_status ||
      body.data?.status ||
      body.data?.kyc_status ||
      body.verification_status

    if (!cpf || !rawStatus) {
      // Proteo pode enviar payloads intermediários sem CPF/status
      // Ex: {"success":true,"message":"Background check execution was successfully."}
      console.log(
        '⏭️ [PROTEO WEBHOOK] Payload intermediário (sem CPF/status) - ignorando',
      )
      return
    }

    console.log(`📋 [PROTEO WEBHOOK] CPF: ${cpf}, Status: ${rawStatus}`)

    // 4. Mapear status (aceitar vários formatos do Proteo)
    const statusLower = String(rawStatus).toLowerCase().trim()
    let finalStatus: 'approved' | 'rejected' | 'pending' | 'in_review'

    switch (statusLower) {
      case 'approved':
      case 'aprovado':
      case 'success':
      case 'complete':
      case 'completed': {
        finalStatus = 'approved'

        break
      }
      case 'rejected':
      case 'rejeitado':
      case 'reproved':
      case 'failed':
      case 'lost': {
        finalStatus = 'rejected'

        break
      }
      case 'pending':
      case 'pendente':
      case 'waiting': {
        finalStatus = 'pending'

        break
      }
      case 'in_review':
      case 'in-review':
      case 'em_analise':
      case 'analysing':
      case 'processing': {
        finalStatus = 'in_review'

        break
      }
      default: {
        console.error(`❌ [PROTEO WEBHOOK] Status desconhecido: ${statusLower}`)
        console.error(
          `📦 [PROTEO WEBHOOK] Payload completo:`,
          JSON.stringify(body),
        )
        return
      }
    }

    console.log(`✅ [PROTEO WEBHOOK] Status mapeado: ${finalStatus}`)

    // 5. Limpar CPF (apenas dígitos)
    const cpfDigits = String(cpf).replaceAll(/\D/g, '')
    if (cpfDigits.length !== 11) {
      console.error(`❌ [PROTEO WEBHOOK] CPF inválido: ${cpf}`)
      return
    }

    console.log(`✅ [PROTEO WEBHOOK] CPF validado: ${cpfDigits}`)

    // 6. Buscar usuário pelo CPF
    const supabase = await createAdminClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cpfDigits)
      .single()

    if (profileError || !profile) {
      console.error(
        `❌ [PROTEO WEBHOOK] Usuário não encontrado para CPF: ${cpfDigits}`,
        profileError,
      )
      return
    }

    const userId = profile.id
    console.log(`✅ [PROTEO WEBHOOK] Usuário encontrado: ${userId}`)

    // 7. Atualizar profile
    const profileUpdate: {
      kyc_status: string
      kyc_completed_at?: string
    } = {
      kyc_status: finalStatus,
    }

    if (finalStatus === 'approved') {
      profileUpdate.kyc_completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (updateError) {
      console.error(
        `❌ [PROTEO WEBHOOK] Erro ao atualizar profile:`,
        updateError,
      )
      return
    }

    console.log(
      `✅ [PROTEO WEBHOOK] Profile atualizado com status: ${finalStatus}`,
    )

    // 8. Criar/atualizar kyc_verifications
    const verificationData = {
      user_id: userId,
      status: finalStatus,
      updated_at: new Date().toISOString(),
      verified_at:
        finalStatus === 'approved' ? new Date().toISOString() : undefined,
    }

    const { error: verificationError } = await supabase
      .from('kyc_verifications')
      .upsert(verificationData, {
        onConflict: 'user_id',
      })

    if (verificationError) {
      console.error(
        `⚠️ [PROTEO WEBHOOK] Erro ao criar verificação (não crítico):`,
        verificationError,
      )
    } else {
      console.log(`✅ [PROTEO WEBHOOK] Verificação registrada`)
    }

    console.log(`🎉 [PROTEO WEBHOOK] Webhook processado com sucesso!`)
  } catch (error) {
    console.error('❌ [PROTEO WEBHOOK] Erro fatal:', error)
  }
}

// Aceitar GET apenas para teste rápido (retorna instruções)
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'This webhook only accepts POST requests',
    usage: {
      method: 'POST',
      url: '/api/proteo/webhook?secret=YOUR_SECRET',
      body: {
        document: '12345678900',
        status: 'approved',
      },
    },
  })
}
