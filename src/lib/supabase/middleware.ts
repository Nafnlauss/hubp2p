import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Debug: ver todos os cookies recebidos
  const allRequestCookies = request.cookies.getAll()
  console.log(
    '🍪 [MIDDLEWARE] Cookies recebidos:',
    allRequestCookies.map((c) => c.name),
  )

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  // Obter usuário autenticado através dos cookies padrão do Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile: { kyc_status?: string | null } | null

  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('❌ [MIDDLEWARE] Erro ao buscar perfil:', error.message)
    }

    userProfile = profile
  }

  const pathname = request.nextUrl.pathname

  console.log(
    '🔍 [MIDDLEWARE] User:',
    user ? `${user.email} (${user.id})` : 'null',
  )
  console.log('🔍 [MIDDLEWARE] Path:', pathname)

  // List of protected routes that require authentication
  // NOTE: /kyc removed from here because auth verification is done in the page component
  const protectedRoutes = [
    '/dashboard',
    '/deposit',
    '/wallet',
    '/admin',
    '/transactions',
    '/offers',
    '/settings',
  ]

  // List of auth routes (login, register)
  const authRoutes = ['/login', '/register', '/auth']

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.includes(route),
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.includes(route))

  console.log('🔍 [MIDDLEWARE] isProtectedRoute:', isProtectedRoute)
  console.log('🔍 [MIDDLEWARE] isAuthRoute:', isAuthRoute)

  // Extract locale from pathname ensuring it's valid; fallback to default when missing/invalid
  const supportedLocales = ['pt-BR', 'en', 'es'] as const
  const firstSegment = pathname.split('/')[1] || ''
  const locale = (supportedLocales as readonly string[]).includes(firstSegment)
    ? firstSegment
    : 'pt-BR'

  // Protected routes - redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    console.log('🔴 [MIDDLEWARE] Não autenticado! Redirecionando para login')
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // Usuários autenticados mas com KYC pendente não podem acessar rotas protegidas
  if (user && isProtectedRoute && userProfile?.kyc_status !== 'approved') {
    console.log(
      '🟠 [MIDDLEWARE] KYC pendente! Redirecionando usuário autenticado para KYC',
    )
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/kyc`
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  // BUT allow access to signout route and onboarding routes even if logged in
  const isSignoutRoute = pathname.includes('/auth/signout')

  if (user && isAuthRoute && !isSignoutRoute) {
    const targetPath =
      userProfile?.kyc_status === 'approved' ? '/dashboard' : '/kyc'

    console.log(
      '🟢 [MIDDLEWARE] Usuário autenticado acessando rota pública. Aplicando redirecionamento para',
      targetPath,
    )
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${targetPath}`
    return NextResponse.redirect(url)
  }

  console.log('✅ [MIDDLEWARE] Permitindo acesso')

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
