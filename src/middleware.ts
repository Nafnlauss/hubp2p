import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware para roteamento baseado em locale e autenticacao Supabase
 *
 * Este middleware:
 * 1. Atualiza a sessao do Supabase (refresh de tokens)
 * 2. Detecta a locale preferida do usuario
 * 3. Redireciona para o caminho com locale se necessario
 * 4. Define o locale no contexto da requisicao
 *
 * Nota: A deteccao de subdomain (api.hubp2p.com) é feita na propria pagina
 * para evitar problemas com NextResponse.rewrite() em ambientes de proxy.
 */
const intlMiddleware = createMiddleware({
  // Locales suportadas
  locales: ['pt-BR', 'en', 'es'],

  // Locale padrao
  defaultLocale: 'pt-BR',

  // Estrategia de roteamento:
  // 'never' = sem prefixo de locale nas URLs (ex: /page em vez de /pt-BR/page)
  // O locale é detectado via Accept-Language header ou cookie
  localePrefix: 'never',

  // Detectar linguagem automaticamente do Accept-Language header
  localeDetection: true,
})

export async function middleware(request: NextRequest) {
  // Skip intl middleware for API routes and admin routes
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    return await updateSession(request)
  }

  // 1. Atualizar sessao do Supabase (importante fazer primeiro)
  const supabaseResponse = await updateSession(request)

  // Se o updateSession decidiu redirecionar, respeite esse redirect
  // (casos: usuario nao autenticado em rota protegida ou ja autenticado em rotas de auth)
  const hasRedirect =
    supabaseResponse.status === 307 ||
    supabaseResponse.status === 308 ||
    Boolean(supabaseResponse.headers.get('location'))
  if (hasRedirect) return supabaseResponse

  // 2. Aplicar middleware de internacionalizacao
  const intlResponse = intlMiddleware(request)

  // 3. Combinar cookies do Supabase com a resposta de i18n
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value)
  }

  return intlResponse
}

export const config = {
  // Rotas que nao devem passar pelo middleware
  matcher: [
    // Skip Next.js internals and all static files, unless it's the root
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
