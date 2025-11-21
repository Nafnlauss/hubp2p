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
  console.log('🟢 [PROTEO COMPONENT] Componente montado!')

  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kycUrl, setKycUrl] = useState<string>('')
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'completed' | 'error'
  >('loading')

  console.log('🟢 [PROTEO COMPONENT] Estado inicial:', {
    loading,
    status,
    kycUrl,
  })

  useEffect(() => {
    console.log('🔵 [PROTEO EFFECT] useEffect executado!')

    const supabase = createClient()

    async function init() {
      console.log('🔵 [PROTEO] Iniciando verificação KYC...')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('🔴 [PROTEO] Usuário não autenticado')
        router.push(`/${locale}/login`)
        return
      }

      console.log('✅ [PROTEO] Usuário autenticado:', user.email)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('cpf, full_name, kyc_status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ [PROTEO] Erro ao buscar perfil:', profileError)
        setStatus('error')
        setLoading(false)
        return
      }

      console.log('📋 [PROTEO] Profile encontrado:', {
        cpf: profile?.cpf,
        full_name: profile?.full_name,
        kyc_status: profile?.kyc_status,
      })

      // Se já completou KYC, redirecionar para dashboard
      if (profile?.kyc_status === 'approved') {
        console.log('✅ [PROTEO] KYC já aprovado, redirecionando...')
        router.push(`/${locale}/dashboard`)
        return
      }

      const cpfFromProfile = profile?.cpf?.replaceAll(/\D/g, '') || ''
      const cpfFromMetadata =
        (user.user_metadata as { cpf?: string })?.cpf?.replaceAll(/\D/g, '') ||
        ''

      const cpfToUse = cpfFromProfile || cpfFromMetadata

      if (!cpfToUse || cpfToUse.length !== 11) {
        console.error('❌ [PROTEO] CPF não encontrado no perfil ou metadados!')
        setStatus('error')
        setLoading(false)
        return
      }

      const url = buildKycUrl(process.env.NEXT_PUBLIC_PROTEO_KYC_URL, cpfToUse)
      setKycUrl(url)
      setStatus('ready')
      setLoading(false)
    }

    init()

    // Polling: verificar periodicamente se o KYC foi aprovado no banco
    const pollInterval = setInterval(async () => {
      console.log('🔄 [PROTEO] Verificando status do KYC no banco...')

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', currentUser.id)
        .single()

      if (profile?.kyc_status === 'approved') {
        console.log('✅ [PROTEO] KYC aprovado detectado via polling!')
        setStatus('completed')
        clearInterval(pollInterval)
        // Redirecionar para página de sucesso
        setTimeout(() => {
          router.push(`/${locale}/sucesso`)
        }, 1000)
      }
    }, 3000) // Verificar a cada 3 segundos

    // Listener para mensagens do iframe (caso Proteo envie postMessage)
    const handleMessage = async (event: MessageEvent) => {
      // Verificar origem por segurança
      if (!event.origin.includes('proteo.com.br')) return

      console.log('📨 [PROTEO] Mensagem recebida do iframe:', event.data)

      // Proteo envia {event: 'complete'} quando o onboarding é finalizado
      if (event.data?.event === 'complete' && event.data?.step === 'Complete') {
        console.log('📋 [PROTEO] Onboarding finalizado.')
        console.log('⏳ [PROTEO] Aguardando webhook do Proteo aprovar KYC...')

        // ⚠️ SEGURANÇA: NÃO aprovar automaticamente!
        // O Proteo precisa analisar os documentos e pode APROVAR ou REJEITAR
        // Apenas o webhook do Proteo (com validação de secret) deve atualizar o status
        // O polling vai continuar verificando até o webhook atualizar o banco

        // NÃO chamar /api/kyc/complete aqui!
        // NÃO redirecionar automaticamente!
        // Deixar o polling fazer o trabalho
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(pollInterval)
    }
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
                Não foi possível carregar a verificação do Proteo.
                {!kycUrl && ' CPF não encontrado no seu cadastro.'}
                {kycUrl &&
                  ' Isso pode acontecer se o Proteo bloquear iframe (X-Frame-Options).'}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
                {kycUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(kycUrl, '_blank')
                    }}
                  >
                    Abrir em Nova Aba
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/kyc`)}
                >
                  Voltar para KYC
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
