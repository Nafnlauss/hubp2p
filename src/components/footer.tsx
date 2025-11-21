'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <span className="text-2xl">₿</span>
              P2P Crypto
            </div>
            <p className="text-sm text-gray-400">
              Plataforma P2P segura para transações de criptomoedas com
              conformidade regulatória.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition hover:text-blue-400"
                >
                  Termos de Serviço
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition hover:text-blue-400"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/compliance"
                  className="text-sm text-gray-400 transition hover:text-blue-400"
                >
                  Conformidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance Info */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Conformidade</h3>
            <p className="mb-3 text-sm text-gray-400">
              Operamos em conformidade com as regulamentações brasileiras:
            </p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• Lei 9.613/1998 (Lavagem de Dinheiro)</li>
              <li>• LGPD (Lei Geral de Proteção de Dados)</li>
              <li>• Regulações do Banco Central do Brasil</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-sm text-gray-400">
              © {currentYear} P2P Crypto Platform. Todos os direitos
              reservados.
            </p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition hover:text-blue-400"
                aria-label="Twitter"
              >
                <span className="text-sm">Twitter</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition hover:text-blue-400"
                aria-label="LinkedIn"
              >
                <span className="text-sm">LinkedIn</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition hover:text-blue-400"
                aria-label="GitHub"
              >
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border-t border-gray-800 pt-6">
          <p className="text-center text-xs text-gray-500">
            Aviso: Criptomoedas são ativos de alto risco. Esta plataforma não
            fornece aconselhamento financeiro. Consulte um profissional antes de
            investir.
          </p>
        </div>
      </div>
    </footer>
  )
}
