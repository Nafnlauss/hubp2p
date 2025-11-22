/* eslint-disable unicorn/no-null */
import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { transactionId, status } = await request.json()

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Missing transactionId or status' },
        { status: 400 },
      )
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('transactions')
      .update({
        status,
        tx_hash: null,
        payment_confirmed_at: null,
        crypto_sent_at: null,
      })
      .eq('id', transactionId)

    if (error) {
      console.error('Erro ao resetar transação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar transação:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
