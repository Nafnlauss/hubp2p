'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

import { getOnboardingStatus } from '@/app/actions/onboarding'

export default function KYCPage() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    async function checkAndRedirect() {
      console.log('🔍 [KYC PAGE] Iniciando verificação de status...')
      const status = await getOnboardingStatus()

      console.log('🔍 [KYC PAGE] Status recebido:', status)

      if (!status) {
        console.log('🔴 [KYC PAGE] Status null - redirecionando para login')
        router.push(`/${locale}/login`)
        return
      }

      console.log('🔍 [KYC PAGE] KYC Completed:', status.kycCompleted)
      console.log('🔍 [KYC PAGE] Next Step:', status.nextStep)

      // Se já completou KYC, redirecionar para próximo passo
      if (status.kycCompleted) {
        const nextPath = `/${locale}${status.nextStep.startsWith('/') ? '' : '/'}${status.nextStep.replace(/^\/(pt-BR|en|es)/, '')}`
        console.log(
          '✅ [KYC PAGE] KYC completo - redirecionando para:',
          nextPath,
        )
        router.push(nextPath)
        return
      }

      // Redirecionar para página com iframe do Proteo
      console.log(
        '➡️ [KYC PAGE] KYC não completo - redirecionando para /kyc/proteo',
      )
      router.push(`/${locale}/kyc/proteo`)
    }

    checkAndRedirect()
  }, [router, locale])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Redirecionando para verificação KYC...
        </p>
      </div>
    </div>
  )
}
