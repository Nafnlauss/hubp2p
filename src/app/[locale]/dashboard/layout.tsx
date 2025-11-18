import {
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Receipt,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

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
  full_name: string | null
  cpf: string | null
  is_admin: boolean | null
  kyc_status: string | null
  first_deposit_completed: boolean | null
  wallet_configured: boolean | null
}

async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params

  console.log('🔍 [DASHBOARD LAYOUT] Iniciando...')

  let supabase
  try {
    supabase = await createClient()
    console.log('✅ [DASHBOARD LAYOUT] Cliente Supabase criado')
  } catch (error) {
    console.error(
      '❌ [DASHBOARD LAYOUT] Erro ao criar cliente Supabase:',
      error,
    )
    redirect(`/${locale}/login`)
  }

  // Verificar autenticação
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log('🔍 [DASHBOARD LAYOUT] User:', user ? user.email : 'null')
  console.log('🔍 [DASHBOARD LAYOUT] Auth error:', authError)

  if (authError || !user) {
    console.log('🔴 [DASHBOARD LAYOUT] Redirecionando para login')
    redirect(`/${locale}/login`)
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'full_name, cpf, is_admin, kyc_status, first_deposit_completed, wallet_configured',
    )
    .eq('id', user.id)
    .single()

  console.log('🔍 [DASHBOARD LAYOUT] Profile:', profile)

  const typedProfile = profile as Profile | null

  // Redirecionar para KYC se não estiver aprovado
  if (typedProfile && typedProfile.kyc_status !== 'approved') {
    console.log(
      '🔴 [DASHBOARD LAYOUT] KYC não aprovado! Redirecionando para /kyc',
    )
    redirect(`/${locale}/kyc`)
  }

  const userName =
    typedProfile?.full_name || user.email?.split('@')[0] || 'Usuário'
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
    {
      href: `/${locale}/dashboard/profile`,
      label: 'Perfil',
      icon: User,
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">P2P</span>
              </div>
              <span className="hidden font-semibold sm:inline-block">
                Plataforma P2P
              </span>
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
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </button>
                  </form>
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
