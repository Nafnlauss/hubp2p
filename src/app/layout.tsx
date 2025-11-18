import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Aplicação P2P',
  description: 'Plataforma de transações peer-to-peer',
};

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root layout com suporte a i18n
 *
 * O NextIntlClientProvider torna as traduções acessíveis
 * para Client Components em toda a aplicação
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={getTextDirection(locale)}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/**
 * Retorna a direção do texto (LTR ou RTL)
 * Útil para suporte futuro a árabe, hebraico, etc.
 */
function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const rtlLocales = ['ar', 'he', 'ur', 'fa'];
  return rtlLocales.some(rtl => locale.startsWith(rtl)) ? 'rtl' : 'ltr';
}
