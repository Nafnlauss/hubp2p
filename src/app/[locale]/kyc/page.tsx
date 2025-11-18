import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import ProteoKycEmbed from './proteo/page'

interface KYCPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function KYCPage({ params }: KYCPageProps) {
  const { locale } = await params

  console.log('🔍 [KYC PAGE] Verificando autenticação...')

  // Verificar autenticação no servidor
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('🔍 [KYC PAGE] User:', user ? user.email : 'null')

  // Se não autenticado, redirecionar para login
  if (!user) {
    console.log('🔴 [KYC PAGE] Não autenticado! Redirecionando para login')
    redirect(`/${locale}/login`)
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
    console.log('✅ [KYC PAGE] KYC já aprovado! Redirecionando para dashboard')
    redirect(`/${locale}/dashboard`)
  }

  // Renderizar componente do Proteo
  console.log('🎯 [KYC PAGE] Renderizando componente Proteo KYC')
  return <ProteoKycEmbed />
}
