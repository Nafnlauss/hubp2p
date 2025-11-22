'use client'

import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShieldCheck,
  Users,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { adminLogout } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Transações',
    href: '/admin/transactions',
    icon: Receipt,
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Contas de Pagamento',
    href: '/admin/payment-accounts',
    icon: CreditCard,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Usuários',
    href: '/admin/users',
    icon: Users,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'KYC Pendentes',
    href: '/admin/kyc',
    icon: ShieldCheck,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Notificações',
    href: '/admin/notifications',
    icon: Bell,
    color: 'from-yellow-500 to-orange-500',
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Navbar com gradiente */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-lg p-2 hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                    <span className="bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                      P
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
                    P2P Exchange
                  </h1>
                  <p className="text-xs text-gray-500">Painel Administrativo</p>
                </div>
              </div>
            </div>

            {/* User info e logout */}
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    Administrador
                  </div>
                  <div className="text-xs text-gray-500">Painel Admin</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 p-[2px] shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-purple-600">
                    AD
                  </div>
                </div>
              </div>
              <form action={adminLogout}>
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="group relative overflow-hidden border-gray-300 hover:border-red-500 hover:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar com gradiente sutil */}
        <aside
          className={cn(
            'fixed inset-y-0 top-16 z-40 w-64 transform transition-transform duration-300 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-full flex-col gap-y-5 overflow-y-auto border-r border-gray-200/50 bg-white/80 backdrop-blur-xl px-6 py-6">
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-2">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r shadow-lg shadow-purple-500/20 text-white ' + item.color
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                        )}
                      >
                        {isActive && (
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r opacity-20 blur-sm ${item.color}`} />
                        )}
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                            isActive ? 'text-white' : 'text-gray-500',
                          )}
                        />
                        <span className="relative">{item.name}</span>
                        {isActive && (
                          <div className="absolute -right-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-white" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Footer da sidebar */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">
                    Sistema Online
                  </div>
                  <div className="text-gray-600">
                    Monitorando em tempo real
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content com padrão de fundo */}
        <main className="flex-1 lg:pl-64">
          <div className="relative min-h-screen">
            {/* Padrão de fundo decorativo */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300/10 blur-3xl" />
              <div className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />
            </div>

            {/* Conteúdo */}
            <div className="relative px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
