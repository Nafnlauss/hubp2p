'use client'

import { Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

import ProteoKycEmbed from './proteo/page'

export default function KYCPage() {
  const router = useRouter()
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      console.log('🔍 [KYC PAGE] Verificando autenticação no client...')

      const supabase = createClient()

      // Polling: tentar várias vezes até encontrar a sessão
      let user
      const maxAttempts = 10
      const delayBetweenAttempts = 300

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(
          `🔄 [KYC PAGE] Tentativa ${attempt}/${maxAttempts} de buscar sessão...`,
        )

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (currentUser) {
          user = currentUser
          console.log(
            `✅ [KYC PAGE] Sessão encontrada na tentativa ${attempt}:`,
            currentUser.email,
          )
          break
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenAttempts),
          )
        }
      }

      if (!user) {
        console.log(
          '🔴 [KYC PAGE] Não autenticado após todas as tentativas! Redirecionando para login',
        )
        router.push(`/${locale}/login`)
        return
      }

      // Buscar status do KYC
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single()

      console.log('🔍 [KYC PAGE] KYC Status:', profile?.kyc_status)

      // Se KYC já aprovado, redirecionar para dashboard
      if (profile?.kyc_status === 'approved') {
        console.log(
          '✅ [KYC PAGE] KYC já aprovado! Redirecionando para dashboard',
        )
        router.push(`/${locale}/dashboard`)
        return
      }

      // Usuário autenticado e KYC não aprovado, mostrar Proteo
      console.log('🎯 [KYC PAGE] Renderizando componente Proteo KYC')
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, locale])

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('❌ [KYC PAGE] Erro ao deslogar:', error)
    } finally {
      router.push(`/${locale}/login`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-muted-foreground/30 bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
        <span>Não quer continuar agora?</span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1 text-foreground transition hover:text-destructive disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
      <ProteoKycEmbed />
    </div>
  )
}
