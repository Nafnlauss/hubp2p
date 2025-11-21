import { LayoutDashboard, Menu, PlusCircle, Receipt } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

import { LogoutButton } from '@/components/LogoutButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/server'

interface DashboardLayoutProps {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

interface Profile {
  full_name: string | undefined
  cpf: string | undefined
  is_admin: boolean | undefined
  kyc_status: string | undefined
  first_deposit_completed: boolean | undefined
  wallet_configured: boolean | undefined
}

async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params

  console.log('🔍 [DASHBOARD LAYOUT] Iniciando...')

  const supabase = await createClient()
  console.log('✅ [DASHBOARD LAYOUT] Cliente Supabase criado')

  // O middleware já protege essa rota, então podemos confiar que o usuário está autenticado
  // Apenas buscar dados do perfil
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('🔍 [DASHBOARD LAYOUT] User:', user ? user.email : 'null')

  // Middleware já protege essa rota - não verificar autenticação aqui
  // Se user é null, apenas não buscar perfil (evita loop de redirecionamento)

  let typedProfile: Profile | undefined

  // Buscar perfil do usuário APENAS se user existe
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'full_name, cpf, is_admin, kyc_status, first_deposit_completed, wallet_configured',
      )
      .eq('id', user.id)
      .single()

    console.log('🔍 [DASHBOARD LAYOUT] Profile:', profile)

    typedProfile = profile as Profile | undefined

    // Redirecionar para KYC se não estiver aprovado
    if (typedProfile && typedProfile.kyc_status !== 'approved') {
      console.log(
        '🔴 [DASHBOARD LAYOUT] KYC não aprovado! Redirecionando para /kyc',
      )
      redirect(`/${locale}/kyc`)
    }
  }

  const userName =
    typedProfile?.full_name || user?.email?.split('@')[0] || 'Usuário'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/dashboard/deposit`,
      label: 'Novo Depósito',
      icon: PlusCircle,
    },
    {
      href: `/${locale}/dashboard/transactions`,
      label: 'Minhas Transações',
      icon: Receipt,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-xl font-bold text-white">₿</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HubP2P</span>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-4 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline-block">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 border-r bg-background md:block">
          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
