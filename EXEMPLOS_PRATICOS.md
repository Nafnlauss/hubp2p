# Exemplos Práticos de Uso - next-intl para Português Brasileiro

## 1. Tradução Simples (Server Component)

```typescript
// app/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('navigation');

  return (
    <nav>
      <a href="/">{t('home')}</a>
      <a href="/about">{t('about')}</a>
    </nav>
  );
}
```

## 2. Tradução com Contexto (Client Component)

```typescript
// components/Welcome.tsx
'use client';
import { useTranslations } from 'next-intl';

interface WelcomeProps {
  userName: string;
}

export function Welcome({ userName }: WelcomeProps) {
  const t = useTranslations('messages');

  return (
    <h1>{t('greeting', { name: userName })}</h1>
    // Resultado em pt-BR: "Olá, João!"
  );
}
```

## 3. Pluralização

```typescript
// components/ItemCount.tsx
'use client';
import { useTranslations } from 'next-intl';

interface ItemCountProps {
  count: number;
}

export function ItemCount({ count }: ItemCountProps) {
  const t = useTranslations('messages');

  return <p>{t('itemCount', { count })}</p>;
  // count=0: "Você tem nenhum itens"
  // count=1: "Você tem um itens"
  // count=5: "Você tem 5 itens"
}
```

## 4. Formatação de Moeda

```typescript
// components/PriceDisplay.tsx
'use client';
import { useFormatter } from 'next-intl';

interface PriceDisplayProps {
  amount: number;
}

export function PriceDisplay({ amount }: PriceDisplayProps) {
  const format = useFormatter();

  return (
    <div>
      <p>{format.number(amount, {
        style: 'currency',
        currency: 'BRL'
      })}</p>
      // Resultado: "R$ 1.299,99"
    </div>
  );
}
```

## 5. Formatação de Data

```typescript
// components/OrderDate.tsx
'use client';
import { useFormatter } from 'next-intl';

interface OrderDateProps {
  date: Date;
}

export function OrderDate({ date }: OrderDateProps) {
  const format = useFormatter();

  return (
    <div>
      <p>Pedido em {format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      // Resultado: "Pedido em 15 de novembro de 2025"
    </div>
  );
}
```

## 6. Tempo Relativo

```typescript
// components/LastUpdated.tsx
'use client';
import { useFormatter, useNow } from 'next-intl';

interface LastUpdatedProps {
  updatedAt: Date;
}

export function LastUpdated({ updatedAt }: LastUpdatedProps) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60000 });

  return (
    <p>Atualizado {format.relativeTime(updatedAt, now)}</p>
    // Resultado: "Atualizado há 2 horas"
  );
}
```

## 7. Mensagens com ICU Format

```json
// messages/pt-BR.json
{
  "invoice": {
    "total": "Total: {amount, number, currency}",
    "itemsCount": "Total de {count, plural, =0 {nenhum item} one {um item} other {# itens}}",
    "dateRange": "Período: {start, date, ::yyyyMMMd} a {end, date, ::yyyyMMMd}",
    "discount": "Desconto de {percent, number, percent}"
  }
}
```

```typescript
// Uso em componente
const t = useTranslations('invoice');

t('total', { amount: 1500 })                    // "Total: R$ 1.500,00"
t('itemsCount', { count: 3 })                   // "Total de 3 itens"
t('discount', { percent: 0.1 })                 // "Desconto de 10%"
t('dateRange', {                                // "Período: 1º jan 2025 a 31 jan 2025"
  start: new Date(2025, 0, 1),
  end: new Date(2025, 0, 31)
})
```

## 8. Detectar Locale do Usuário

```typescript
// src/i18n/request.ts
import { headers } from 'next/headers';

function detectLocale(): string {
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  const locales = acceptLanguage
    .split(',')
    .map(l => l.trim().split(';')[0]);

  const supportedLocales = ['pt-BR', 'en', 'es'];
  const userLocale = locales.find(l => supportedLocales.includes(l));

  return userLocale || 'pt-BR';
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  // ...
});
```

## 9. Seletor de Idioma com Roteamento

