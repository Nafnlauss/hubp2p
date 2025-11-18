import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ locale: string }>
}

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
    // If URL constructor fails, return the raw string
    return raw
  }
}

export default async function ProteoKycEmbed({ params }: PageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf, full_name')
    .eq('id', user!.id)
    .single()

  const src = buildKycUrl(process.env.NEXT_PUBLIC_PROTEO_KYC_URL, profile?.cpf || null)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Verificação de Identidade (KYC)</h1>
        <p className="text-sm text-muted-foreground">
          Complete sua verificação abaixo sem sair da plataforma.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <iframe
          src={src}
          title="Proteo KYC"
          className="h-[calc(100vh-200px)] w-full rounded-md border-0"
          allow="camera; microphone; clipboard-write;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Se o conteúdo não carregar dentro do iframe, verifique se o domínio da Proteo
        permite embed (X-Frame-Options/CSP frame-ancestors). Abra o DevTools → aba Network,
        inspecione a resposta do documento e confira os cabeçalhos.
      </p>
    </main>
  )
}

