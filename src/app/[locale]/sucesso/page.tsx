'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export default function SucessoPage() {
  const router = useRouter()
  const locale = useLocale()
  const [status, setStatus] = useState<'loading' | 'approved'>('loading')

  useEffect(() => {
    const supabase = createClient()

    async function verifyKycWithPolling() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/${locale}/login`)
        return
      }

      // Polling: tentar até 30 segundos para o webhook atualizar o banco
      const maxAttempts = 60 // 60 tentativas
      const delayBetweenAttempts = 500 // 500ms entre tentativas = 30 segundos total

      console.log('🔍 [SUCESSO] Iniciando polling para verificar KYC...')

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(
          `🔄 [SUCESSO] Tentativa ${attempt}/${maxAttempts} de verificar KYC...`,
        )

        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_status')
          .eq('id', user.id)
          .single()

        if (profile?.kyc_status === 'approved') {
          console.log('✅ [SUCESSO] KYC aprovado encontrado!')
          setStatus('approved')
          return
        }

        // Se ainda não foi atualizado, aguardar antes da próxima tentativa
        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenAttempts),
          )
        }
      }

      // Se após todas as tentativas ainda não estiver aprovado, redirecionar para /kyc
      console.log(
        '❌ [SUCESSO] KYC não foi aprovado após polling. Redirecionando para /kyc',
      )
      router.replace(`/${locale}/kyc`)
    }

    void verifyKycWithPolling()
  }, [locale, router])

  const irParaDashboard = () => {
    router.push(`/${locale}/dashboard`)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Card principal */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Animação de sucesso */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-16 text-center">
            <div className="mb-6 inline-flex h-32 w-32 animate-bounce items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-7xl">✓</span>
            </div>
            <h1 className="mb-3 text-4xl font-bold text-white">
              Verificação Concluída!
            </h1>
            <p className="text-xl text-green-100">
              Seu KYC foi enviado com sucesso
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Status */}
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                  <span className="text-2xl text-white">✓</span>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🎉 Seu KYC foi Aprovado!
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Você já pode acessar todas as funcionalidades da plataforma
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <button
                onClick={irParaDashboard}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
              >
                Ir para o Dashboard →
              </button>

              <div className="text-center text-sm text-gray-500">
                Clique no botão acima quando estiver pronto para acessar o
                dashboard
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🔒</span>
                <span>Seus dados estão protegidos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span>Fique atento ao seu e-mail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Dúvidas?{' '}
            <a
              href="mailto:suporte@hubp2p.com"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Entre em contato com o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
