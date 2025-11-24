'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { convertUsdToBtc, getUsdtBrlRate } from '@/lib/bitget'

// Função para formatar números no padrão brasileiro
const formatBRL = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Função para formatar input de moeda
const formatCurrencyInput = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replaceAll(/\D/g, '')
  if (!numbers) return ''

  // Converte para número e divide por 100 para ter centavos
  const numberValue = Number.parseInt(numbers, 10) / 100

  // Formata no padrão brasileiro
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Função para converter string formatada para número
const parseBRL = (value: string): number => {
  const numbers = value.replaceAll(/\D/g, '')
  return Number.parseInt(numbers, 10) / 100
}

export default function HomePage() {
  const locale = useLocale()
  const [exchangeRate, setExchangeRate] = useState<number | undefined>()
  const [baseRate, setBaseRate] = useState<number>(5.69) // Taxa base da Bitget
  const [isLoading, setIsLoading] = useState(true)
  const [brlAmount, setBrlAmount] = useState('100,00')
  const [cryptoAmount, setCryptoAmount] = useState<number | undefined>()
  const [cryptoSymbol, setCryptoSymbol] = useState<string>('USDT')
  const [selectedNetwork, setSelectedNetwork] = useState<'bitcoin' | 'usdt'>(
    'usdt',
  )

  // Calcular cotação e valor em cripto
  const calculateQuote = useCallback(async () => {
    setIsLoading(true)
    try {
      const bitgetRate = await getUsdtBrlRate()
      setBaseRate(bitgetRate)

      const markupFixed = 0.05
      const markupPercentage = 0.04
      const finalRate = bitgetRate + markupFixed + bitgetRate * markupPercentage

      setExchangeRate(finalRate)

      const amount = parseBRL(brlAmount)
      if (!Number.isNaN(amount) && amount >= 100) {
        const usdAmount = amount / finalRate

        if (selectedNetwork === 'bitcoin') {
          const btcAmount = await convertUsdToBtc(usdAmount)
          setCryptoAmount(btcAmount)
          setCryptoSymbol('BTC')
        } else {
          setCryptoAmount(usdAmount)
          setCryptoSymbol('USDT')
        }
      } else {
        setCryptoAmount(undefined)
      }
    } catch (error) {
      console.error('Erro ao calcular cotação:', error)
    } finally {
      setIsLoading(false)
    }
  }, [brlAmount, selectedNetwork])

  useEffect(() => {
    calculateQuote()
  }, [calculateQuote])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-xl font-bold text-white">₿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HubP2P</span>
          </div>
          <Link
            href={`/${locale}/login`}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-sm font-medium text-gray-700">
              Plataforma P2P Segura
            </span>
          </div>

          {/* Título */}
          <h1 className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            Compre Criptomoedas
            <br />
            de Forma Simples e Segura
          </h1>

          {/* Descrição */}
          <p className="mb-8 text-xl text-gray-600 md:text-2xl">
            Verificação KYC obrigatória. Compre Bitcoin e outras criptomoedas
            com Pix ou TED de forma rápida e segura.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/register`}
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Cadastre-se Grátis
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Criptografia SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>KYC Obrigatório</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Recebimento Rápido</span>
            </div>
          </div>
        </div>

        {/* Calculator Widget - Estilo Swapped.com */}
        <div className="mx-auto mt-16 max-w-xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <h2 className="text-center text-xl font-bold text-white">
                Simule sua compra de cripto
              </h2>
            </div>

            <div className="p-6">
              {/* Você paga */}
              <div className="mb-4">
                <p className="mb-2 block text-sm font-medium text-gray-600">
                  Você paga
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900">
                    R$
                  </span>
                  <input
                    type="text"
                    value={brlAmount}
                    onChange={(event) => {
                      const formatted = formatCurrencyInput(event.target.value)
                      setBrlAmount(formatted)
                    }}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-4 pl-16 pr-4 text-2xl font-bold text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="100,00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Valor mínimo: R$ 100,00
                </p>
              </div>

              {/* Seletor de Cripto */}
              <div className="mb-4">
                <p className="mb-2 block text-sm font-medium text-gray-600">
                  Você recebe
                </p>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('usdt')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all ${
                      selectedNetwork === 'usdt'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <span>USDT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('bitcoin')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all ${
                      selectedNetwork === 'bitcoin'
                        ? 'bg-white text-orange-500 shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-xl">₿</span>
                    <span>Bitcoin</span>
                  </button>
                </div>

                {/* Valor calculado */}
                <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-500">
                        Calculando...
                      </span>
                    </div>
                  ) : cryptoAmount === undefined ? (
                    <p className="text-center text-sm text-gray-400">
                      Digite um valor acima de R$ 100,00
                    </p>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {cryptoAmount.toLocaleString('pt-BR', {
                            minimumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                            maximumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                          })}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                          {cryptoSymbol}
                        </p>
                      </div>
                      <span className="text-4xl">
                        {cryptoSymbol === 'BTC' ? '₿' : '💵'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Taxa de câmbio com valor real cobrado (inclui 4%) */}
              {exchangeRate && (
                <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Taxa de câmbio:</span>
                    <span className="font-bold text-blue-600">
                      R$ {formatBRL(exchangeRate)}
                    </span>
                  </div>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/${locale}/register`}
                className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-center text-lg font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                Cadastre-se para comprar →
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 grid max-w-6xl gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              Segurança Total
            </h3>
            <p className="text-gray-600">
              Verificação KYC obrigatória. Todos os dados criptografados e
              protegidos conforme LGPD.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              Recebimento Rápido
            </h3>
            <p className="text-gray-600">
              Deposite via Pix ou TED. Confirmação automática e envio de
              criptomoedas em minutos.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              Compliance Mundial
            </h3>
            <p className="text-gray-600">
              Plataforma desenvolvida seguindo regras de compliance mundial, com
              suporte multilíngue e conformidade internacional.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-24 max-w-4xl rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center shadow-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            Cadastre-se agora e complete sua verificação KYC em minutos.
          </p>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Criar Conta Gratuita
            <span>→</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>© 2024 HubP2P. Todos os direitos reservados.</p>
          <p className="mt-2">
            Plataforma P2P de criptomoedas com conformidade LGPD e Lei
            9.613/1998
          </p>
        </div>
      </footer>
    </div>
  )
}
