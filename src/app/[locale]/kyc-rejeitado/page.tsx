'use client'

import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/navigation'

export default function KycRejeitadoPage() {
  const router = useRouter()

  const tentarNovamente = () => {
    router.push('/kyc/proteo')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Card principal */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header com aviso */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-16 text-center">
            <div className="mb-6 inline-flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <AlertCircle className="h-20 w-20 text-white" />
            </div>
            <h1 className="mb-3 text-4xl font-bold text-white">
              Verificação Não Aprovada
            </h1>
            <p className="text-xl text-red-100">
              Infelizmente, não conseguimos aprovar seu KYC
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            {/* Status */}
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                ❌ O que aconteceu?
              </h2>
              <p className="mb-4 text-gray-700">
                Sua verificação de identidade foi recusada pela Proteo. Isso
                pode acontecer por diversos motivos:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-500">•</span>
                  <span>Documentos ilegíveis ou de má qualidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-500">•</span>
                  <span>Foto da selfie não corresponde ao documento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-500">•</span>
                  <span>Dados inconsistentes ou incorretos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-red-500">•</span>
                  <span>Documentos vencidos ou inválidos</span>
                </li>
              </ul>
            </div>

            {/* O que fazer */}
            <div className="mb-8 rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                💡 O que você pode fazer?
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">
                  Você pode tentar novamente seguindo estas dicas:
                </p>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">1.</span>
                    <span>
                      Certifique-se de que seus documentos estão{' '}
                      <strong>legíveis e bem iluminados</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">2.</span>
                    <span>
                      Tire fotos <strong>nítidas</strong>, sem reflexos ou
                      sombras
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">3.</span>
                    <span>
                      Na selfie, certifique-se de que seu{' '}
                      <strong>rosto está bem visível</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">4.</span>
                    <span>
                      Confirme se todos os <strong>dados estão corretos</strong>
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button
                onClick={tentarNovamente}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-orange-600 hover:to-red-600 hover:shadow-xl"
              >
                Tentar Novamente
              </Button>

              <div className="text-center text-sm text-gray-500">
                Você pode refazer a verificação quantas vezes precisar
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
                <span>
                  Precisa de ajuda?{' '}
                  <a
                    href="mailto:suporte@hubp2p.com"
                    className="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Contate o suporte
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
