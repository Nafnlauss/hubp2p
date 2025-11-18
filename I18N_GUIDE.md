# Guia Completo de Internacionalização (i18n) para Next.js 15

## Visão Geral

Este projeto implementa internacionalização profissional usando **next-intl**, a solução mais moderna e especializada para Next.js App Router.

### Por que next-intl?

| Recurso | next-intl | next-i18next |
|---------|-----------|-------------|
| App Router | ✅ Nativo | ⚠️ Wrapper |
| TypeScript | ✅ Excelente | ⚠️ Básico |
| Formatação (datas/números) | ✅ Integrado | ⚠️ Requer plugin |
| ICU MessageFormat | ✅ Nativo | ⚠️ Optional |
| Server Components | ✅ Perfeito | ❌ Limitado |
| Roteamento por locale | ✅ Integrado | ⚠️ Manual |

---

## Estrutura do Projeto

```
project/
├── messages/
│   ├── pt-BR.json          # Mensagens em português
│   ├── en.json             # Mensagens em inglês
│   └── es.json             # Mensagens em espanhol
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout com i18n
│   │   └── page.tsx        # Página inicial
│   ├── components/
│   │   ├── FormattingDemo.tsx    # Exemplos de formatação
│   │   └── LanguageSwitcher.tsx  # Seletor de idioma
│   ├── i18n/
│   │   └── request.ts      # Configuração central de i18n
│   └── middleware.ts       # Middleware para roteamento
├── next.config.ts          # Configuração Next.js com plugin
├── tsconfig.json           # Configuração TypeScript
└── package.json            # Dependências
```

---

## Instalação e Setup Inicial

### 1. Instalar Dependências

```bash
npm install next-intl
npm install --save-dev @types/react @types/react-dom typescript
```

### 2. Configurar next.config.ts

```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl({});
```

### 3. Criar Arquivo de Configuração (src/i18n/request.ts)

```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'pt-BR'; // Será dinâmico

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Configurações de formatação globais
  };
});
```

### 4. Envolver Root Layout com Provider

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({ children }) {
  const messages = await getMessages();

  return (
    <html>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## Detecção de Linguagem

### 1. Detecção Automática (Accept-Language)

```typescript
// src/i18n/request.ts
import { headers } from 'next/headers';

function detectLocale(): string {
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Parse "pt-BR,pt;q=0.9,en;q=0.8"
  const locales = acceptLanguage
    .split(',')
    .map(l => l.split(';')[0].trim());

  return locales[0] || 'pt-BR';
}
```

### 2. Detecção por Cookie

```typescript
import { cookies } from 'next/headers';

function detectLocaleFromCookie(): string {
  const store = await cookies();
  return store.get('locale')?.value || 'pt-BR';
}
```

### 3. Detecção por Roteamento ([locale])

```
app/
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/
│       └── page.tsx
└── layout.tsx
```

```typescript
// app/[locale]/layout.tsx
export default function LocaleLayout({
  params: { locale },
  children
}) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Tradução com ICU MessageFormat

### Sintaxe Básica

```json
{
  "greeting": "Olá, {name}!",
  "itemCount": "Você tem {count, plural, =0 {nenhum} one {um} other {#}} itens",
  "price": "Preço: {amount, number, currency}",
  "date": "Data: {date, date, full}"
}
```

### Uso em Componentes

#### Server Component
```typescript
// app/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('section');
  return <h1>{t('title')}</h1>;
}
```

#### Client Component
```typescript
// components/Card.tsx
'use client';
import { useTranslations } from 'next-intl';

export function Card() {
  const t = useTranslations('messages');

  return (
    <h1>{t('greeting', { name: 'João' })}</h1>
  );
}
```

### Pluralização Avançada

```json
{
  "notifications": "{count, plural, =0 {Sem mensagens} one {# mensagem} other {# mensagens}}"
}
```

---

## Formatação de Datas e Números

### Formatação de Datas

#### Hook useFormatter()

```typescript
'use client';
import { useFormatter } from 'next-intl';

export function DateExample() {
  const format = useFormatter();
  const date = new Date();

  return (
    <>
      {/* Usando formatos globais */}
      <p>{format.dateTime(date, 'short')}</p>
      <p>{format.dateTime(date, 'medium')}</p>
      <p>{format.dateTime(date, 'full')}</p>

      {/* Customizado */}
      <p>{format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </>
  );
}
```

#### Resultado em pt-BR
- Short: `15/11/2025`
- Medium: `15 de nov de 2025`
- Full: `sábado, 15 de novembro de 2025`

### Formatação de Números

```typescript
const format = useFormatter();

// Decimal
format.number(1234.567);  // 1.234,567

// Moeda
format.number(1299.99, { style: 'currency', currency: 'BRL' });
// R$ 1.299,99

// Percentual
format.number(0.85, { style: 'percent' });
// 85%
```

### Dentro de Mensagens (ICU)

```json
{
  "price": "Custa {amount, number, currency}",
  "discount": "Desconto de {percent, number, percent}",
  "date": "Pedido em {date, date, ::yyyyMMMd}"
}
```

Uso:
```typescript
t('price', { amount: 99.90 })
// "Custa R$ 99,90"
```

### Datas Relativas

```typescript
const format = useFormatter();

const pastDate = new Date(Date.now() - 3600000); // 1 hora atrás
const now = new Date();

format.relativeTime(pastDate, now);
// "há 1 hora"
```

Com atualização contínua:
```typescript
const now = useNow({ updateInterval: 60000 }); // Atualiza a cada minuto
```

---

## Suporte RTL (Right-to-Left)

Para futuro suporte a árabe, hebraico, etc:

### 1. Detectar Direção

```typescript
// lib/rtl.ts
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'ur', 'fa', 'yi'];
  return rtlLocales.some(l => locale.startsWith(l));
}

