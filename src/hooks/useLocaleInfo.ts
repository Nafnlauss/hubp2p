'use client'

import { useLocale } from 'next-intl'

import {
  getTextDirection,
  isRTL,
  localeFlags,
  localeNames,
} from '@/lib/i18n-utils'
import { Locale } from '@/lib/types'

/**
 * Hook customizado para obter informações sobre a locale atual
 */
export function useLocaleInfo() {
  const locale = useLocale() as Locale

  return {
    locale,
    name: localeNames[locale],
    flag: localeFlags[locale],
    isRTL: isRTL(locale),
    direction: getTextDirection(locale),
  }
}
