import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { signInSchema } from '@/lib/validations/auth'
import type { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    console.log('🔵 [API] Recebendo requisição de login...')

    const body = await request.json()
    const validatedData = signInSchema.parse(body)

    console.log('🔵 [API] Login para:', validatedData.email)

    const cookieStore = cookies()

    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              for (const { name, value, options } of cookiesToSet)
                cookieStore.set(name, value, options)
            } catch {
              // Ignore errors
            }
          },
        },
      },
    )

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      console.error('❌ [API] Erro no login:', error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      )
    }

    if (!authData.session) {
      console.error('❌ [API] Sessão não criada')
      return NextResponse.json(
        { success: false, error: 'Erro ao criar sessão' },
        { status: 500 },
      )
    }

    console.log('✅ [API] Login bem-sucedido:', authData.user?.email)
    console.log('🔑 [API] Session criada:', {
      access_token: authData.session.access_token.slice(0, 20) + '...',
      refresh_token: authData.session.refresh_token?.slice(0, 20) + '...',
    })

    // Verificar progresso do onboarding para redirecionar corretamente
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let redirectTo = '/dashboard'

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'kyc_status, first_deposit_completed, wallet_configured, onboarding_completed',
        )
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.kyc_status !== 'approved') {
          redirectTo = '/kyc'
        } else if (!profile.first_deposit_completed) {
          redirectTo = '/deposit'
        } else if (!profile.wallet_configured) {
          redirectTo = '/wallet'
        }
      }
    }

    console.log('✅ [API] Retornando redirectTo:', redirectTo)

    // Debug: ver quais cookies foram setados
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log(
      '🍪 [API] Todos os cookies após login:',
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // O Supabase SSR já cuida de setar os cookies automaticamente
    // através do cookieStore.set() que foi passado no createServerClient
    console.log('✅ [API] Sessão criada - cookies setados pelo Supabase SSR')

    return NextResponse.json({
      success: true,
      redirectTo,
    })
  } catch (error) {
    console.error('❌ [API] Erro no catch:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 },
    )
  }
}