export function getDir(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
```

### 2. Aplicar no HTML

```typescript
export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getDir(locale)}>
      <body>{children}</body>
    </html>
  );
}
```

### 3. CSS Lógico (recomendado)

```css
/* Em vez de left/right, use inline-start/inline-end */
.sidebar {
  padding-inline-start: 1rem; /* left em LTR, right em RTL */
  border-inline-end: 1px solid gray; /* right em LTR, left em RTL */
}
```

---

## Middleware para Roteamento

### Configuração Completa

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  localePrefix: 'always', // /pt-BR/page, /en/page, etc
  localeDetection: true,  // Detectar do Accept-Language
});

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)(?<!/)'
  ]
};
```

### Estratégias de Roteamento

#### Path Prefix (padrão)
```
/pt-BR/sobre      → Português
/en/about         → English
/es/acerca-de     → Español
```

#### Domain Routing
```typescript
export default createMiddleware({
  locales: ['pt-BR', 'en'],
  defaultLocale: 'pt-BR',
  localePrefix: 'never',
  domains: [
    {
      domain: 'exemplo.com.br',
      defaultLocale: 'pt-BR'
    },
    {
      domain: 'example.com',
      defaultLocale: 'en'
    }
  ]
});
```

---

## Navegação Localizada

### Link com Suporte a Locale

```typescript
'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function NavigationLink() {
  const router = useRouter();
  const locale = useLocale();

  const handleClick = () => {
    // Preserva locale ao navegar
    router.push(`/${locale}/about`);
  };

  return <button onClick={handleClick}>Sobre</button>;
}
```

### Seletor de Idioma

```typescript
const handleLanguageChange = (newLocale: string) => {
  const pathname = usePathname();
  const newPathname = pathname.replace(
    /^\/[^\/]+/,
    `/${newLocale}`
  );
  router.push(newPathname);
};
```

---

## Gerenciamento de Mensagens

### Estrutura Recomendada

```json
{
  "common": {
    "appName": "...",
    "welcome": "..."
  },
  "navigation": {
    "home": "...",
    "about": "..."
  },
  "errors": {
    "notFound": "...",
    "serverError": "..."
  },
  "pages": {
    "home": { "title": "...", "description": "..." },
    "about": { "title": "...", "description": "..." }
  }
}
```

### Boas Práticas

1. **Organizar por seção/página**: `t('pages.home.title')`
2. **Reutilizar mensagens comuns**: `t('common.appName')`
3. **Não hardcodear strings**: Sempre usar `t()`
4. **Nomeação clara**: Nomes descritivos para keys
5. **Pluralização**: Usar ICU plural sempre que possível

### Validação de Tipos

```typescript
// lib/types.ts
import messages from '@/messages/pt-BR.json';

type Messages = typeof messages;

declare global {
  interface IntlMessages extends Messages {}
}
```

---

## Integração com Sistema de Tradução

### Com Crowdin (recomendado)

```typescript
// Em produção, carregar dinamicamente
const messages = await fetch(
  `https://crowdin.com/api/messages/${locale}.json`
);
```

### Com i18next-http-loader

```typescript
import HttpApi from 'i18next-http-backend';

// Configurar para carregar do servidor
```

---

## Timezone e Internacionalização Avançada

### Configurar Timezone Padrão

```typescript
// src/i18n/request.ts
export default getRequestConfig(async () => {
  return {
    locale,
    messages,
    timeZone: 'America/Sao_Paulo', // Para pt-BR
    // ou detectar dinamicamente:
    timeZone: getUserTimeZone() // Da preferência do usuário
  };
});
```

### Converter Datas com Timezone

```typescript
function formatDateInTimeZone(date: Date, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return formatter.format(date);
}
```

---

## SEO para Aplicações Multilíngues

### Hreflang Tags

```typescript
// app/layout.tsx
export default async function Layout() {
  return (
    <head>
      <link
        rel="alternate"
        hrefLang="pt-BR"
        href="https://exemplo.com.br"
      />
      <link
        rel="alternate"
        hrefLang="en"
        href="https://example.com"
      />
    </head>
  );
}
```

### Sitemap Multilíngue

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const locales = ['pt-BR', 'en', 'es'];
  const baseUrl = 'https://exemplo.com';

  return locales.flatMap(locale => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    }
  ]);
}
```

---

## Troubleshooting Comum

### Problema: Mensagens não carregam
```typescript
// Verificar se arquivo JSON existe
// messages/pt-BR.json deve estar no nível certo
// Verificar import path em request.ts
```

### Problema: Locale não detecta corretamente
```typescript
// Verificar Accept-Language header
// Testar com: `curl -H "Accept-Language: pt-BR" ...`
```

### Problema: Formatação de datas incorreta
```typescript
// Verificar timezone
// Verificar locale string (pt-BR vs pt-br)
// Usar ISO 8601 para armazenar datas
```

---

## Resumo de Comandos Úteis

```bash
# Instalar
npm install next-intl

# Desenvolvimento
npm run dev

# Build
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## Referências

- Documentação oficial: https://next-intl.dev
- Next.js i18n: https://nextjs.org/docs/pages/guides/internationalization
- ICU MessageFormat: https://unicode-org.github.io/icu/userguide/format_parse/messages/
- MDN Intl API: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl

---

**Últimas atualizações:** Novembro 2025
**Versão:** next-intl v3.14+, Next.js 15+
