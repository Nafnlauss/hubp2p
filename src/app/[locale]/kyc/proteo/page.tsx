'use client'

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

function buildKycUrl(base?: string | undefined, cpf?: string | undefined) {
  const fallback = 'https://onboarding.proteo.com.br/?tenant=dias_marketplace'
  const raw = (base && base.trim()) || fallback
  try {
    const u = new URL(raw)
    // Sempre substituir o document se tiver CPF válido
    if (cpf) {
      const digits = cpf.replaceAll(/\D/g, '')
      if (digits && digits.length === 11) {
        u.searchParams.set('document', digits)
        console.log('✅ [PROTEO] CPF setado na URL:', digits)
      } else {
        console.warn('⚠️ [PROTEO] CPF inválido:', cpf)
      }
    }
    console.log('🔗 [PROTEO] URL final:', u.toString())
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
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'completed' | 'error'
  >('loading')

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/${locale}/login`)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('cpf, full_name, kyc_status')
        .eq('id', user.id)
        .single()

      // Se já completou KYC, redirecionar para dashboard
      if (profile?.kyc_status === 'approved') {
        router.push(`/${locale}/dashboard`)
        return
      }

      const url = buildKycUrl(
        process.env.NEXT_PUBLIC_PROTEO_KYC_URL,
        profile?.cpf || undefined,
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
        // Aguardar webhook atualizar e redirecionar para página de sucesso
        setTimeout(() => {
          router.push(`/${locale}/sucesso`)
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
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando verificação KYC...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <h2 className="mb-2 text-2xl font-bold">Verificação Concluída!</h2>
          <p className="mb-4 text-muted-foreground">
            Sua verificação de identidade foi enviada com sucesso. Você será
            redirecionado para o dashboard em instantes.
          </p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-full flex-col bg-background">
      {/* Header com instruções */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-1 text-xl font-semibold">
                Verificação de Identidade (KYC)
              </h1>
              <p className="text-sm text-muted-foreground">
                Complete sua verificação de identidade abaixo. O processo é
                seguro e leva apenas alguns minutos. Esta verificação é
                obrigatória para acessar a plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Iframe container */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          src={kycUrl}
          title="Proteo KYC - Verificação de Identidade"
          className="absolute inset-0 h-full w-full border-0"
          allow="camera; microphone; clipboard-write; geolocation;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="eager"
          onLoad={() => console.log('Iframe do Proteo carregado')}
          onError={() => setStatus('error')}
        />

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="max-w-md p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
              <h2 className="mb-2 text-xl font-bold">Erro ao Carregar</h2>
              <p className="mb-4 text-muted-foreground">
                Não foi possível carregar a verificação do Proteo. Isso pode
                acontecer se o Proteo bloquear iframe (X-Frame-Options).
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
        <p className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
          <strong>Nota técnica:</strong> Se o conteúdo não carregar, o Proteo
          pode estar bloqueando iframe (X-Frame-Options/CSP). Nesse caso, use o
          botão &quot;Abrir em Nova Aba&quot; acima.
        </p>
      </div>
    </main>
  )
}
