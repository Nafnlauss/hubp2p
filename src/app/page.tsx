'use client'

const PROTEO_URL =
  process.env.NEXT_PUBLIC_PROTEO_KYC_URL ||
  'https://onboarding.proteo.com.br/?tenant=dias_marketplace&background_check_id=3c35bb87-0b04-4130-a026-e4ee9f8ce2c4'

export default function TestePage() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header simples */}
      <div className="border-b bg-white p-4">
        <h1 className="text-2xl font-bold">Teste do Iframe Proteo KYC</h1>
        <p className="text-sm text-gray-600">
          Página de teste - iframe isolado
        </p>
      </div>

      {/* Iframe full screen */}
      <div className="h-[calc(100vh-80px)] w-full">
        <iframe
          src={PROTEO_URL}
          title="Proteo KYC - Teste"
          className="h-full w-full border-0"
          allow="camera; microphone; clipboard-write; geolocation;"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="eager"
          onLoad={() => console.log('✅ Iframe Proteo carregado!')}
          onError={(error) =>
            console.error('❌ Erro ao carregar iframe:', error)
          }
        />
      </div>
    </div>
  )
}
