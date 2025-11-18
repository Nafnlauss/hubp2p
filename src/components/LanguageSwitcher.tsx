'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Locale = 'pt-BR' | 'en' | 'es';

const LANGUAGES: Record<Locale, { name: string; flag: string }> = {
  'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
  'en': { name: 'English', flag: '🇺🇸' },
  'es': { name: 'Español', flag: '🇪🇸' },
};

/**
 * Componente para alternar entre linguagens
 *
 * Em um cenário real com roteamento por locale ([locale]/page.tsx),
 * você usaria:
 * - router.push(`/${newLocale}${pathname}`, { locale: newLocale })
 *
 * Neste exemplo sem roteamento por locale, seria implementado via cookie
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Em produção com roteamento por locale:
      // const pathname = usePathname();
      // router.push(`/${newLocale}${pathname}`, { locale: newLocale });

      // Para este exemplo, salvamos a preferência em localStorage
      // (em produção, use cookies para SSR)
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLocale', newLocale);
        window.location.reload();
      }
    });
  };

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code as Locale)}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            locale === code
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="mr-2">{flag}</span>
          {name}
        </button>
      ))}
    </div>
  );
}