```typescript
// components/LanguageSwitcher.tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChangeLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(
      /^\/[^\/]+/,
      `/${newLocale}`
    );
    router.push(newPathname);
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => handleChangeLanguage('pt-BR')}>
        🇧🇷 Português
      </button>
      <button onClick={() => handleChangeLanguage('en')}>
        🇺🇸 English
      </button>
      <button onClick={() => handleChangeLanguage('es')}>
        🇪🇸 Español
      </button>
    </div>
  );
}
```

## 10. Validação de Formulários com Mensagens Localizadas

```typescript
// components/LoginForm.tsx
'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function LoginForm() {
  const t = useTranslations('forms');
  const tErrors = useTranslations('errors');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = tErrors('emailRequired');
    }

    setErrors(newErrors);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder={t('emailPlaceholder')} />
      {errors.email && (
        <p className="text-red-600">{errors.email}</p>
      )}
      <button type="submit">{t('submit')}</button>
    </form>
  );
}
```

## 11. Usando Hooks Customizados

```typescript
// Exemplo com hook useFormattingUtils
'use client';
import { useFormattingUtils } from '@/hooks/useFormattingUtils';
import { useLocaleInfo } from '@/hooks/useLocaleInfo';

export function Dashboard() {
  const fmt = useFormattingUtils();
  const localeInfo = useLocaleInfo();

  return (
    <div>
      <h1>Dashboard - {localeInfo.name} {localeInfo.flag}</h1>

      <div>
        <p>Vendas: {fmt.currency(15000)}</p>
        <p>Margem: {fmt.percentage(0.25)}</p>
        <p>Data: {fmt.dateLong(new Date())}</p>
        <p>Atualizado: {fmt.timeAgo(new Date(Date.now() - 3600000))}</p>
      </div>

      {localeInfo.isRTL && (
        <p>Essa página está em um idioma RTL</p>
      )}
    </div>
  );
}
```

## 12. Integração com API

```typescript
// lib/api.ts
import { getLocale } from 'next-intl/server';

export async function fetchProducts() {
  const locale = await getLocale();

  const response = await fetch(
    `https://api.example.com/products?locale=${locale}`
  );

  return response.json();
}
```

## 13. Middleware Customizado para Locale

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  localePrefix: 'always',
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

## 14. SEO com Hreflang

```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const allLocales = ['pt-BR', 'en', 'es'];

  return (
    <html lang={locale}>
      <head>
        {allLocales.map((loc) => (
          <link
            key={loc}
            rel="alternate"
            hrefLang={loc}
            href={`https://example.com/${loc}`}
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 15. Teste de Componentes com i18n

```typescript
// __tests__/Welcome.test.tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Welcome } from '@/components/Welcome';
import messagesPtBR from '@/messages/pt-BR.json';

test('Welcome component renders with correct translation', () => {
  render(
    <NextIntlClientProvider locale="pt-BR" messages={messagesPtBR}>
      <Welcome userName="João" />
    </NextIntlClientProvider>
  );

  expect(screen.getByText('Olá, João!')).toBeInTheDocument();
});
```

---

## Dicas de Performance

### Cache de Mensagens
```typescript
// Mensagens são carregadas uma vez por requisição
// next-intl gerencia o cache automaticamente
```

### Lazy Loading de Mensagens
```typescript
// Para apps muito grandes, considere lazy loading:
const messages = await import(`../../messages/${locale}.json`).then(
  m => m.default
);
```

### Formatação de Data Otimizada
```typescript
// Use formatos globais em vez de configurar sempre:
format.dateTime(date, 'medium') // Referencia config global

// Em vez de:
format.dateTime(date, { year: 'numeric', month: 'long', ... })
```

---

## Troubleshooting

### Erro: "No provider found"
Certifique-se que `NextIntlClientProvider` envolve o conteúdo:
```typescript
<NextIntlClientProvider messages={messages}>
  {children}
</NextIntlClientProvider>
```

### Erro: "Locale not found"
Verifique se o arquivo JSON existe em `messages/{locale}.json`

### Formatação de data incorreta
Certifique-se que a data é um objeto `Date` válido:
```typescript
// Certo
format.dateTime(new Date('2025-01-15'))

// Errado
format.dateTime('2025-01-15')
```

---

Última atualização: Novembro 2025
