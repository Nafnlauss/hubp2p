export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

type KycStatus = 'pending' | 'in_review' | 'approved' | 'rejected'

function normalize(value?: string | null): string | null {
  return (value || '').toString().trim().toLowerCase() || null
}

function mapStatus(raw?: string | null): KycStatus | null {
  const v = normalize(raw)
  if (!v) return null
  const map: Record<string, KycStatus> = {
    approved: 'approved',
    aprovado: 'approved',
    success: 'approved',
    ok: 'approved',
    pending: 'pending',
    pendente: 'pending',
    waiting: 'pending',
    in_review: 'in_review',
    'in-review': 'in_review',
    review: 'in_review',
    em_analise: 'in_review',
    'em-analise': 'in_review',
    analysing: 'in_review',
    rejected: 'rejected',
    rejeitado: 'rejected',
    reproved: 'rejected',
    failed: 'rejected',
  }
  return map[v] || null
}

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export async function POST(request: Request) {
  try {
    const secret = process.env.PROTEO_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Missing PROTEO_WEBHOOK_SECRET' },
        { status: 500 }
      )
    }

    // Prefer Authorization: Bearer <secret>, allow fallback ?secret=
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : null

    const url = new URL(request.url)
    const queryToken = url.searchParams.get('secret')

    if (token !== secret && queryToken !== secret) {
      return unauthorized()
    }

    const body = await request.json().catch(() => ({} as any))

    // Try to resolve status and identifiers with flexible keys
    const status =
      mapStatus(body.status) ||
      mapStatus(body?.event?.status) ||
      mapStatus(body?.kyc_status) ||
      null

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid KYC status' },
        { status: 400 }
      )
    }

    const userId: string | null =
      body.user_id || body.supabase_user_id || body?.event?.user_id || null

    const proteoVerificationId: string | null =
      body.proteo_verification_id ||
      body.verification_id ||
      body.background_check_id ||
      body.kyc_id ||
      body.id ||
      null

    const supabase = await createAdminClient()

    let resolvedUserId: string | null = userId

    // If userId is not provided, try to find by proteo_verification_id
    if (!resolvedUserId && proteoVerificationId) {
      const { data: existing } = await supabase
        .from('kyc_verifications')
        .select('user_id')
        .eq('proteo_verification_id', proteoVerificationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      resolvedUserId = existing?.user_id ?? null
    }

    // 2) Try by CPF/document if provided in webhook payload
    if (!resolvedUserId) {
      const cpf: string | null =
        body.document || body.cpf || body?.event?.document || null
      if (cpf) {
        const digits = String(cpf).replace(/\D/g, '')
        if (digits) {
          const { data: byCpf } = await supabase
            .from('profiles')
            .select('id')
            // @ts-expect-error: profiles.cpf exists in DB though not in TS type here
            .eq('cpf', digits)
            .limit(1)
            .maybeSingle()
          resolvedUserId = byCpf?.id ?? null
        }
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to resolve user_id. Send user_id or a known proteo_verification_id.',
        },
        { status: 400 }
      )
    }

    // Upsert kyc_verifications by proteo_verification_id if present, else insert new
    if (proteoVerificationId) {
      const { data: existing } = await supabase
        .from('kyc_verifications')
        .select('id')
        .eq('user_id', resolvedUserId)
        .eq('proteo_verification_id', proteoVerificationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        await supabase
          .from('kyc_verifications')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase.from('kyc_verifications').insert({
          user_id: resolvedUserId,
          status,
          proteo_verification_id: proteoVerificationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          verified_at: status === 'approved' ? new Date().toISOString() : null,
        })
      }
    } else {
      await supabase.from('kyc_verifications').insert({
        user_id: resolvedUserId,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verified_at: status === 'approved' ? new Date().toISOString() : null,
      })
    }

    // Best-effort: update profiles.kyc_status (cast to any to avoid TS constraints)
    const profileUpdate: Record<string, any> = { kyc_status: status }
    if (status === 'approved') {
      profileUpdate.kyc_completed_at = new Date().toISOString()
    }
    await supabase.from('profiles').update(profileUpdate as any).eq('id', resolvedUserId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Proteo Webhook] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
