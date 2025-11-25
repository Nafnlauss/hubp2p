import { createSharedPathnamesNavigation } from 'next-intl/navigation'

/**
 * Navegação compartilhada entre locales
 *
 * Este arquivo cria componentes e funções de navegação que funcionam
 * automaticamente com a configuração de i18n, independente do localePrefix.
 *
 * Use `Link` deste arquivo em vez de `next/link`
 * Use `useRouter`, `usePathname` deste arquivo em vez de `next/navigation`
 */
export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({
    locales: ['pt-BR', 'en', 'es'],
    localePrefix: 'never',
  })
