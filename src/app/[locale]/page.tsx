'use client'

import { useEffect, useState } from 'react'

const PROTEO_BASE = 'https://onboarding.proteo.com.br/'
const PROTEO_URL =
  process.env.NEXT_PUBLIC_PROTEO_KYC_URL ||
  'https://onboarding.proteo.com.br/?tenant=dias_marketplace&background_check_id=3c35bb87-0b04-4130-a026-e4ee9f8ce2c4&document=00000000000'

export default function TestePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [connectivityOk, setConnectivityOk] = useState<boolean | undefined>()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs((previous) => [...previous, logMessage])
  }

  useEffect(() => {
    addLog('🚀 Iniciando testes do iframe Proteo')
    addLog(`📍 URL: ${PROTEO_URL}`)

    // Teste 1: Verificar conectividade básica
    addLog('🔍 Teste 1: Verificando conectividade...')
    fetch(PROTEO_BASE, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        addLog('✅ Teste 1: Servidor Proteo está acessível')
        setConnectivityOk(true)
      })
      .catch((error) => {
        addLog(`❌ Teste 1: Erro de conectividade: ${error.message}`)
        setConnectivityOk(false)
      })

    // Teste 2: Tentar buscar headers (pode falhar por CORS)
    addLog('🔍 Teste 2: Tentando verificar headers...')
    fetch(PROTEO_URL)
      .then((response) => {
        addLog(
          `✅ Teste 2: Response status: ${response.status} ${response.statusText}`,
        )
        addLog(
          `📋 Teste 2: Content-Type: ${response.headers.get('content-type')}`,
        )

        // Tentar ver X-Frame-Options (geralmente bloqueado por CORS)
        const xFrameOptions = response.headers.get('x-frame-options')
        if (xFrameOptions) {
          addLog(`⚠️ Teste 2: X-Frame-Options: ${xFrameOptions}`)
        } else {
          addLog('✅ Teste 2: Sem X-Frame-Options (bom sinal!)')
        }
      })
      .catch((error) => {
        addLog(
          `⚠️ Teste 2: Erro ao buscar headers (normal por CORS): ${error.message}`,
        )
      })

    // Teste 3: Escutar mensagens do iframe
    addLog('🔍 Teste 3: Configurando listener de mensagens...')
    const handleMessage = (event: MessageEvent) => {
      addLog(`📨 Mensagem recebida de: ${event.origin}`)
      addLog(`📨 Conteúdo: ${JSON.stringify(event.data)}`)

      if (event.origin.includes('proteo.com.br')) {
        addLog('✅ Mensagem validada do Proteo')

        if (event.data?.status === 'completed') {
          addLog('🎉 KYC Concluído!')
        } else if (event.data?.error) {
          addLog(`❌ Erro do Proteo: ${JSON.stringify(event.data.error)}`)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    addLog('✅ Teste 3: Listener configurado')

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleIframeLoad = () => {
    addLog('✅ IFRAME CARREGADO COM SUCESSO!')
    setIframeLoaded(true)
    setIframeError(false)

    // Tentar verificar se o iframe tem conteúdo
    addLog('🔍 Verificando conteúdo do iframe...')
    const iframe = document.querySelector('iframe')
    if (iframe) {
      try {
        // Isso vai falhar se houver CORS/sandbox, mas vale a tentativa
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDocument) {
          addLog('✅ Conseguiu acessar documento do iframe')
          addLog(`📄 Title: ${iframeDocument.title}`)
        }
      } catch {
        addLog('⚠️ Não conseguiu acessar conteúdo (CORS/Sandbox - normal)')
      }
    }
  }

  const handleIframeError = () => {
    addLog('❌ ERRO AO CARREGAR IFRAME!')
    setIframeError(true)
    setIframeLoaded(false)
  }

  const testarURLDireta = () => {
    addLog('🔗 Abrindo URL direta em nova aba...')
    window.open(PROTEO_URL, '_blank')
  }

  const limparLogs = () => {
    setLogs([])
    addLog('🧹 Logs limpos')
  }

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      {/* Header com Status */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">
            🧪 Teste Avançado - Iframe Proteo KYC
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                connectivityOk === undefined
                  ? 'bg-gray-200 text-gray-700'
                  : connectivityOk
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {connectivityOk === undefined
                ? '⏳ Testando conexão...'
                : connectivityOk
                  ? '✅ Servidor acessível'
                  : '❌ Servidor inacessível'}
            </span>
            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                iframeLoaded
                  ? 'bg-green-100 text-green-800'
                  : iframeError
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {iframeLoaded
                ? '✅ Iframe carregado'
                : iframeError
                  ? '❌ Erro no iframe'
                  : '⏳ Carregando iframe...'}
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={testarURLDireta}
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
            >
              🔗 Abrir URL direta
            </button>
            <button
              onClick={limparLogs}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
            >
              🧹 Limpar logs
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Logs (lateral esquerda) */}
        <div className="w-96 overflow-y-auto border-r bg-gray-900 p-4 text-xs text-green-400">
          <h2 className="mb-2 font-bold text-white">📊 Logs de Debug:</h2>
          {logs.map((log, index) => (
            <div key={index} className="mb-1 font-mono">
              {log}
            </div>
          ))}
        </div>

        {/* Iframe (direita) */}
        <div className="relative flex-1">
          <iframe
            src={PROTEO_URL}
            title="Proteo KYC - Teste"
            className="h-full w-full border-0"
            allow="camera *; microphone *; clipboard-write *; geolocation *; fullscreen *"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox allow-top-navigation"
            referrerPolicy="no-referrer"
            loading="eager"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />

          {/* Overlay de erro */}
          {iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50/90">
              <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
                <div className="mb-4 text-6xl">❌</div>
                <h2 className="mb-2 text-xl font-bold text-red-600">
                  Erro ao Carregar Iframe
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  O iframe do Proteo falhou ao carregar. Verifique os logs à
                  esquerda.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  🔄 Recarregar Página
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer com URL */}
      <div className="border-t bg-gray-100 p-2 text-center text-xs text-gray-600">
        <span className="font-mono">{PROTEO_URL}</span>
      </div>
    </div>
  )
}
