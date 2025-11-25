'use client'

import {
  ArrowRight,
  Bitcoin,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  Loader2,
  Lock,
  Shield,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { convertUsdToBtc, getUsdtBrlRate } from '@/lib/bitget'
import { Link } from '@/lib/navigation'

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
  const [exchangeRate, setExchangeRate] = useState<number | undefined>()
  const [baseRate, setBaseRate] = useState<number>(5.69)
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
    <div className="min-h-screen bg-white">
      {/* Hero Section com fundo escuro */}
      <div className="relative bg-slate-900">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-slate-900 to-purple-900/30" />

        {/* Header */}
        <header className="relative z-10">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Bitcoin className="h-6 w-6 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">HubP2P</span>
            </div>
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              Entrar
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-medium text-white/90">
                Plataforma P2P Regulamentada
              </span>
            </div>

            {/* Título */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Compre Criptomoedas
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                com Segurança
              </span>
            </h1>

            {/* Descrição */}
            <p className="mb-8 text-lg text-slate-300 md:text-xl">
              Compre Bitcoin e USDT via Pix ou TED com verificação KYC.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition-all hover:bg-slate-100 sm:w-auto"
              >
                Criar Conta
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Criptografia SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>KYC Obrigatório</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Envio em Minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4">
        {/* Calculator Widget */}
        <div className="mx-auto mt-16 max-w-md">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-center text-lg font-semibold text-slate-900">
                Simule sua compra
              </h2>
            </div>

            <div className="p-6">
              {/* Você paga */}
              <div className="mb-5">
                <label
                  htmlFor="brl-amount"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Você paga
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-500">
                    R$
                  </span>
                  <input
                    id="brl-amount"
                    type="text"
                    value={brlAmount}
                    onChange={(event) => {
                      const formatted = formatCurrencyInput(event.target.value)
                      setBrlAmount(formatted)
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-12 pr-4 text-lg font-semibold text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="100,00"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Valor mínimo: R$ 100,00
                </p>
              </div>

              {/* Seletor de Cripto */}
              <div className="mb-5">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Você recebe
                </span>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('usdt')}
                    className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                      selectedNetwork === 'usdt'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>USDT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('bitcoin')}
                    className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
                      selectedNetwork === 'bitcoin'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bitcoin className="h-4 w-4" />
                    <span>Bitcoin</span>
                  </button>
                </div>

                {/* Valor calculado */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-500">
                        Calculando...
                      </span>
                    </div>
                  ) : cryptoAmount === undefined ? (
                    <p className="text-center text-sm text-slate-400">
                      Digite um valor acima de R$ 100,00
                    </p>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          {cryptoAmount.toLocaleString('pt-BR', {
                            minimumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                            maximumFractionDigits:
                              cryptoSymbol === 'BTC' ? 8 : 2,
                          })}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-500">
                          {cryptoSymbol}
                        </p>
                      </div>
                      {cryptoSymbol === 'BTC' ? (
                        <Bitcoin className="h-8 w-8 text-orange-500" />
                      ) : (
                        <DollarSign className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Taxa de câmbio */}
              {exchangeRate && (
                <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="text-slate-600">Taxa de câmbio:</span>
                  <span className="font-medium text-slate-900">
                    R$ {formatBRL(baseRate + 0.05)} + 4%
                  </span>
                </div>
              )}

              {/* CTA */}
              <Link
                href="/register"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-all hover:bg-blue-700"
              >
                Cadastre-se para comprar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Segurança Total
            </h3>
            <p className="text-sm text-slate-600">
              Verificação KYC obrigatória. Dados criptografados e protegidos
              conforme LGPD.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Recebimento Rápido
            </h3>
            <p className="text-sm text-slate-600">
              Deposite via Pix ou TED. Confirmação automática e envio de cripto
              em minutos.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Compliance Global
            </h3>
            <p className="text-sm text-slate-600">
              Plataforma em conformidade com regulamentações nacionais e
              internacionais.
            </p>
          </div>
        </div>
      </main>

      {/* Comparison Table - Full Width Section */}
      <div className="relative mt-20 bg-slate-900">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-slate-900 to-purple-900/30" />

        <div className="container relative z-10 mx-auto px-4 py-16 md:py-20">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <span className="rounded-full bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white">
              Comparação
            </span>
          </div>

          <h2 className="mb-3 text-center text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Entre as menores taxas do mercado
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-slate-300">
            Oferecemos algumas das menores taxas para comprar crypto comparado
            aos nossos concorrentes.
          </p>

          {/* Table */}
          <div className="mx-auto max-w-4xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-400"></th>
                  <th className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                        <Bitcoin className="h-5 w-5 text-slate-900" />
                      </div>
                      <span className="font-semibold text-white">
                        hubp2p.com
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-slate-400">
                    Moonpay.com
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-slate-400">
                    Banxa.com
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-slate-400">
                    Transak.com
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="px-4 py-4 text-sm font-medium text-white">
                    PIX
                  </td>
                  <td className="px-4 py-4 text-center text-lg font-bold text-emerald-400">
                    4%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    10,13%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    7,72%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    8,27%
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm font-medium text-white">
                    Transferência Bancária
                  </td>
                  <td className="px-4 py-4 text-center text-lg font-bold text-emerald-400">
                    3,75%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    9,07%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    6,94%
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-400">
                    4,63%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Esta comparação é baseada em informações públicas de dezembro de
            2024 ao comprar $100 em crypto com preços comparados ao
            CoinMarketCap. Esta comparação não é endossada por nenhum dos
            concorrentes mencionados.
          </p>
        </div>
      </div>

      {/* CTA and Footer Section */}
      <main className="container mx-auto px-4">
        {/* CTA Section */}
        <div className="mx-auto mt-20 max-w-3xl rounded-2xl border border-slate-200 bg-slate-900 p-10 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
            Pronto para começar?
          </h2>
          <p className="mb-6 text-slate-400">
            Cadastre-se agora e complete sua verificação KYC em minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-all hover:bg-slate-100"
          >
            Criar Conta Gratuita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
          <p>© 2024 HubP2P. Todos os direitos reservados.</p>
          <p className="mt-1">Em conformidade com LGPD e Lei 9.613/1998</p>
        </div>
      </footer>
    </div>
  )
}
