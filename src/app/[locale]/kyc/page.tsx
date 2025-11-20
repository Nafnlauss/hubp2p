'use client'

import { Loader2 } from 'lucide-react'
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

  useEffect(() => {
    async function checkAuth() {
      console.log('🔍 [KYC PAGE] Verificando autenticação no client...')

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log('🔍 [KYC PAGE] User:', user ? user.email : 'null')

      if (!user) {
        console.log('🔴 [KYC PAGE] Não autenticado! Redirecionando para login')
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

  return <ProteoKycEmbed />
}
