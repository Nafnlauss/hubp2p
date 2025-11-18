import { redirect } from 'next/navigation'

import { getOnboardingStatus } from '@/app/actions/onboarding'

interface KYCPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function KYCPage({ params }: KYCPageProps) {
  const { locale } = await params

  console.log('🔍 [KYC PAGE] Iniciando verificação de status...')
  const status = await getOnboardingStatus()

  console.log('🔍 [KYC PAGE] Status recebido:', status)

  if (!status) {
    console.log('🔴 [KYC PAGE] Status null - redirecionando para login')
    redirect(`/${locale}/login`)
  }

  console.log('🔍 [KYC PAGE] KYC Completed:', status.kycCompleted)
  console.log('🔍 [KYC PAGE] Next Step:', status.nextStep)

  // Se já completou KYC, redirecionar para próximo passo
  if (status.kycCompleted) {
    const nextPath = `/${locale}${status.nextStep.startsWith('/') ? '' : '/'}${status.nextStep.replace(/^\/(pt-BR|en|es)/, '')}`
    console.log('✅ [KYC PAGE] KYC completo - redirecionando para:', nextPath)
    redirect(nextPath)
  }

  // Redirecionar para página com iframe do Proteo
  console.log(
    '➡️ [KYC PAGE] KYC não completo - redirecionando para /kyc/proteo',
  )
  redirect(`/${locale}/kyc/proteo`)
}
