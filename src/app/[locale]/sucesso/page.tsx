'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

export default function SucessoPage() {
  const router = useRouter()
  const locale = useLocale()
  const [countdown, setCountdown] = useState(5)

  // Removido redirecionamento automático para dar tempo do webhook do Proteo
  // atualizar o status do KYC no banco antes do usuário tentar acessar o dashboard

  const irParaDashboard = () => {
    router.push(`/${locale}/dashboard`)
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
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">
                    Verificação Recebida
                  </h2>
                  <p className="text-sm text-gray-600">
                    Seus documentos estão sendo analisados
                  </p>
                </div>
              </div>
            </div>

            {/* Próximos passos */}
            <div className="mb-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Próximos passos:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Análise de documentos
                    </p>
                    <p className="text-sm text-gray-600">
                      Nossa equipe irá verificar suas informações (1-2 dias
                      úteis)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Notificação por e-mail
                    </p>
                    <p className="text-sm text-gray-600">
                      Você receberá um e-mail assim que a verificação for
                      aprovada
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      Acesso completo à plataforma
                    </p>
                    <p className="text-sm text-gray-600">
                      Após aprovação, você poderá realizar transações
                    </p>
                  </div>
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
