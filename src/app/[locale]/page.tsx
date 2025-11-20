'use client'

import { useState } from 'react'

const PROTEO_BASE = 'https://onboarding.proteo.com.br/'
const PROTEO_TENANT = 'dias_marketplace'
const PROTEO_BACKGROUND_CHECK_ID = '3c35bb87-0b04-4130-a026-e4ee9f8ce2c4'

function formatarCPF(valor: string): string {
  const numeros = valor.replaceAll(/\D/g, '')
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function validarCPF(cpf: string): boolean {
  const numeros = cpf.replaceAll(/\D/g, '')

  if (numeros.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numeros)) return false

  let soma = 0
  for (let index = 0; index < 9; index++) {
    soma += Number.parseInt(numeros.charAt(index)) * (10 - index)
  }
  let resto = 11 - (soma % 11)
  const digito1 = resto >= 10 ? 0 : resto

  soma = 0
  for (let index = 0; index < 10; index++) {
    soma += Number.parseInt(numeros.charAt(index)) * (11 - index)
  }
  resto = 11 - (soma % 11)
  const digito2 = resto >= 10 ? 0 : resto

  return (
    Number.parseInt(numeros.charAt(9)) === digito1 &&
    Number.parseInt(numeros.charAt(10)) === digito2
  )
}

export default function KycPage() {
  const [cpf, setCpf] = useState('')
  const [cpfValido, setCpfValido] = useState(false)
  const [mostrarIframe, setMostrarIframe] = useState(false)
  const [proteoUrl, setProteoUrl] = useState('')
  const [erro, setErro] = useState('')

  const handleCpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCPF(event.target.value)
    setCpf(valorFormatado)

    const valido = validarCPF(valorFormatado)
    setCpfValido(valido)

    if (valido) {
      setErro('')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!validarCPF(cpf)) {
      setErro('CPF inválido. Por favor, verifique os números digitados.')
      return
    }

    // Remover pontos e traços do CPF
    const cpfLimpo = cpf.replaceAll(/\D/g, '')

    // Construir URL do Proteo
    const url = `${PROTEO_BASE}?tenant=${PROTEO_TENANT}&background_check_id=${PROTEO_BACKGROUND_CHECK_ID}&document=${cpfLimpo}`

    console.log('🚀 Iniciando KYC com Proteo')
    console.log('📄 CPF:', cpfLimpo)
    console.log('🔗 URL:', url)

    setProteoUrl(url)
    setMostrarIframe(true)
  }

  const voltarParaCpf = () => {
    setMostrarIframe(false)
    setCpf('')
    setCpfValido(false)
    setErro('')
  }

  if (mostrarIframe) {
    return (
      <div className="flex h-screen w-full flex-col bg-white">
        {/* Header minimalista */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xl">🔐</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Verificação de Identidade
              </h1>
              <p className="text-xs text-gray-500">CPF: {cpf}</p>
            </div>
          </div>
          <button
            onClick={voltarParaCpf}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            ← Voltar
          </button>
        </div>

        {/* Iframe do Proteo */}
        <div className="relative flex-1">
          <iframe
            src={proteoUrl}
            title="Proteo KYC"
            className="h-full w-full border-0"
            allow="camera *; microphone *; clipboard-write *; geolocation *; fullscreen *"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox allow-top-navigation"
            referrerPolicy="no-referrer"
            loading="eager"
            onLoad={() => console.log('✅ Iframe Proteo carregado')}
            onError={() => console.error('❌ Erro ao carregar iframe')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-4xl">🔐</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Verificação KYC
            </h1>
            <p className="text-blue-100">
              Digite seu CPF para iniciar a verificação de identidade
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label
                htmlFor="cpf"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full rounded-xl border-2 px-4 py-4 text-lg font-medium transition-all focus:outline-none focus:ring-4 ${
                  erro
                    ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-100'
                    : cpfValido
                      ? 'border-green-300 bg-green-50 text-green-900 focus:border-green-500 focus:ring-green-100'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />

              {/* Feedback visual */}
              <div className="mt-2 flex items-center gap-2">
                {cpfValido && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <span>✓</span>
                    <span>CPF válido</span>
                  </div>
                )}
                {erro && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <span>✗</span>
                    <span>{erro}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!cpfValido}
              className={`w-full rounded-xl py-4 text-lg font-semibold transition-all ${
                cpfValido
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              {cpfValido ? 'Continuar →' : 'Digite um CPF válido'}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-8 py-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>🔒</span>
              <span>Seus dados estão seguros e criptografados</span>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <span className="font-semibold text-blue-600">Proteo KYC</span>
          </p>
        </div>
      </div>
    </div>
  )
}
