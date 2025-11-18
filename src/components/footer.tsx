'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <span className="text-2xl">₿</span>
              P2P Crypto
            </div>
            <p className="text-sm text-gray-400">
              Plataforma P2P segura para transações de criptomoedas com conformidade regulatória.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-blue-400 transition text-sm"
                >
                  Termos de Serviço
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-blue-400 transition text-sm"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/compliance"
                  className="text-gray-400 hover:text-blue-400 transition text-sm"
                >
                  Conformidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Conformidade</h3>
            <p className="text-sm text-gray-400 mb-3">
              Operamos em conformidade com as regulamentações brasileiras:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Lei 9.613/1998 (Lavagem de Dinheiro)</li>
              <li>• LGPD (Lei Geral de Proteção de Dados)</li>
              <li>• Regulações do Banco Central do Brasil</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} P2P Crypto Platform. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="Twitter"
              >
                <span className="text-sm">Twitter</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="LinkedIn"
              >
                <span className="text-sm">LinkedIn</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition"
                aria-label="GitHub"
              >
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Aviso: Criptomoedas são ativos de alto risco. Esta plataforma não fornece
            aconselhamento financeiro. Consulte um profissional antes de investir.
          </p>
        </div>
      </div>
    </footer>
  );
}
