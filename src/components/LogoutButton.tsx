'use client'

import { LogOut } from 'lucide-react'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)

      // Sign out using Supabase client
      const supabase = createClient()
      await supabase.auth.signOut()

      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Even on error, redirect to login
      window.location.href = '/login'
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center text-destructive disabled:opacity-50"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoggingOut ? 'Saindo...' : 'Sair'}
    </button>
  )
}
