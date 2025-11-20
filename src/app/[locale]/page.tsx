'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function HomePage() {
  const locale = useLocale()

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
            Plataforma P2P brasileira totalmente automatizada com verificação
            KYC obrigatória. Compre Bitcoin e outras criptomoedas com Pix ou
            TED.
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
              <span>Pix Instantâneo</span>
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
              Verificação KYC obrigatória via Proteo. Todos os dados
              criptografados e protegidos conforme LGPD.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              Pix Instantâneo
            </h3>
            <p className="text-gray-600">
              Deposite via Pix ou TED. Confirmação manual por operadores
              verificados em minutos.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all hover:scale-105">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">
              100% Brasileiro
            </h3>
            <p className="text-gray-600">
              Plataforma desenvolvida para o mercado brasileiro com suporte em
              português e compliance nacional.
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
