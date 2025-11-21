'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setIsOpen(false)
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  if (!isMounted) {
    return null
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-blue-600"
          >
            <span className="text-2xl">₿</span>
            P2P Crypto
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-gray-700 transition hover:text-blue-600"
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className="text-gray-700 transition hover:text-blue-600"
            >
              Como Funciona
            </Link>

            {!loading && !user ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 transition hover:text-blue-600"
                >
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Registrar
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 transition hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 transition hover:text-blue-600"
                >
                  Perfil
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="space-y-4 px-4 py-4">
              <Link
                href="/"
                className="block py-2 text-gray-700 transition hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/how-it-works"
                className="block py-2 text-gray-700 transition hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Como Funciona
              </Link>

              {!loading && !user ? (
                <>
                  <Link
                    href="/login"
                    className="block py-2 text-gray-700 transition hover:text-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Registrar
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="block py-2 text-gray-700 transition hover:text-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block py-2 text-gray-700 transition hover:text-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
