import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

import { adminLogout, getAdminSession } from '@/app/actions/admin-auth'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin-login')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/clients', label: 'Clientes', icon: Users },
    { href: '/admin/transactions', label: 'Transações', icon: Receipt },
    {
      href: '/admin/payment-accounts',
      label: 'Contas Pagamento',
      icon: CreditCard,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin HubP2P</h1>
              <p className="text-xs text-purple-100">Painel Administrativo</p>
            </div>
          </div>

          <form action={adminLogout}>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r border-purple-100 bg-white/50 p-6 backdrop-blur-sm">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:shadow-md"
                >
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-8 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-gray-700">
                Sistema Online
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Monitorando transações em tempo real
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
