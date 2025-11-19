import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    console.log('🔵 [SIGNOUT] Recebendo requisição de logout...')

    const cookieStore = await cookies()

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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {
              // Ignore errors
            }
          },
        },
      },
    )

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('❌ [SIGNOUT] Erro ao fazer logout:', error.message)
      return NextResponse.redirect(new URL('/pt-BR/login', request.url), 303)
    }

    console.log('✅ [SIGNOUT] Logout bem-sucedido')

    // Redirect to login page with 303 See Other status
    // This ensures the browser follows the redirect with a GET request after POST
    return NextResponse.redirect(new URL('/pt-BR/login', request.url), 303)
  } catch (error) {
    console.error('❌ [SIGNOUT] Erro no catch:', error)

    // Even if there's an error, redirect to login
    return NextResponse.redirect(new URL('/pt-BR/login', request.url), 303)
  }
}
