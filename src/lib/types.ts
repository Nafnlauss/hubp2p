/**
 * Tipos para internacionalização
 */

export type Locale = 'pt-BR' | 'en' | 'es'

export interface I18nConfig {
  locale: Locale
  timezone: string
  direction: 'ltr' | 'rtl'
}

export interface LocaleMessages {
  common: Record<string, string>
  navigation: Record<string, string>
  errors: Record<string, string>
  messages: Record<string, string>
  formats: Record<string, string>
  [key: string]: Record<string, string>
}
