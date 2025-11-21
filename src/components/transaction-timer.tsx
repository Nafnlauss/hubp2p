'use client'

import { AlertCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'

interface TransactionTimerProps {
  expiresAt: Date | string
  onExpire?: () => void
  className?: string
}

export function TransactionTimer({
  expiresAt,
  onExpire,
  className = '',
}: TransactionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpiring, setIsExpiring] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const calculateTimeLeft = () => {
      const expiresDate = new Date(expiresAt)
      const now = new Date()
      const difference = expiresDate.getTime() - now.getTime()

      if (difference <= 0) {
        setTimeLeft('00:00')
        setIsExpired(true)
        setIsExpiring(false)
        onExpire?.()
        return
      }

      // Check if less than 5 minutes (300000 ms)
      if (difference < 300_000) {
        setIsExpiring(true)
      } else {
        setIsExpiring(false)
      }

      const minutes = Math.floor(difference / 60_000)
      const seconds = Math.floor((difference % 60_000) / 1000)
      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      setTimeLeft(formattedTime)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, isMounted, onExpire])

  if (!isMounted) {
    return null
  }

  if (isExpired) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Transação expirada. Por favor, crie uma nova transação.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Clock
        className={`h-5 w-5 ${isExpiring ? 'animate-pulse text-red-500' : 'text-blue-500'}`}
      />
      <div>
        <p className="text-sm font-medium text-gray-700">Tempo Restante:</p>
        <p
          className={`font-mono text-2xl font-bold ${isExpiring ? 'text-red-500' : 'text-gray-900'}`}
        >
          {timeLeft}
        </p>
      </div>
      {isExpiring && (
        <Alert variant="destructive" className="flex-1">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Faltam menos de 5 minutos!</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
