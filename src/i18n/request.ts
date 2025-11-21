import { headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

// Define tipos de locales suportadas
type Locale = 'pt-BR' | 'en' | 'es'

// Mapeamento de locales disponíveis
const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es']
const DEFAULT_LOCALE: Locale = 'pt-BR'

/**
 * Detecta a linguagem preferida do usuário baseado em:
 * 1. Cookie NEXT_LOCALE (preferência do usuário)
 * 2. Accept-Language header
 * 3. Locale padrão
 */
async function detectLocale(): Promise<Locale> {
  try {
    // Em um servidor real, você teria acesso a cookies e headers
    // Para este exemplo, retornamos o padrão
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language') || ''

    // Parse Accept-Language header (ex: "pt-BR,pt;q=0.9,en;q=0.8")
    const locale_ = acceptLanguage
      .split(',')
      .map((locale) => locale.split(';')[0].trim())
      .find((locale) => SUPPORTED_LOCALES.includes(locale as Locale))

    return (locale_ as Locale) || DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export default getRequestConfig(async () => {
  // Detecta locale dinamicamente
  const locale = await detectLocale()

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Configuração de formatação global
    formats: {
      dateTime: {
        short: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        },
        medium: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
        full: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        },
        time: {
          hour: '2-digit',
          minute: '2-digit',
        },
      },
      number: {
        decimal: {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
        currency: {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
        },
      },
    },
    // Timezone padrão (importante para formatação de datas)
    timeZone: 'America/Sao_Paulo',
  }
})
