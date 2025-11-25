import { ComprarForm } from '@/app/[locale]/comprar/_components/ComprarForm'

export default function ComprarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <span className="text-xl font-bold text-white">$</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HubP2P</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          {/* Badge */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium text-gray-700">
                Compra Instantanea via PIX
              </span>
            </div>
          </div>

          {/* Titulo */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Comprar USDT
            </h1>
            <p className="text-xl text-gray-600">
              Compre USDT de forma rapida e facil via PIX
            </p>
          </div>

          {/* Form */}
          <ComprarForm />

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Transacao Segura</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span>Envio Rapido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Sem Cadastro</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>© 2024 HubP2P. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
