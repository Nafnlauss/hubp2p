import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Verificar se temos os cookies customizados de sessão
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  console.log('🔑 [MIDDLEWARE] Cookies customizados:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenPreview: accessToken?.slice(0, 20) + '...',
  })

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

  // Se temos tokens customizados, setar a sessão manualmente
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // If user is logged in and tries to access auth pages, redirect to dashboard
  // BUT allow access to onboarding routes even if logged in
  if (user && isAuthRoute) {
    console.log(
      '🟢 [MIDDLEWARE] Usuário autenticado tentando acessar página de auth. Redirecionando para dashboard',
    )
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
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
