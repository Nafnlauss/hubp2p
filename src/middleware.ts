import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware para roteamento baseado em locale e autenticação Supabase
 *
 * Este middleware:
 * 1. Atualiza a sessão do Supabase (refresh de tokens)
 * 2. Detecta a locale preferida do usuário
 * 3. Redireciona para o caminho com locale se necessário
 * 4. Define o locale no contexto da requisição
 */
const intlMiddleware = createMiddleware({
  // Locales suportadas
  locales: ['pt-BR', 'en', 'es'],

  // Locale padrão
  defaultLocale: 'pt-BR',

  // Estratégia de roteamento:
  // 'never' = sem prefixo de locale nas URLs (ex: /page em vez de /pt-BR/page)
  // O locale é detectado via Accept-Language header ou cookie
  localePrefix: 'never',

  // Detectar linguagem automaticamente do Accept-Language header
  localeDetection: true,
})

export async function middleware(request: NextRequest) {
  // Check if request is from api.hubp2p.com subdomain
  const hostname = request.headers.get('host') || ''
  const xForwardedHost = request.headers.get('x-forwarded-host') || ''
  const effectiveHost = xForwardedHost || hostname

  // Debug log for subdomain detection
  console.log('🌐 [MIDDLEWARE] Host:', hostname)
  console.log('🌐 [MIDDLEWARE] X-Forwarded-Host:', xForwardedHost)
  console.log('🌐 [MIDDLEWARE] Effective Host:', effectiveHost)

  const isApiSubdomain =
    effectiveHost === 'api.hubp2p.com' ||
    effectiveHost.startsWith('api.hubp2p.com:') ||
    hostname === 'api.hubp2p.com' ||
    hostname.startsWith('api.hubp2p.com:')

  // Handle api.hubp2p.com subdomain - rewrite all paths to /comprar/*
  if (isApiSubdomain) {
    console.log('✅ [MIDDLEWARE] API subdomain detected!')
    const pathname = request.nextUrl.pathname

    // Skip static files and Next.js internals
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Rewrite paths:
    // api.hubp2p.com/ -> /comprar
    // api.hubp2p.com/[id] -> /comprar/[id]
    const url = request.nextUrl.clone()
    if (pathname === '/' || pathname === '') {
      url.pathname = '/comprar'
    } else if (!pathname.startsWith('/comprar')) {
      // If path is /abc123, rewrite to /comprar/abc123
      url.pathname = `/comprar${pathname}`
    }

    // Simple rewrite without complex middleware chaining
    return NextResponse.rewrite(url)
  }

  // Skip intl middleware for API routes and admin routes
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    return await updateSession(request)
  }

  // 1. Atualizar sessão do Supabase (importante fazer primeiro)
  const supabaseResponse = await updateSession(request)

  // Se o updateSession decidiu redirecionar, respeite esse redirect
  // (casos: usuário não autenticado em rota protegida ou já autenticado em rotas de auth)
  const hasRedirect =
    supabaseResponse.status === 307 ||
    supabaseResponse.status === 308 ||
    Boolean(supabaseResponse.headers.get('location'))
  if (hasRedirect) return supabaseResponse

  // 2. Aplicar middleware de internacionalização
  const intlResponse = intlMiddleware(request)

  // 3. Combinar cookies do Supabase com a resposta de i18n
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value)
  }

  return intlResponse
}

export const config = {
  // Rotas que não devem passar pelo middleware
  matcher: [
    // Skip Next.js internals and all static files, unless it's the root
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
