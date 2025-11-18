'use client';

import { useLocale } from 'next-intl';
import { Locale } from '@/lib/types';
import {
  isRTL,
  getTextDirection,
  localeNames,
  localeFlags,
} from '@/lib/i18n-utils';

/**
 * Hook customizado para obter informações sobre a locale atual
 */
export function useLocaleInfo() {
  const locale = useLocale() as Locale;

  return {
    locale,
    name: localeNames[locale],
    flag: localeFlags[locale],
    isRTL: isRTL(locale),
    direction: getTextDirection(locale),
  };
}
