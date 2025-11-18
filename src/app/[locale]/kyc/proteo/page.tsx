'use client'

import { useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function buildKycUrl(base?: string | null, cpf?: string | null) {
  const fallback = 'https://onboarding.proteo.com.br/?tenant=dias_marketplace'
  const raw = (base && base.trim()) || fallback
  try {
    const u = new URL(raw)
    if (cpf && !u.searchParams.has('document')) {
      const digits = cpf.replace(/\D/g, '')
      if (digits) u.searchParams.set('document', digits)
    }
    return u.toString()
  } catch {
    return raw
  }
}

export default function ProteoKycEmbed() {
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kycUrl, setKycUrl] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'completed' | 'error'>('loading')

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/${locale}/login`)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('cpf, full_name, kyc_status')
        .eq('id', user.id)
        .single()

      // Se já completou KYC, redirecionar para depósito
      if (profile?.kyc_status === 'approved') {
        router.push(`/${locale}/deposit`)
        return
      }

      const url = buildKycUrl(
        process.env.NEXT_PUBLIC_PROTEO_KYC_URL,
        profile?.cpf || null
      )
      setKycUrl(url)
      setStatus('ready')
      setLoading(false)
    }

    init()

    // Listener para mensagens do iframe (caso Proteo envie postMessage)
    const handleMessage = (event: MessageEvent) => {
      // Verificar origem por segurança
      if (!event.origin.includes('proteo.com.br')) return

      console.log('Mensagem recebida do Proteo:', event.data)

      // Proteo pode enviar diferentes formatos de mensagem
      if (
        event.data?.status === 'completed' ||
        event.data?.event === 'kyc_completed' ||
        event.data?.type === 'success'
      ) {
        setStatus('completed')
        // Aguardar webhook atualizar e redirecionar
        setTimeout(() => {
          router.push(`/${locale}/deposit`)
        }, 2000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [locale, router])

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando verificação KYC...</p>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verificação Concluída!</h2>
          <p className="text-muted-foreground mb-4">
            Sua verificação de identidade foi enviada com sucesso.
            Você será redirecionado para a página de depósito em instantes.
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <main className="h-screen w-full flex flex-col bg-background">
      {/* Header com instruções */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold mb-1">Verificação de Identidade (KYC)</h1>
              <p className="text-sm text-muted-foreground">
                Complete sua verificação de identidade abaixo. O processo é seguro e leva apenas alguns minutos.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              Fazer depois
            </Button>
          </div>
        </div>
      </div>

      {/* Iframe container */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src={kycUrl}
          title="Proteo KYC - Verificação de Identidade"
          className="absolute inset-0 w-full h-full border-0"
          allow="camera; microphone; clipboard-write; geolocation;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="eager"
          onLoad={() => console.log('Iframe do Proteo carregado')}
          onError={() => setStatus('error')}
        />

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center max-w-md p-8">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Erro ao Carregar</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar a verificação do Proteo.
                Isso pode acontecer se o Proteo bloquear iframe (X-Frame-Options).
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(kycUrl, '_blank')
                  }}
                >
                  Abrir em Nova Aba
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer com nota técnica */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto">
          <strong>Nota técnica:</strong> Se o conteúdo não carregar, o Proteo pode estar bloqueando iframe
          (X-Frame-Options/CSP). Nesse caso, use o botão "Abrir em Nova Aba" acima.
        </p>
      </div>
    </main>
  )
}
