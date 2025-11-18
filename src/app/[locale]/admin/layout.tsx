import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  LayoutDashboard,
  Receipt,
  Users,
  ShieldCheck,
  Bell,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"

async function checkAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userId = user.id
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    // @ts-expect-error - Supabase type inference issue
    .eq("id", userId)
    .single()

  if (!profile || !(profile as any).is_admin) {
    redirect("/")
  }

  return { user, profile: profile as { is_admin: boolean; full_name: string } }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { profile } = await checkAdmin()
  const { locale } = await params

  const navigation = [
    {
      name: "Dashboard",
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
    },
    {
      name: "Transações",
      href: `/${locale}/admin/transactions`,
      icon: Receipt,
    },
    {
      name: "Usuários",
      href: `/${locale}/admin/users`,
      icon: Users,
    },
    {
      name: "KYC Pendentes",
      href: `/${locale}/admin/kyc`,
      icon: ShieldCheck,
    },
    {
      name: "Notificações",
      href: `/${locale}/admin/notifications`,
      icon: Bell,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600" />
                <span className="text-xl font-bold">P2P Exchange</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-gray-500">Painel Administrativo</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{profile.full_name}</div>
                <div className="text-xs text-gray-500">Administrador</div>
              </div>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:top-16 lg:flex lg:w-64 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 py-4">
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:pl-64 flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
