/**
 * Utilitários práticos para i18n
 * Use esses helpers para casos comuns
 */

import { useFormatter } from 'next-intl'

import { Locale } from './types'

/**
 * Formatar valor monetário em Reais
 */
export function formatCurrency(
  amount: number,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.number(amount, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formatar percentual
 */
export function formatPercentage(
  value: number,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.number(value, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Formatar número decimal
 */
export function formatDecimal(
  value: number,
  formatter: ReturnType<typeof useFormatter>,
  digits = 2,
): string {
  return formatter.number(value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/**
 * Formatar data em formato longo (ex: "15 de novembro de 2025")
 */
export function formatDateLong(
  date: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.dateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formatar data em formato curto (ex: "15/11/2025")
 */
export function formatDateShort(
  date: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.dateTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Formatar data com hora
 */
export function formatDateTime(
  date: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.dateTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatar apenas a hora
 */
export function formatTime(
  date: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.dateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Formatar tempo relativo (ex: "há 2 horas")
 */
export function formatTimeAgo(
  date: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  const now = new Date()
  return formatter.relativeTime(date, now)
}

/**
 * Formatar intervalo de datas
 */
export function formatDateRange(
  startDate: Date,
  endDate: Date,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.dateTimeRange(startDate, endDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formatar grande número com separadores
 */
export function formatLargeNumber(
  value: number,
  formatter: ReturnType<typeof useFormatter>,
): string {
  return formatter.number(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Obter nome do mês em português
 */
export const monthNamesPtBR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

/**
 * Obter nome do dia da semana em português
 */
export const weekDayNamesPtBR = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const

/**
 * Verificar se locale é RTL
 */
export function isRTL(locale: Locale): boolean {
  const rtlLocales = ['ar', 'he', 'ur', 'fa', 'yi']
  return rtlLocales.some((l) => locale.startsWith(l))
}

/**
 * Obter direção do texto
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

/**
 * Mapear locale para código de idioma HTML
 */
export function getHtmlLangAttribute(locale: Locale): string {
  return locale.toLowerCase()
}

/**
 * Validar se é uma locale suportada
 */
export const SUPPORTED_LOCALES = ['pt-BR', 'en', 'es'] as const

export function isValidLocale(locale: unknown): locale is Locale {
  return (
    typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale as Locale)
  )
}

/**
 * Obter locale padrão
 */
export function getDefaultLocale(): Locale {
  return 'pt-BR'
}

/**
 * Parsear Accept-Language header
 */
export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((locale) => locale.trim().split(';')[0])
    .filter((locale) => locale.length > 0)
}

/**
 * Detectar locale preferida do usuário
 */
export function detectPreferredLocale(acceptLanguageHeader: string): Locale {
  const preferredLocales = parseAcceptLanguage(acceptLanguageHeader)

  for (const locale of preferredLocales) {
    if (isValidLocale(locale)) {
      return locale
    }

    // Tentar match parcial (ex: "pt" matches "pt-BR")
    const matching = SUPPORTED_LOCALES.find((l) => l.startsWith(locale))
    if (matching) {
      return matching
    }
  }

  return getDefaultLocale()
}

/**
 * Converter string de data ISO para Date
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Converter Date para string ISO
 */
export function toISOString(date: Date): string {
  return date.toISOString()
}

/**
 * Obter lista de locales disponíveis
 */
export function getAvailableLocales(): Locale[] {
  return [...SUPPORTED_LOCALES]
}

/**
 * Nomes localizados para locales
 */
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
}

/**
 * Flags/Emojis para locales (opcional)
 */
export const localeFlags: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
}

/**
 * Obter todas as locales com nomes
 */
export function getLocalesWithNames(): Array<{
  code: Locale
  name: string
  flag: string
}> {
  return SUPPORTED_LOCALES.map((code) => ({
    code,
    name: localeNames[code],
    flag: localeFlags[code],
  }))
}
