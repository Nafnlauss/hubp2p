'use client'

import { useFormatter } from 'next-intl'

import {
  formatCurrency,
  formatDateLong,
  formatDateRange,
  formatDateShort,
  formatDateTime,
  formatDecimal,
  formatLargeNumber,
  formatPercentage,
  formatTime,
  formatTimeAgo,
} from '@/lib/i18n-utils'

/**
 * Hook que agrupa todos os utilitários de formatação
 * Uso: const fmt = useFormattingUtils(); fmt.currency(100)
 */
export function useFormattingUtils() {
  const formatter = useFormatter()

  return {
    currency: (amount: number) => formatCurrency(amount, formatter),
    percentage: (value: number) => formatPercentage(value, formatter),
    decimal: (value: number, digits?: number) =>
      formatDecimal(value, formatter, digits),
    dateLong: (date: Date) => formatDateLong(date, formatter),
    dateShort: (date: Date) => formatDateShort(date, formatter),
    dateTime: (date: Date) => formatDateTime(date, formatter),
    time: (date: Date) => formatTime(date, formatter),
    timeAgo: (date: Date) => formatTimeAgo(date, formatter),
    dateRange: (start: Date, end: Date) =>
      formatDateRange(start, end, formatter),
    largeNumber: (value: number) => formatLargeNumber(value, formatter),
    // Acesso direto ao formatter para casos customizados
    raw: formatter,
  }
}
