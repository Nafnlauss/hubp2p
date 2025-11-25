'use client'

import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/navigation'

export default function ProteoDirectPage() {
  const router = useRouter()
  const searchParameters = useSearchParams()
  const [kycUrl, setKycUrl] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const cpf = searchParameters.get('cpf')

    if (!cpf || cpf.length !== 11) {
      setError(true)
      return
    }

    // Construir URL do Proteo
    const baseUrl =
      'https://onboarding.proteo.com.br/?tenant=dias_marketplace&background_check_id=3c35bb87-0b04-4130-a026-e4ee9f8ce2c4'
    const url = new URL(baseUrl)
    url.searchParams.set('document', cpf)

    setKycUrl(url.toString())
  }, [searchParameters])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h2 className="mb-2 text-xl font-bold">CPF Inválido</h2>
          <p className="mb-4 text-muted-foreground">
            O CPF fornecido é inválido. Por favor, volte e insira um CPF válido.
          </p>
          <Button onClick={() => router.push('/kyc-manual')}>Voltar</Button>
        </div>
      </div>
    )
  }

  if (!kycUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Preparando verificação...
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="mb-1 text-xl font-semibold">
            Verificação de Identidade (KYC)
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete sua verificação de identidade abaixo. O processo é seguro e
            leva apenas alguns minutos.
          </p>
        </div>
      </div>

      {/* Iframe */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={kycUrl}
          title="Proteo KYC - Verificação de Identidade"
          className="absolute inset-0 h-full w-full border-0"
          allow="camera; microphone; clipboard-write; geolocation;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={() => setError(true)}
        />
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <div className="mx-auto flex max-w-4xl justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/kyc-manual')}
          >
            Voltar
          </Button>
        </div>
      </div>
    </main>
  )
}
