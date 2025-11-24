'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { convertUsdToBtc, getUsdtBrlRate } from '@/lib/bitget'

export default function HomePage() {
  const locale = useLocale()
  const [exchangeRate, setExchangeRate] = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [brlAmount, setBrlAmount] = useState('100')
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
      const markupFixed = 0.05
      const markupPercentage = 0.04
      const finalRate = bitgetRate + markupFixed + bitgetRate * markupPercentage

      setExchangeRate(finalRate)

      const amount = Number.parseFloat(brlAmount.replace(',', '.'))
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

        {/* Calculator Widget */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Simule sua compra
            </h2>

            {/* Network Selector */}
            <div className="mb-6">
              <p className="mb-2 block text-sm font-medium text-gray-700">
                Escolha a criptomoeda:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNetwork('usdt')}
                  className={`rounded-lg border-2 px-4 py-3 font-semibold transition-all ${
                    selectedNetwork === 'usdt'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">💵</span>
                    <span>USDT</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNetwork('bitcoin')}
                  className={`rounded-lg border-2 px-4 py-3 font-semibold transition-all ${
                    selectedNetwork === 'bitcoin'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">₿</span>
                    <span>Bitcoin</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label
                htmlFor="brl-amount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Quanto você quer comprar?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
                  R$
                </span>
                <input
                  id="brl-amount"
                  type="text"
                  value={brlAmount}
                  onChange={(event) => {
                    const value = event.target.value.replaceAll(/[^\d,]/g, '')
                    setBrlAmount(value)
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 py-3 pl-12 pr-4 text-lg font-semibold focus:border-blue-600 focus:outline-none"
                  placeholder="100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Valor mínimo: R$ 100,00
              </p>
            </div>

            {/* Exchange Rate */}
            {exchangeRate && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-center text-sm text-gray-600">
                  Taxa de câmbio:{' '}
                  <span className="font-semibold text-gray-900">
                    R$ {exchangeRate.toFixed(2)} / USD
                  </span>
                </p>
              </div>
            )}

            {/* Calculated Amount */}
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Calculando...
                </span>
              </div>
            ) : (
              cryptoAmount !== undefined &&
              Number.parseFloat(brlAmount.replace(',', '.')) >= 100 && (
                <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <p className="text-center text-sm font-medium text-gray-600">
                    Você receberá aproximadamente:
                  </p>
                  <p className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-center text-4xl font-bold text-transparent">
                    {cryptoSymbol === 'BTC' ? '₿ ' : ''}
                    {cryptoAmount.toLocaleString('pt-BR', {
                      minimumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                      maximumFractionDigits: cryptoSymbol === 'BTC' ? 8 : 2,
                    })}{' '}
                    {cryptoSymbol}
                  </p>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    * Valor aproximado. A cotação final será confirmada no
                    momento da transação.
                  </p>
                </div>
              )
            )}

            {/* CTA */}
            <div className="mt-6 text-center">
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                Cadastre-se para comprar
                <span>→</span>
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
