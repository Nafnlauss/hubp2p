'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <span className="text-2xl">₿</span>
            P2P Crypto
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-blue-600 transition">
              Como Funciona
            </Link>

            {!loading && !user ? (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">Registrar</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition">
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
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/"
                className="block text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/how-it-works"
                className="block text-gray-700 hover:text-blue-600 transition py-2"
                onClick={() => setIsOpen(false)}
              >
                Como Funciona
              </Link>

              {!loading && !user ? (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-blue-600 transition py-2"
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
                    className="block text-gray-700 hover:text-blue-600 transition py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block text-gray-700 hover:text-blue-600 transition py-2"
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
  );
}
